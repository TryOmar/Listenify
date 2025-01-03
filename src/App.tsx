import React from 'react';
import { TranscriptPanel } from './components/TranscriptPanel';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-gray-900">Listenify</h1>
        <p className="text-center text-gray-600 mt-2">
          Improve your English listening skills with real-time transcription
        </p>
      </header>
      <main className="container mx-auto max-w-4xl">
        <TranscriptPanel />
      </main>
    </div>
  );
}

export default App;