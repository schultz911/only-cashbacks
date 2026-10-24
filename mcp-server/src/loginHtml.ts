/**
 * Generates the self-contained Google Sign-In HTML page for AI Assistant pairing.
 */
export function getLoginHtml(code: string, firebaseConfig: Record<string, string>): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect OnlyCashbacks — AI Assistant</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script>
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      color: #F8FAFC;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 40px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15);
      text-align: center;
    }
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      margin-bottom: 20px;
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }
    .logo-icon {
      font-size: 32px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      background: linear-gradient(to right, #FFFFFF, #CBD5E1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      color: #94A3B8;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .code-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px dashed rgba(148, 163, 184, 0.3);
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 13px;
      color: #94A3B8;
      margin-bottom: 28px;
    }
    .code-value {
      font-family: monospace;
      font-weight: 700;
      color: #60A5FA;
      font-size: 15px;
      letter-spacing: 0.05em;
    }
    .google-btn {
      width: 100%;
      background: #FFFFFF;
      color: #1E293B;
      border: none;
      padding: 14px 20px;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .google-btn:hover {
      background: #F1F5F9;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    .google-btn:active {
      transform: translateY(0);
    }
    .google-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .google-icon {
      width: 20px;
      height: 20px;
    }
    .status-msg {
      margin-top: 20px;
      font-size: 13px;
      color: #94A3B8;
      display: none;
    }
    .status-msg.error {
      color: #F87171;
      display: block;
    }
    .status-msg.loading {
      color: #60A5FA;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(96, 165, 250, 0.2);
      border-top-color: #60A5FA;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .success-view {
      display: none;
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .success-badge {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.15);
      border: 2px solid #22C55E;
      color: #22C55E;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 20px;
    }
    .user-pill {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 16px;
      margin: 16px 0;
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3B82F6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #FFF;
      overflow: hidden;
      flex-shrink: 0;
    }
    .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .user-info { overflow: hidden; }
    .user-name { font-weight: 700; font-size: 14px; color: #F8FAFC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-email { font-size: 12px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wallet-count {
      font-size: 13px;
      color: #34D399;
      font-weight: 600;
      margin-top: 4px;
    }
    .close-hint {
      color: #64748B;
      font-size: 13px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div id="auth-view">
      <div class="logo-container">
        <span class="logo-icon">💳</span>
      </div>
      <h1>Connect OnlyCashbacks</h1>
      <p class="subtitle">Sign in with your Google account to tailor AI card recommendations to your wallet.</p>
      
      <div class="code-badge">
        <span>Pairing Code:</span>
        <span class="code-value" id="display-code">${code}</span>
      </div>

      <button class="google-btn" id="login-btn" onclick="handleGoogleSignIn()">
        <svg class="google-icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Sign in with Google
      </button>

      <div class="status-msg" id="status-msg"></div>
    </div>

    <div class="success-view" id="success-view">
      <div class="success-badge">✓</div>
      <h1>Account Connected!</h1>
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
  </div>

  <script>
    const firebaseConfig = ${JSON.stringify(firebaseConfig)};
    firebase.initializeApp(firebaseConfig);

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUri = urlParams.get('redirect_uri');
    const state = urlParams.get('state');
    const codeChallenge = urlParams.get('code_challenge');
    const codeChallengeMethod = urlParams.get('code_challenge_method');

    const code = urlParams.get('code') || '${code}';
    document.getElementById('display-code').innerText = code;

    // If OAuth redirect flow, hide the manual code badge
    if (redirectUri) {
      const codeBadge = document.querySelector('.code-badge');
      if (codeBadge) codeBadge.style.display = 'none';
    }

    async function handleGoogleSignIn() {
      const btn = document.getElementById('login-btn');
      const statusMsg = document.getElementById('status-msg');
      
      btn.disabled = true;
      statusMsg.className = 'status-msg loading';
      statusMsg.innerHTML = '<div class="spinner"></div> Signing in with Google...';

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        const idToken = await user.getIdToken();

        // 1. If OAuth redirect flow, exchange with /oauth/approve and redirect back to client
        if (redirectUri) {
          statusMsg.innerHTML = '<div class="spinner"></div> Authorizing and returning to assistant...';
          const res = await fetch('/oauth/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idToken: idToken,
              codeChallenge: codeChallenge,
              codeChallengeMethod: codeChallengeMethod
            })
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Authorization failed');
          }

          const redirectUrl = new URL(redirectUri);
          redirectUrl.searchParams.set('code', data.code);
          if (state) redirectUrl.searchParams.set('state', state);
          window.location.href = redirectUrl.toString();
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

      } catch (err) {
        btn.disabled = false;
        statusMsg.className = 'status-msg error';
        statusMsg.innerText = '❌ ' + (err.message || 'Sign in failed. Please try again.');
      }
    }
  </script>
</body>
</html>`;
}
