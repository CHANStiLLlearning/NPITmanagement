import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import GlobalSearchModal from './GlobalSearchModal';
import { Breadcrumbs } from './Breadcrumbs';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Ctrl+K trigger listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-[#0a1f44] transition-colors duration-200">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden w-full relative">
        {/* Soft backdrop overlay for maximum text legibility */}
        <div className="absolute inset-0 bg-white pointer-events-none z-0" />
        {/* Top Navbar */}
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-blue-100/80 bg-white/90 backdrop-blur-md px-6 w-full shadow-2xs">
          {/* Global Search Button Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs text-blue-700 hover:border-blue-400 hover:bg-white hover:text-blue-600 transition-all w-64 sm:w-80 justify-between shadow-2xs">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span>Search anything across NPIT…</span>
            </span>
            <kbd className="rounded-md border border-blue-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 shadow-2xs">
              Ctrl K
            </kbd>
          </button>

          {/* Right Header Tools */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Mode"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-600 transition-all">
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-3 border-l border-blue-100 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-700 to-[#2269ff] text-xs font-bold text-white shadow-sm">
                {user?.first_name ? user.first_name[0] : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#0a1f44] leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                  {user?.role}
                </p>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Full Screen Page Content */}
        <main className="relative z-10 flex-1 overflow-y-auto w-full">
          <div className="w-full px-6 py-6">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
