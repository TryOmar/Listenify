import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Trash2, Copy } from 'lucide-react';
import { useTranscriptStore } from '../store/useTranscriptStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { WordPopup } from './WordPopup';
import { TextSelectionPopup } from './TextSelectionPopup';
import { SettingsDialog } from './settings/SettingsDialog';
import { useChatStore } from '../store/useChatStore';
import { usePanelStore } from '../store/usePanelStore';
import { useToastStore } from '../store/useToastStore';
import { generateGeminiResponse } from '../services/geminiService';
import { cn, isRTL } from '../lib/utils';

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

  const { general: { maxWords, fontSize, speechLanguage } } = useSettingsStore();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const interimTranscriptRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const fullTranscriptRef = useRef<string[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const { addMessage } = useChatStore();
  const { isChatPanelOpen, openChatPanel } = usePanelStore();
  const { addToast } = useToastStore();

  // Effect to update displayed transcript when maxWords changes
  useEffect(() => {
    // Get all words from current transcript
    const allWords = transcript.split(/\s+/).filter(Boolean);

    // If word count exceeds maxWords, clear and start fresh
    if (allWords.length > maxWords) {
      finalTranscriptRef.current = '';
      fullTranscriptRef.current = [];
      setTranscript('');
      addToast('Maximum words reached, starting fresh', 'info');
    }
  }, [maxWords, transcript, setTranscript, addToast]);

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

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

        // Get all words
        const allWords = (finalTranscript + ' ' + interimTranscript).trim().split(/\s+/);

        // If word count exceeds maxWords, clear and start fresh
        if (allWords.length > maxWords) {
          finalTranscriptRef.current = '';
          fullTranscriptRef.current = [];
          setTranscript('');
          addToast('Maximum words reached, starting fresh', 'info');
        } else {
          // Update transcript normally
          fullTranscriptRef.current = allWords;
          setTranscript(allWords.join(' '));
        }
      };

      recognition.onend = () => {
        // When speech recognition ends, update the final transcript
        const allWords = finalTranscriptRef.current.trim().split(/\s+/);

        // If word count exceeds maxWords, clear and start fresh
        if (allWords.length > maxWords) {
          finalTranscriptRef.current = '';
          fullTranscriptRef.current = [];
          setTranscript('');
          addToast('Maximum words reached, starting fresh', 'info');
        } else {
          // Update transcript normally
          fullTranscriptRef.current = allWords;
          setTranscript(allWords.join(' '));
        }

        // Restart recognition if it's still supposed to be listening
        if (isListening) {
          recognition.start();
        }
      };

      setRecognition(recognition);
    }
  }, [maxWords, setTranscript, setRecognition, speechLanguage]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      addToast('Microphone stopped', 'info');
    } else {
      finalTranscriptRef.current = transcript;
      fullTranscriptRef.current = transcript.split(/\s+/).filter(Boolean);
      recognition.start();
      addToast('Microphone started', 'success');
    }
    setIsListening(!isListening);
  };

  const handleClearTranscript = () => {
    clearTranscript();
    interimTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    fullTranscriptRef.current = [];
    addToast('Transcript cleared', 'info');
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    addToast('Transcript copied to clipboard', 'success');
  };

  const renderTranscript = () => {
    // Split by spaces but keep the spaces in the array
    const words = transcript.match(/\S+|\s+/g) || [];
    return words.map((word, index) => {
      // If it's a space, render it directly
      if (/^\s+$/.test(word)) {
        return <span key={`space-${index}`}>{word}</span>;
      }
      // Otherwise render the word with popup
      return <WordPopup key={`${word}-${index}`} word={word} />;
    });
  };

  // Scroll to bottom when transcript updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Add click away handler
  useEffect(() => {
    const handleClickAway = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't clear if clicking inside the popup
      if (target.closest('.text-selection-popup')) {
        return;
      }
      // Don't clear during text selection
      if (window.getSelection()?.toString()) {
        return;
      }
      setSelectedText('');
      setSelectionPosition(null);
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, []);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString();
    // Only trim leading and trailing whitespace
    if (text.trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Store the text with its internal spaces preserved
      setSelectedText(text.replace(/^\s+|\s+$/g, '')); // Only trim outer spaces
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10,
      });
    }
  };

  const handleAIPromptClick = async (prompt: string) => {
    if (!isChatPanelOpen) {
      openChatPanel();
    }

    // Add user's prompt to chat
    addMessage(prompt, 'user');

    const activeModel = useSettingsStore.getState().aiModels.find(
      model => model.id === useSettingsStore.getState().activeModelId
    );

    try {
      if (activeModel?.model === 'gemini' && activeModel.apiKey) {
        // Use Gemini
        const response = await generateGeminiResponse(prompt, activeModel.apiKey);
        addMessage(response, 'ai');
      } else {
        // Fallback to simulation
        setTimeout(() => {
          addMessage('Please configure an AI model in settings.', 'ai');
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      addToast('Error generating AI response', 'error');
    }

    // Clear selection after the action is completed
    setTimeout(() => {
      setSelectedText('');
      setSelectionPosition(null);
      window.getSelection()?.removeAllRanges();
    }, 100);
  };

  return (
    <div className="flex flex-col h-[50vh] bg-white">
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
        onMouseUp={(e) => {
          e.stopPropagation();
          handleTextSelection();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleTextSelection();
        }}
      >
        <div
          className={cn(
            "space-x-1",
            isRTL(speechLanguage) && "text-right"
          )}
          style={{
            fontSize: `${fontSize}px`,
            direction: isRTL(speechLanguage) ? 'rtl' : 'ltr'
          }}
        >
          {renderTranscript()}
        </div>
        {selectedText && selectionPosition && (
          <div
            className="text-selection-popup fixed"
            style={{
              left: `${selectionPosition.x}px`,
              top: `${selectionPosition.y}px`,
              transform: 'translate(-50%, 0)',
              zIndex: 50,
            }}
          >
            <TextSelectionPopup
              selectedText={selectedText}
              onAIPromptClick={handleAIPromptClick}
              onClose={() => {
                setSelectedText('');
                setSelectionPosition(null);
                window.getSelection()?.removeAllRanges();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}