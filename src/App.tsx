import React from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { ToastContainer } from './components/ui/Toast';
import { Headphones, Sparkles, MessageCircleHeart } from 'lucide-react';
import './App.css';

function App() {
  return (
    <>
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
        {/* Sleek Modern Top Bar Header */}
        <header className="flex-none bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2 sm:px-6 sm:py-2.5 z-40 relative shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Headphones size={18} className="sm:hidden" />
                <Headphones size={20} className="hidden sm:block" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 bg-clip-text text-transparent truncate">
                    Listenify
                  </h1>
                  <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                    <Sparkles size={10} /> Live AI Transcription
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate hidden md:block">
                  Real-time speech transcription & instant AI translation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
              <span className="hidden lg:inline-block text-[11px] text-slate-400">
                Created by <strong className="text-slate-700 font-medium">Omar Abbas</strong>
              </span>
              <a
                href="https://discord.gg/c3pxrhTCAB"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg transition-all border border-indigo-200/60"
              >
                <MessageCircleHeart size={13} />
                <span className="hidden xs:inline">Community</span>
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