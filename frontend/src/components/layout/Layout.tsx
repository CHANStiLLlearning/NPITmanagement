import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import GlobalSearchModal from '../common/GlobalSearchModal';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '@/config/constants';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

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
    <div className="flex h-screen min-h-[100dvh] w-screen overflow-hidden bg-slate-50 text-[#0a1f44] transition-colors duration-200">
      {/* Desktop Permanent Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Slide-Over Drawer Navigation */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Dark Overlay Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative z-10 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col"
            >
              <div className="absolute right-3 top-4 z-20">
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar onItemClick={() => setMobileNavOpen(false)} className="w-full border-r-0" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden w-full relative min-w-0">
        {/* Soft backdrop overlay for maximum text legibility */}
        <div className="absolute inset-0 bg-white pointer-events-none z-0" />

        {/* Top Navbar */}
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-blue-100/80 bg-white/90 backdrop-blur-md px-3 sm:px-6 w-full shadow-2xs">
          <div className="flex items-center gap-2">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2269ff] hover:bg-blue-100 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Button Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 sm:px-4 py-2 text-xs text-blue-700 hover:border-blue-400 hover:bg-white hover:text-blue-600 transition-all sm:w-72 md:w-80 justify-between shadow-2xs">
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="hidden sm:inline">Search anything across NPIT…</span>
                <span className="sm:hidden text-xs">Search…</span>
              </span>
              <kbd className="hidden sm:inline-block rounded-md border border-blue-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Mode"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-600 transition-all">
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 border-l border-blue-100 pl-2 sm:pl-3">
              <button
                onClick={() => navigate('/profile')}
                title="My Profile"
                className="relative group"
              >
                {user?.photo_url ? (
                  <img
                    src={getMediaUrl(user.photo_url)}
                    alt="Profile"
                    className="h-9 w-9 rounded-full object-cover border-2 border-blue-200 group-hover:border-[#2269ff] transition-all shadow-sm"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-700 to-[#2269ff] text-xs font-bold text-white shadow-sm group-hover:ring-2 group-hover:ring-[#2269ff] transition-all">
                    {user?.first_name ? user.first_name[0] : 'U'}
                  </div>
                )}
              </button>
              <div className="hidden lg:block text-left">
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
          <div className="w-full px-3 sm:px-6 py-4 sm:py-6">
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
