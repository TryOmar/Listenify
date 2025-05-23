import React, { useEffect, useState } from 'react';
import { getTranscripts, TranscriptEntry } from '../../lib/transcriptDb';

interface TranscriptHistoryPanelProps {
  onClose: () => void;
}

export function TranscriptHistoryPanel({ onClose }: TranscriptHistoryPanelProps) {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTranscripts().then((data) => {
      setTranscripts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-[100] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col z-[101]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Transcript History</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : transcripts.length === 0 ? (
            <div className="text-gray-400 text-center py-8">Transcript history will appear here.</div>
          ) : (
            <ul className="space-y-4">
              {transcripts.map((t) => (
                <li key={t.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{t.title}</div>
                    <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()} &bull; {t.wordCount} words</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">Download</button>
                    <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">Edit</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 