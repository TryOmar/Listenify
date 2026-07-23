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
          <div className="w-full flex items-center justify-between gap-3">
            {/* Left Brand Header */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Headphones size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 bg-clip-text text-transparent truncate">
                    Listenify
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                    <Sparkles size={10} /> Live AI Transcription
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                  Real-time speech transcription & instant AI translation
                </p>
              </div>
            </div>

            {/* Right Creator & Community */}
            <div className="flex items-center gap-3 text-xs text-slate-600 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Created by <strong className="text-slate-900 font-bold">Omar Abbas</strong>
              </span>
              <a
                href="https://discord.gg/c3pxrhTCAB"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/90 px-3 py-1.5 rounded-xl transition-all border border-indigo-200/80 shadow-2xs"
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