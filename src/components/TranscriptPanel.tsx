import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Trash2, Copy } from 'lucide-react';
import { useTranscriptStore } from '../store/useTranscriptStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { WordPopup } from './WordPopup';
import { SettingsDialog } from './settings/SettingsDialog';

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResult[] & {
    length: number;
  };
};

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function TranscriptPanel() {
  const {
    transcript,
    isListening,
    recognition,
    setTranscript,
    setIsListening,
    setRecognition,
    clearTranscript,
  } = useTranscriptStore();

  const { general: { maxWords, fontSize } } = useSettingsStore();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const interimTranscriptRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const fullTranscriptRef = useRef<string[]>([]);

  // Effect to update displayed transcript when maxWords changes
  useEffect(() => {
    // Get all available words from either fullTranscript or current transcript
    const allWords = fullTranscriptRef.current.length > 0
      ? fullTranscriptRef.current
      : transcript.split(/\s+/).filter(Boolean);

    // Store in fullTranscript if not already there
    if (fullTranscriptRef.current.length === 0 && allWords.length > 0) {
      fullTranscriptRef.current = allWords.slice(-5000);
    }

    // Update displayed transcript with last maxWords
    const displayedWords = allWords.slice(-maxWords);
    setTranscript(displayedWords.join(' '));
  }, [maxWords, transcript, setTranscript]);

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += ' ' + transcriptText;
            finalTranscriptRef.current = finalTranscript;
          } else {
            interimTranscript += ' ' + transcriptText;
          }
        }

        // Store interim transcript for reference
        interimTranscriptRef.current = interimTranscript;

        // Update full transcript (limited to 5000 words)
        const allWords = (finalTranscript + ' ' + interimTranscript).trim().split(/\s+/);
        fullTranscriptRef.current = allWords.slice(-5000);

        // Display only the last maxWords
        const displayedWords = fullTranscriptRef.current.slice(-maxWords);
        setTranscript(displayedWords.join(' '));
      };

      recognition.onend = () => {
        // When speech recognition ends, update the final transcript
        const allWords = finalTranscriptRef.current.trim().split(/\s+/);
        fullTranscriptRef.current = allWords.slice(-5000);
        const displayedWords = fullTranscriptRef.current.slice(-maxWords);
        setTranscript(displayedWords.join(' '));
      };

      setRecognition(recognition);
    }
  }, [maxWords, setTranscript, setRecognition]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      finalTranscriptRef.current = transcript;
      fullTranscriptRef.current = transcript.split(/\s+/).filter(Boolean);
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const handleClearTranscript = () => {
    clearTranscript();
    interimTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    fullTranscriptRef.current = [];
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript);
  };

  const renderTranscript = () => {
    return transcript.split(/\s+/).filter(Boolean).map((word, index) => (
      <WordPopup key={`${word}-${index}`} word={word} />
    ));
  };

  // Scroll to bottom when transcript updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Live Transcription</h2>
          <span className="text-sm text-gray-500">
            {transcript.split(/\s+/).filter(Boolean).length} / {maxWords} words
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={handleCopyTranscript}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Copy transcript"
          >
            <Copy size={20} />
          </button>
          <button
            onClick={handleClearTranscript}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Trash2 size={20} />
          </button>
          <SettingsDialog />
        </div>
      </div>
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <div
          className="space-x-1"
          style={{ fontSize: `${fontSize}px` }}
        >
          {renderTranscript()}
        </div>
      </div>
    </div>
  );
}