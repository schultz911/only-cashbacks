// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import vm from 'node:vm';
import { getLoginHtml } from '../src/loginHtml.js';

function loginPage() {
  let finishAttestation!: (value: object) => void;
  let failAttestation!: (error: object) => void;
  const attestation = new Promise((resolve, reject) => { finishAttestation = resolve; failAttestation = reject; });
  const elements = new Map<string, any>();
  const element = (id: string) => {
    if (!elements.has(id)) elements.set(id, { disabled: id === 'login-btn', style: {}, innerText: '', className: '' });
    return elements.get(id);
  };
  const activate = vi.fn();
  const appCheck = Object.assign(() => ({ activate, getToken: vi.fn(() => attestation) }), {
    ReCaptchaEnterpriseProvider: function (this: any, key: string) { this.siteKey = key; },
  });
  const auth = {
    getRedirectResult: vi.fn(async () => null),
    signInWithPopup: vi.fn(),
    signInWithRedirect: vi.fn(async () => undefined),
  };
  const getAuth = Object.assign(vi.fn(() => auth), {
    GoogleAuthProvider: function (this: any) { this.setCustomParameters = vi.fn(); },
  });
  const fetch = vi.fn();
  const context = vm.createContext({
    firebase: { initializeApp: vi.fn(), appCheck, auth: getAuth },
    document: { getElementById: element, querySelector: () => element('code-badge') },
    window: { location: { search: '', replace: vi.fn() } }, URLSearchParams,
    console: { warn: vi.fn() }, fetch,
  });
  const html = getLoginHtml('OC-TEST', { recaptchaSiteKey: 'public-site-key' }, 'oauth-request');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  vm.runInContext(scripts.at(-1)![1], context);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const click = () => vm.runInContext('handleGoogleSignIn()', context);
  return { auth, getAuth, activate, element, fetch, context, html, finishAttestation, failAttestation, flush, click };
}

describe('standalone plugin login', () => {
  it('activates App Check before Auth and waits for attestation before enabling Google sign-in', async () => {
    const page = loginPage();
    expect(page.activate.mock.calls[0][0]).toMatchObject({ siteKey: 'public-site-key' });
    expect(page.activate.mock.invocationCallOrder[0]).toBeLessThan(page.getAuth.mock.invocationCallOrder[0]);
    expect(page.auth.getRedirectResult).not.toHaveBeenCalled();
    expect(page.element('login-btn').disabled).toBe(true);
    page.finishAttestation({ token: 'test-attestation' });
    await page.flush();
    expect(page.auth.getRedirectResult).toHaveBeenCalledOnce();
    expect(page.element('login-btn').disabled).toBe(false);
    expect(page.html).toContain('/12.13.0/firebase-app-check-compat.js');
  });

  it('shows attestation errors without making Auth requests or redirecting', async () => {
    const page = loginPage();
    page.failAttestation({ code: 'appCheck/fetch-status-error' });
    await page.flush();
    expect(page.auth.getRedirectResult).not.toHaveBeenCalled();
    expect(page.auth.signInWithPopup).not.toHaveBeenCalled();
    expect(page.auth.signInWithRedirect).not.toHaveBeenCalled();
    expect(page.element('status-msg').innerText).toContain('Browser verification failed');
    expect(page.element('login-btn').disabled).toBe(false);
  });

  it('does not mislabel internal sign-in errors or account-link failures as popup blocking', async () => {
    const page = loginPage();
    page.finishAttestation({ token: 'test-attestation' });
    await page.flush();
    page.auth.signInWithPopup.mockRejectedValueOnce({ code: 'auth/internal-error', message: 'Sign-in failed' });
    await page.click();
    expect(page.element('status-msg').innerText).toBe('Sign-in failed');
    expect(page.auth.signInWithRedirect).not.toHaveBeenCalled();
    page.auth.signInWithPopup.mockResolvedValueOnce({ user: { getIdToken: async () => 'test-identity' } });
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Authorization request expired' }) });
    await page.click();
    expect(page.element('status-msg').innerText).toBe('Authorization request expired');
    expect(page.auth.signInWithRedirect).not.toHaveBeenCalled();
  });

  it('uses redirect fallback only for an unavailable popup and shows redirect recovery errors', async () => {
    const page = loginPage();
    page.finishAttestation({ token: 'test-attestation' });
    await page.flush();
    page.auth.signInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-blocked' });
    await page.click();
    expect(page.auth.signInWithRedirect).toHaveBeenCalledOnce();
    page.auth.getRedirectResult.mockRejectedValueOnce({ message: 'Redirect recovery failed' });
    await vm.runInContext('initializeSignIn()', page.context);
    expect(page.element('status-msg').innerText).toBe('Redirect recovery failed');
    expect(page.element('login-btn').disabled).toBe(false);
  });
});
