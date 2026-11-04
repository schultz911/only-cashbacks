import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { removeLegacyRuntimeCaches } from './lib/pwaCacheMigration';

import { AuthSyncProvider } from './contexts/AuthSyncContext.tsx';
import { WalletProvider } from './contexts/WalletContext.tsx';
import { SearchProvider } from './contexts/SearchContext.tsx';

removeLegacyRuntimeCaches();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', removeLegacyRuntimeCaches);
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthSyncProvider>
        <WalletProvider>
          <SearchProvider>
            <App />
          </SearchProvider>
        </WalletProvider>
      </AuthSyncProvider>
    </ErrorBoundary>
  </StrictMode>,
);