import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import { useTranscriptStore } from '../store/useTranscriptStore';
import { WordPopup } from './WordPopup';
import { SettingsDialog } from './settings/SettingsDialog';

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

  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const handleClearTranscript = () => {
    clearTranscript();
  };

  const renderTranscript = () => {
    return transcript.split(' ').map((word, index) => (
      <WordPopup key={index} word={word} />
    ));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Live Transcription</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
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
        <div className="space-x-1 text-lg">
          {renderTranscript()}
        </div>
      </div>
    </div>
  );
}