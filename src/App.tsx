import React from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { ToastContainer } from './components/ui/Toast';
import './App.css';

function App() {
  return (
    <>
      <div className="flex flex-col h-screen bg-gray-100">
        <header className="py-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold text-gray-900">Listenify</h1>
            <span className="text-sm text-gray-500 mt-6">by Omar Abbas</span>
          </div>
          <p className="text-gray-600 mt-2">
            Improve your English listening skills with real-time transcription.
          </p>
          <p className="text-xs text-gray-500 opacity-75">
            Free access link available in Ameer Joy's Discord profile, #release channel
          </p>
        </header>
        <main className="flex-1 overflow-hidden">
          <MainLayout />
        </main>
      </div>
      <ToastContainer />
    </>
  );
}

export default App;