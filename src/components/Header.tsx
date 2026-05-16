import { Loader2, RefreshCw, Check, UserCircle, LogOut, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  user: User | null;
  isSyncing: boolean;
  syncError: string | null;
  isDirty: boolean;
  saveData: () => void;
  handleLogout: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  handleLogin: () => void;
}

export function Header({ user, isSyncing, syncError, isDirty, saveData, handleLogout, setShowDeleteConfirm, handleLogin }: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="absolute top-0 w-full z-50 p-4 md:p-6 lg:px-12 flex justify-between items-center bg-gradient-to-b from-gray-50/90 to-transparent pointer-events-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-2xl flex items-center justify-center -rotate-3 hover:rotate-0 transition-transform shadow-lg shadow-blue-600/30">
          <span className="text-white font-black text-xl md:text-2xl tracking-tighter">%</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none pointer-events-auto flex items-center gap-2">
            Only<span className="text-blue-600 font-black">Cashbacks</span>
          </h1>
          <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5">Maximize every swipe</span>
        </div>
      </div>

      <div className="pointer-events-auto">
        {user ? (
          <div className="flex items-center gap-4">
            {syncError && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                <span>Sync Error</span>
              </div>
            )}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">{user.displayName}</span>
              <button 
                onClick={() => !isSyncing && saveData()}
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
            <div className="relative" ref={profileMenuRef}>
              <button
                aria-label="Toggle profile menu"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-gray-100 hover:ring-blue-100 transition-all flex items-center justify-center bg-gray-50 text-gray-500"
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
                    className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-2xl overflow-hidden z-[200] py-1.5"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-gray-400" />
                      Sign Out
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
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
              <span className="text-sm font-bold text-gray-900">Guest</span>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Local
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 border border-gray-200 rounded-full font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm"
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
}
