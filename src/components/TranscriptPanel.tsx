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
import DiscordIcon from '../icons/discord.svg';
import { TranslationPanel } from './TranslationPanel';

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

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
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

const breakTextIntoSentences = (text: string, lineBreakStyle: 'single' | 'double'): string => {
  if (!text) return '';
  // Split by sentence endings (.!?) but keep the punctuation
  const breakChar = lineBreakStyle === 'single' ? '\n' : '\n\n';
  return text.replace(/([.!?])\s+/g, `$1${breakChar}`);
};

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

  const { general } = useSettingsStore();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const interimTranscriptRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const fullTranscriptRef = useRef<string[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const { addMessage } = useChatStore();
  const { isChatPanelOpen, openChatPanel } = usePanelStore();
  const { addToast } = useToastStore();

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = () => {
    if (!transcriptRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = transcriptRef.current;
    // Consider "at bottom" if within 10 pixels of the bottom
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    shouldScrollRef.current = isAtBottom;
  };

  // Smart scroll to bottom that respects user position
  const scrollToBottomIfNeeded = () => {
    if (!transcriptRef.current || !shouldScrollRef.current) return;

    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  };

  // Effect to handle transcript updates and scrolling
  useEffect(() => {
    scrollToBottomIfNeeded();
  }, [transcript]);

  // Add scroll event listener
  useEffect(() => {
    const transcriptElement = transcriptRef.current;
    if (!transcriptElement) return;

    transcriptElement.addEventListener('scroll', handleScroll);
    return () => {
      transcriptElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Effect to handle maxWords changes from settings
  useEffect(() => {
    const allWords = transcript.split(/\s+/).filter(Boolean);
    if (allWords.length > general.maxWords) {
      finalTranscriptRef.current = '';
      fullTranscriptRef.current = [];
      interimTranscriptRef.current = '';
      setTranscript('');
      addToast(`Transcript cleared to match new ${general.maxWords} words limit`, 'info');
    }
  }, [general.maxWords, transcript, setTranscript, addToast]);

  // Effect to update displayed transcript when words exceed limit
  useEffect(() => {
    // Get all words from current transcript
    const allWords = transcript.split(/\s+/).filter(Boolean);

    // If word count exceeds maxWords, clear and start fresh
    if (allWords.length > general.maxWords) {
      finalTranscriptRef.current = '';
      fullTranscriptRef.current = [];
      interimTranscriptRef.current = '';
      setTranscript('');
      addToast('Maximum words reached, starting fresh', 'info');
    }
  }, [transcript, setTranscript, addToast, general.maxWords]);

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = general.speechLanguage;

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

        // If exceeding max words, clear everything and start fresh
        if (allWords.length > general.maxWords) {
          finalTranscriptRef.current = '';
          fullTranscriptRef.current = [];
          interimTranscriptRef.current = '';
          setTranscript('');
        } else {
          // Update transcript normally
          fullTranscriptRef.current = allWords;
          setTranscript(allWords.join(' '));
        }
      };

      // Shared retry logic
      const retryWithBackoff = (attempt = 1, source = 'unknown') => {
        console.log('Retrying with backoff', attempt, source);
        console.log('isListening', isListening);
        if (!isListening) return;

        const backoffTime = Math.min(1000 * Math.pow(1.5, attempt - 1), 10000);

        setTimeout(() => {
          if (!isListening) return;

          try {
            recognition.start();
            console.log(`Recognition restarted after ${source}`);
          } catch (error) {
            console.error(`Error restarting recognition (attempt ${attempt}):`, error);
            retryWithBackoff(attempt + 1, source);
          }
        }, backoffTime);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Recognition error:', event.error);
        retryWithBackoff(1, 'error');
      };

      recognition.onend = () => {
        // When speech recognition ends, update the final transcript
        const allWords = finalTranscriptRef.current.trim().split(/\s+/);

        // If exceeding max words, clear everything and start fresh
        if (allWords.length > general.maxWords) {
          finalTranscriptRef.current = '';
          fullTranscriptRef.current = [];
          interimTranscriptRef.current = '';
          setTranscript('');
        } else {
          // Update transcript normally
          fullTranscriptRef.current = allWords;
          setTranscript(allWords.join(' '));
        }

        // If still listening but recognition ended, restart it
        if (isListening) {
          try {
            recognition.start();
          } catch (error) {
            console.error('Error in onend handler:', error);
            retryWithBackoff(1, 'end');
          }
        }
      };

      setRecognition(recognition);
    }
  }, [general.maxWords, setTranscript, setRecognition, general.speechLanguage]);

  const toggleListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      addToast('Speech recognition unavailable. Please use Chrome or Edge or Safari or Opera for this feature.', 'error');
      return;
    }

    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      addToast('Microphone stopped', 'info');
    } else {
      finalTranscriptRef.current = transcript;
      fullTranscriptRef.current = transcript.split(/\s+/).filter(Boolean);
      try {
        recognition.start();
        setIsListening(true);
        addToast('Microphone started', 'success');
      } catch (error) {
        console.error('Error starting recognition:', error);
        addToast('Failed to start recognition. Please try again.', 'error');
      }
    }
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
    if (!transcript) return null;

    const displayText = general.breakSentences
      ? breakTextIntoSentences(transcript, general.lineBreakStyle)
      : transcript;

    // Split text into words but preserve natural spacing
    const words = displayText.split(/(\s+)/g).filter(Boolean);

    return (
      <div className="transcript-text whitespace-pre-wrap break-words" onMouseUp={handleTextSelection}>
        {words.map((word, index) => {
          if (/^\s+$/.test(word)) {
            // Render spaces without any wrapper to maintain natural text flow
            return word;
          }
          // For actual words, wrap in WordPopup with no extra spacing
          return <WordPopup key={`word-${index}`} word={word} />;
        })}
      </div>
    );
  };

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
    <div className="flex flex-col space-y-4 h-full bg-white">
      <div className="flex flex-col h-[45vh] bg-white">
        <div className="flex justify-between items-center p-4 border-b flex-wrap">
          <div className="flex items-center gap-4 flex-grow mb-2">
            <h2 className="text-lg font-semibold">Live Transcription</h2>
            <span className="text-sm text-gray-500">
              {transcript.split(/\s+/).filter(Boolean).length} / {general.maxWords} words
            </span>
          </div>
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            <button
              onClick={toggleListening}
              className={`p-2 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <a
              href="https://discord.gg/c3pxrhTCAB"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              title="Join our Discord community"
            >
              <img src={DiscordIcon} alt="Discord" width="20" height="20" style={{ filter: 'invert(1)' }} />
            </a>
            <button
              onClick={handleClearTranscript}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              title="Clear transcript"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleCopyTranscript}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              title="Copy transcript"
            >
              <Copy size={20} />
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
            className="transcript-container"
            dir="auto"
            style={{
              fontSize: `${general.fontSize}px`,
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
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
      <TranslationPanel textToTranslate={transcript} speechLanguage={general.speechLanguage} translationLanguage={general.translationLanguage} />
    </div>
  );
}