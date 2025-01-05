import React from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { ToastContainer } from './components/ui/Toast';
import './App.css';

function App() {
  return (
    <>
      <div className="flex flex-col h-screen bg-gray-100">
        <header className="py-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Listenify</h1>
          <p className="text-gray-600 mt-2">
            Improve your English listening skills with real-time transcription
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