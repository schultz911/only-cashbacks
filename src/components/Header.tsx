import React from 'react';
import { 
  Search, History, Plane, Loader2, Sparkles, Globe, Wallet, QrCode, X, 
  ChevronDown, Check, UserCircle, LogOut, AlertCircle, Ticket, Tag, 
  Info, RefreshCw, Trash2, Store, Moon, Sun, CloudOff, Cloud, Undo2, 
  RotateCcw, Banknote, Download, PiggyBank 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';

interface HeaderProps {
  user: User | null;
  isAuthLoading: boolean;
  openRouterApiKey: string;
  setTempApiKey: (key: string) => void;
  setIsApiModalOpen: (open: boolean) => void;
  isSyncing: boolean;
  saveData: () => void;
  syncError: string | null;
  isDirty: boolean;
  isSyncPaused: boolean;
  setIsSyncPaused: (paused: boolean) => void;
  theme: 'light' | 'dark' | 'oled';
  setTheme: (theme: 'light' | 'dark' | 'oled' | ((prev: 'light' | 'dark' | 'oled') => 'light' | 'dark' | 'oled')) => void;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
  handleLogin: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  profileMenuRef: React.RefObject<HTMLDivElement>;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  user,
  isAuthLoading,
  openRouterApiKey,
  setTempApiKey,
  setIsApiModalOpen,
  isSyncing,
  saveData,
  syncError,
  isDirty,
  isSyncPaused,
  setIsSyncPaused,
  theme,
  setTheme,
  isProfileMenuOpen,
  setIsProfileMenuOpen,
  handleLogout,
  handleLogin,
  setShowDeleteConfirm,
  profileMenuRef
}) => {
  return (
    <header className="sticky top-0 z-[200] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 shrink-0 bg-[#0095f6] rounded-full flex items-center justify-center shadow-md relative overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] mt-0.5 ml-0.5" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M 50 15 A 35 35 0 1 0 50 85 A 35 35 0 0 0 50 15 Z M 50 35 A 15 15 0 1 1 50 65 A 15 15 0 0 1 50 35 Z" />
              <path d="M 68 35 C 75 35 85 40 90 30 C 88 45 80 50 72 50 C 82 50 95 60 92 75 C 80 75 70 65 65 60 L 65 35 Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none pb-1">
              OnlyCashbacks
            </h1>
            <p className="text-[10px] sm:text-[10px] md:text-xs font-bold tracking-widest text-[#0095f6] uppercase leading-tight">
              Make Your Credit Cards Pay
            </p>
          </div>
        </div>

        {isAuthLoading ? (
          <div className="w-9 h-9 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            {!openRouterApiKey && (
              <div className="relative group flex items-center">
                <button aria-label="Open API settings"
                  onClick={() => { setTempApiKey(openRouterApiKey); setIsApiModalOpen(true); }} 
                  className="flex items-center justify-center bg-amber-100 text-amber-700 p-2 rounded-full hover:bg-amber-200 transition-colors shadow-sm"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-max max-w-[200px] bg-gray-900 border border-gray-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-center">
                  API not set. Live verification is unavailable. Using local database. Click to set.
                </div>
              </div>
            )}
            
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.displayName}</span>
              <button
                onClick={() => !isSyncing && saveData()}
                aria-label="Sync status"
                disabled={isSyncing}
                className={cn(
                  "flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest transition-all hover:opacity-80 disabled:opacity-50",
                  syncError ? "text-amber-600" : isDirty ? "text-blue-600" : "text-green-600"
                )}
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : syncError ? (
                  <RefreshCw className="w-3 h-3" />
                ) : isDirty ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                {isSyncing ? 'Syncing...' : syncError ? 'Sync Now' : isDirty ? 'Pending Save' : 'Synced'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group flex">
                <button
                  onClick={() => setIsSyncPaused(!isSyncPaused)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md text-gray-600 hover:scale-105 active:scale-95"
                  aria-label={isSyncPaused ? "Enable Cloud Sync" : "Enable Offline Mode"}
                >
                  {isSyncPaused ? (
                    <CloudOff className="w-5 h-5 text-amber-500 transition-transform group-hover:scale-110" />
                  ) : (
                    <Cloud className={cn("w-5 h-5 transition-transform group-hover:scale-110", isDirty ? "text-blue-500 group-hover:text-blue-400" : "text-emerald-500 group-hover:text-emerald-400")} />
                  )}
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 border border-gray-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl z-50">
                  {isSyncPaused ? "Enable Cloud Sync" : (isDirty ? "Cloud Sync: Pending" : "Cloud Sync: Saved")}
                </div>
              </div>

              <div className="relative group flex">
                <button
                  onClick={() => {
                    setTheme((prev: any) => prev === 'light' ? 'dark' : prev === 'dark' ? 'oled' : 'light');
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md text-gray-600 hover:scale-105 active:scale-95"
                  aria-label="Switch Theme"
                >
                  {theme === 'oled' ? (
                    <Moon className="w-5 h-5 text-amber-500 fill-amber-500 transition-transform group-hover:rotate-12" />
                  ) : theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-amber-500 transition-transform group-hover:-rotate-12" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500 transition-transform group-hover:rotate-45" />
                  )}
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-gray-900 border border-gray-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl z-50">
                  {theme === 'light' ? "Switch to Dark Mode" : theme === 'dark' ? "Switch to OLED Mode" : "Switch to Light Mode"}
                </div>
              </div>
            </div>

            <div className="relative" ref={profileMenuRef}>
              <button
                aria-label="Toggle profile menu"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm ring-2 ring-gray-100 dark:ring-gray-800 hover:ring-blue-100 transition-all flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-6 h-6" />
                )}
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800 shadow-2xl rounded-2xl overflow-hidden z-[200] py-1.5"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-gray-400" />
                      Sign Out
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete all data
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Guest</span>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Local
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
});
