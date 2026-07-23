import React, { useEffect, useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { ToastContainer } from './components/ui/Toast';
import { Headphones, Sparkles, MessageCircleHeart, Sun, Moon } from 'lucide-react';
import { useSettingsStore } from './store/useSettingsStore';
import './App.css';

function App() {
  const { general, updateGeneralSettings } = useSettingsStore();
  const [isSystemDark, setIsSystemDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isDarkActive =
    general.theme === 'dark' ||
    (general.theme === 'system' && isSystemDark);

  useEffect(() => {
    if (isDarkActive) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkActive]);

  const toggleTheme = () => {
    const nextTheme = isDarkActive ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
    updateGeneralSettings({ theme: nextTheme });
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors">
        {/* Sleek Modern Top Bar Header */}
        <header className="flex-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 py-2 sm:px-6 sm:py-2.5 z-40 relative shadow-xs">
          <div className="w-full flex items-center justify-between gap-3">
            {/* Left Brand Header */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Headphones size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-300 bg-clip-text text-transparent truncate">
                    Listenify
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/80">
                    <Sparkles size={10} /> Live AI Transcription
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  Real-time speech transcription & instant AI translation
                </p>
              </div>
            </div>

            {/* Right Creator & Community */}
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 shrink-0">
              <span className="hidden xs:inline text-xs text-slate-500 dark:text-slate-400 font-medium">
                Created by <strong className="text-slate-900 dark:text-slate-100 font-bold">Omar Abbas</strong>
              </span>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 transition-colors border border-slate-200/80 dark:border-slate-700 flex items-center justify-center"
                title={isDarkActive ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkActive ? (
                  <Sun size={17} className="text-amber-400" />
                ) : (
                  <Moon size={17} className="text-indigo-600" />
                )}
              </button>

              <a
                href="https://discord.gg/c3pxrhTCAB"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/80 px-3 py-1.5 rounded-xl transition-all border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs"
              >
                <MessageCircleHeart size={14} />
                <span className="hidden sm:inline">Community</span>
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <MainLayout />
        </main>
      </div>
      <ToastContainer />
    </>
  );
}

export default App;