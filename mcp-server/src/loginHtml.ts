import { ONLYCASHBACKS_LOGO } from './brand.js';

/**
 * Generates the self-contained Google Sign-In HTML page for AI Assistant pairing.
 */
export function getLoginHtml(code: string, firebaseConfig: Record<string, string>, oauthRequestId?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect your wallet | OnlyCashbacks</title>
  <meta name="theme-color" content="#F5F5F7">
  <link rel="icon" type="image/png" href="${ONLYCASHBACKS_LOGO}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/12.13.0/firebase-app-check-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/12.13.0/firebase-auth-compat.js"></script>
  <script>
    try {
      const savedTheme = JSON.parse(localStorage.getItem('oc_theme') || 'null');
      const theme = ['light', 'dark', 'oled'].includes(savedTheme) ? savedTheme : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = theme;
    } catch (_) {}
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (var i = 0; i < regs.length; i++) {
          regs[i].unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then(function(names) {
          for (var i = 0; i < names.length; i++) {
            caches.delete(names[i]);
          }
        });
      }
    }
  </script>
  <style>
    :root { color-scheme: light; --page: #F5F5F7; --surface: #ffffff; --text: #1D1D1F; --muted: #6b7280; --line: #e5e7eb; --soft: #f3f4f6; --accent: #0095f6; --button: #111827; --button-text: #fff; }
    :root[data-theme="dark"], :root[data-theme="oled"] { color-scheme: dark; --page: #0f172a; --surface: #1e293b; --text: #f8fafc; --muted: #94a3b8; --line: #334155; --soft: #263449; --button: #f8fafc; --button-text: #111827; }
    :root[data-theme="oled"] { --page: #000; --surface: #111; --line: #262626; --soft: #1c1c1c; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; min-height: 100svh; background: var(--page); color: var(--text); font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    .site-header { border-bottom: 1px solid var(--line); background: var(--surface); }
    .header-inner { max-width: 1152px; margin: auto; padding: 20px 24px; }
    .brand { display: inline-flex; align-items: center; gap: 12px; color: var(--text); text-decoration: none; }
    .brand-icon { display: block; width: 52px; height: 52px; border-radius: 50%; object-fit: contain; background: #fff; }
    .brand-name { display: block; font-size: 22px; font-weight: 800; letter-spacing: -.8px; line-height: 1.2; }
    .brand-tagline { display: block; margin-top: 5px; color: var(--accent); font-size: 10px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; }
    main { display: flex; align-items: center; justify-content: center; min-height: calc(100svh - 94px); padding: 48px 24px; }
    .connection { width: 100%; max-width: 480px; }
    .intro { margin: 0 4px 22px; }
    .eyebrow { display: inline-flex; align-items: center; gap: 8px; color: var(--accent); font-size: 10px; font-weight: 800; letter-spacing: 1.8px; text-transform: uppercase; }
    .eyebrow::before { content: ''; width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
    .intro h1 { font-size: clamp(28px, 5vw, 36px); letter-spacing: -1.3px; line-height: 1.2; font-weight: 800; margin: 12px 0 10px; }
    .intro p { color: var(--muted); font-size: 14px; line-height: 1.7; margin: 0; }
    .card { background: var(--surface); border: 1px solid var(--line); border-radius: 32px; padding: 32px; box-shadow: 0 10px 30px rgba(15,23,42,.04); }
    .card-brand { display: flex; align-items: center; gap: 13px; padding-bottom: 24px; border-bottom: 1px solid var(--line); margin-bottom: 24px; }
    .card-logo { width: 52px; height: 52px; object-fit: contain; background: #fff; border-radius: 50%; flex-shrink: 0; }
    .card-brand strong { display: block; font-size: 15px; letter-spacing: -.3px; }
    .card-brand span { display: block; font-size: 12px; color: var(--muted); margin-top: 4px; }
    .benefits { list-style: none; padding: 0; margin: 0 0 28px; display: grid; gap: 16px; }
    .benefits li { display: flex; align-items: center; gap: 12px; }
    .check { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 8px; color: var(--accent); background: rgba(0,149,246,.09); font-size: 13px; font-weight: 800; flex-shrink: 0; }
    .benefits strong { display: block; font-size: 12px; font-weight: 700; }
    .benefits small { display: block; color: var(--muted); font-size: 11px; line-height: 1.6; margin-top: 2px; }
    .code-badge { background: var(--soft); border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; color: var(--muted); font-size: 11px; }
    .code-value { color: var(--text); font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
    .google-btn { width: 100%; border: 0; border-radius: 16px; min-height: 54px; padding: 16px; background: var(--button); color: var(--button-text); font: 700 14px 'Plus Jakarta Sans', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: transform .15s, opacity .15s; }
    .google-btn:hover:not(:disabled) { transform: translateY(-1px); opacity: .9; }
    .google-btn:focus-visible, .brand:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }
    .google-btn:disabled { opacity: .55; cursor: wait; }
    .google-icon { width: 20px; height: 20px; background: #fff; border-radius: 50%; padding: 2px; }
    .status-msg { display: none; margin-top: 18px; font-size: 12px; line-height: 1.6; text-align: center; }
    .status-msg.error { color: #dc2626; display: block; }
    .status-msg.loading { color: var(--muted); display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner { width: 15px; height: 15px; border: 2px solid var(--line); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .privacy-note { text-align: center; margin: 18px 8px 0; color: var(--muted); font-size: 11px; line-height: 1.8; }
    .page-footer { text-align: center; margin-top: 25px; font-size: 10px; font-weight: 700; color: var(--muted); letter-spacing: .4px; }
    .success-view { display: none; text-align: center; }
    .success-badge { display: inline-flex; align-items: center; justify-content: center; width: 54px; height: 54px; border-radius: 18px; color: #059669; background: rgba(16,185,129,.1); font-size: 28px; margin-bottom: 18px; }
    .success-view h2 { font-size: 25px; letter-spacing: -.8px; margin: 0 0 10px; }
    .subtitle, .close-hint { color: var(--muted); font-size: 12px; line-height: 1.8; }
    .user-pill { display: flex; align-items: center; gap: 12px; text-align: left; background: var(--soft); border: 1px solid var(--line); border-radius: 18px; padding: 16px; margin: 24px 0; }
    .user-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; overflow: hidden; flex-shrink: 0; }
    .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .user-info { min-width: 0; }
    .user-name { color: var(--text); font-size: 13px; font-weight: 800; }
    .user-email { color: var(--muted); font-size: 11px; overflow-wrap: anywhere; margin-top: 3px; }
    .wallet-count { color: #059669; font-size: 11px; font-weight: 700; margin-top: 6px; }
    @media (max-width: 480px) { .header-inner { padding: 16px 20px; } .brand-name { font-size: 20px; } .brand-icon { width: 44px; height: 44px; } main { padding: 32px 18px; align-items: flex-start; } .card { padding: 24px; border-radius: 26px; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="https://only-cashbacks.up.railway.app" aria-label="OnlyCashbacks home">
        <img class="brand-icon" src="${ONLYCASHBACKS_LOGO}" alt="" width="52" height="52">
        <span><span class="brand-name">OnlyCashbacks</span><span class="brand-tagline">Make Your Credit Cards Pay</span></span>
      </a>
    </div>
  </header>
  <main>
    <div class="connection">
      <div class="intro">
        <span class="eyebrow">Your wallet, connected</span>
        <h1>Make every purchase count.</h1>
        <p>Connect your OnlyCashbacks account for recommendations that know your cards.</p>
      </div>
      <section class="card" aria-label="Connect your OnlyCashbacks account">
    <div id="auth-view">
      <div class="card-brand">
        <img class="card-logo" src="${ONLYCASHBACKS_LOGO}" alt="OnlyCashbacks" width="52" height="52">
        <div><strong>Your cards. Your rewards.</strong><span>One account, wherever you ask.</span></div>
      </div>
      <ul class="benefits">
        <li><span class="check" aria-hidden="true">✓</span><div><strong>The cards you own</strong><small>Your selected wallet, ready to use.</small></div></li>
        <li><span class="check" aria-hidden="true">✓</span><div><strong>Rewards that fit your spending</strong><small>Your saved offer usage and reward settings.</small></div></li>
        <li><span class="check" aria-hidden="true">✓</span><div><strong>Always your account</strong><small>Sign in with the Google account you use for OnlyCashbacks.</small></div></li>
      </ul>
      <div class="code-badge"><span>Connection code</span><span class="code-value" id="display-code">${code}</span></div>

      <button class="google-btn" id="login-btn" onclick="handleGoogleSignIn()" disabled>
        <svg class="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Sign in with Google
      </button>

      <div class="status-msg" id="status-msg" role="status" aria-live="polite"></div>
      <p class="privacy-note">Your saved cards and reward settings will be available to your assistant. You can disconnect at any time.</p>
    </div>

    <div class="success-view" id="success-view">
      <div class="success-badge">✓</div>
      <h2>You’re connected.</h2>
      <p class="subtitle">Your AI assistant now has access to your OnlyCashbacks wallet.</p>
      
      <div class="user-pill" id="user-pill">
        <div class="user-avatar" id="avatar-container">?</div>
        <div class="user-info">
          <div class="user-name" id="user-name">User</div>
          <div class="user-email" id="user-email">email@example.com</div>
          <div class="wallet-count" id="card-count"></div>
        </div>
      </div>

      <p class="close-hint">You can safely close this browser tab and return to your AI assistant.</p>
    </div>
      </section>
      <footer class="page-footer">OnlyCashbacks · Better cards for every checkout.</footer>
    </div>
  </main>

  <script>
    const firebaseConfig = ${JSON.stringify(firebaseConfig)};
    firebase.initializeApp(firebaseConfig);
    // Authentication enforcement requires App Check on this standalone page too.
    // Activate it before creating Auth so Auth can attach attestation tokens.
    const appCheck = firebase.appCheck();
    appCheck.activate(
      new firebase.appCheck.ReCaptchaEnterpriseProvider(firebaseConfig.recaptchaSiteKey),
      true
    );
    const auth = firebase.auth();
    let appCheckReady = false;

    const urlParams = new URLSearchParams(window.location.search);
    const oauthRequestId = ${JSON.stringify(oauthRequestId || '')};

    const code = urlParams.get('code') || '${code}';
    document.getElementById('display-code').innerText = code;

    // If OAuth redirect flow, hide the manual code badge
    if (oauthRequestId) {
      const codeBadge = document.querySelector('.code-badge');
      if (codeBadge) codeBadge.style.display = 'none';
    }

    async function finishAuthWithUser(user) {
      const statusMsg = document.getElementById('status-msg');
      const idToken = await user.getIdToken();

      // 1. If OAuth redirect flow, exchange with /oauth/approve and redirect back to client
      if (oauthRequestId) {
        statusMsg.innerHTML = '<div class="spinner"></div> Authenticated! Returning to ChatGPT...';
        const res = await fetch('/oauth/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: idToken,
            requestId: oauthRequestId
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Authorization failed');
        }

        window.location.replace(data.redirectUrl);
        return;
      }

      // 2. Otherwise standard code pairing flow
      statusMsg.innerHTML = '<div class="spinner"></div> Linking with your assistant...';

      const res = await fetch('/api/auth/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, idToken: idToken })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to link account');
      }

      // Show success view
      document.getElementById('auth-view').style.display = 'none';
      document.getElementById('success-view').style.display = 'block';

      document.getElementById('user-name').innerText = user.displayName || 'OnlyCashbacks User';
      document.getElementById('user-email').innerText = user.email || '';
      document.getElementById('card-count').innerText = '💳 ' + (data.cardCount || 0) + ' cards synced';
      
      if (user.photoURL) {
        document.getElementById('avatar-container').innerHTML = '<img src="' + user.photoURL + '" alt="Avatar" referrerpolicy="no-referrer">';
      } else {
        document.getElementById('avatar-container').innerText = (user.displayName || 'U')[0].toUpperCase();
      }
    }

    function showAuthError(err, stage) {
      console.warn(stage, err.code || err.message || 'Unknown sign-in error');
      const btn = document.getElementById('login-btn');
      const statusMsg = document.getElementById('status-msg');
      btn.disabled = false;
      statusMsg.className = 'status-msg error';
      if ((err.code || '').startsWith('appCheck/') || (err.code || '').startsWith('app-check/')) {
        statusMsg.innerText = 'Browser verification failed. Reload this page and try again. If this continues, contact the OnlyCashbacks administrator.';
      } else if (err.code === 'auth/unauthorized-domain') {
        statusMsg.innerText = 'This sign-in domain is not authorized. Contact the OnlyCashbacks administrator.';
      } else {
        statusMsg.innerText = err.message || 'Unable to connect your account. Please try again.';
      }
    }

    async function initializeSignIn() {
      const btn = document.getElementById('login-btn');
      const statusMsg = document.getElementById('status-msg');
      btn.disabled = true;
      statusMsg.className = 'status-msg loading';
      statusMsg.innerHTML = '<div class="spinner"></div> Verifying your browser...';
      try {
        // Complete attestation before any Auth request, including redirect recovery.
        // Preloading also keeps the popup call directly inside the user's click.
        await appCheck.getToken(false);
        appCheckReady = true;
        const result = await auth.getRedirectResult();
        if (result && result.user) {
          await finishAuthWithUser(result.user);
          return;
        }
        btn.disabled = false;
        statusMsg.className = 'status-msg';
      } catch (err) {
        showAuthError(err, 'Sign-in initialization failed:');
      }
    }

    initializeSignIn();

    async function handleGoogleSignIn() {
      if (!appCheckReady) {
        await initializeSignIn();
        return;
      }
      const btn = document.getElementById('login-btn');
      const statusMsg = document.getElementById('status-msg');
      btn.disabled = true;
      statusMsg.className = 'status-msg loading';
      statusMsg.innerHTML = '<div class="spinner"></div> Signing in with Google...';

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      let result;
      try {
        result = await auth.signInWithPopup(provider);
      } catch (err) {
        if (!['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(err.code)) {
          showAuthError(err, 'Google sign-in failed:');
          return;
        }
        console.warn('Popup unavailable, attempting redirect sign-in:', err.code);
        try {
          statusMsg.innerHTML = '<div class="spinner"></div> Redirecting to Google Sign-In...';
          await auth.signInWithRedirect(provider);
        } catch (redirectErr) {
          showAuthError(redirectErr, 'Redirect sign-in failed:');
        }
        return;
      }
      try {
        await finishAuthWithUser(result.user);
      } catch (err) {
        showAuthError(err, 'Account connection failed:');
      }
    }
  </script>
</body>
</html>`;
}
