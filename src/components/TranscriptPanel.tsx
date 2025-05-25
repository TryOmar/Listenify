import React, { useEffect, useRef, useState } from 'react';
import { Mic, Trash2, Copy, Maximize, Minimize, History } from 'lucide-react';
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
import { useLayoutStore } from '../store/useLayoutStore';
import { cn } from '../lib/utils';
import { ResizableSplitter } from './layout/ResizableSplitter';
import { saveTranscript } from '../lib/transcriptDb';
import { TranscriptHistoryPanel } from './layout/TranscriptHistoryPanel';
import { TranslationHoverPopup } from './TranslationHoverPopup';

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
  const { isChatPanelOpen, toggleChatPanel } = usePanelStore();
  const { addToast } = useToastStore();
  const { isFullscreen, setFullscreen } = useLayoutStore();
  const [transcriptHeight, setTranscriptHeight] = useState(window.innerHeight * 0.65); // Changed from 0.45 to 0.65
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const autoClearingRef = useRef(false);
  const lastAutoSaveTimeRef = useRef(0); // Timestamp of last auto-save
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredWordRect, setHoveredWordRect] = useState<DOMRect | undefined>(undefined);
  const [translationCache, setTranslationCache] = useState<Record<string, { matches: { translation: string }[] }>>({});
  const [translationIndex, setTranslationIndex] = useState<number>(0);
  const { enableTranslationOnHover } = general;

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
    const latestMaxWords = useSettingsStore.getState().general.maxWords;
    if (allWords.length > latestMaxWords) {
      if (autoClearingRef.current) return;
      autoClearingRef.current = true;
      const latestEnableSaving = useSettingsStore.getState().general.enableTranscriptSaving;
      const now = Date.now();
      const canSave = now - lastAutoSaveTimeRef.current > 10000;
      if (latestEnableSaving && transcript.trim() && canSave) {
        saveTranscript({
          title: '',
          text: transcript,
          wordCount: allWords.length,
          folderId: null,
        });
        lastAutoSaveTimeRef.current = now;
      }
      finalTranscriptRef.current = '';
      fullTranscriptRef.current = [];
      interimTranscriptRef.current = '';
      setTranscript('');
      autoClearingRef.current = false;
      addToast('Maximum words reached, starting fresh', 'info');
    }
    if (transcript === '') autoClearingRef.current = false;
  }, [transcript, setTranscript, addToast]);

  // Effect to update displayed transcript when words exceed limit
  useEffect(() => {
    // Get all words from current transcript
    const allWords = transcript.split(/\s+/).filter(Boolean);

    // If word count exceeds maxWords, clear and start fresh
    if (allWords.length > general.maxWords) {
      if (autoClearingRef.current) return;
      autoClearingRef.current = true;
      const latestEnableSaving = useSettingsStore.getState().general.enableTranscriptSaving;
      const now = Date.now();
      const canSave = now - lastAutoSaveTimeRef.current > 10000;
      if (latestEnableSaving && transcript.trim() && canSave) {
        saveTranscript({
          title: '',
          text: transcript,
          wordCount: allWords.length,
          folderId: null,
        });
        lastAutoSaveTimeRef.current = now;
      }
      finalTranscriptRef.current = '';
      fullTranscriptRef.current = [];
      interimTranscriptRef.current = '';
      setTranscript('');
      autoClearingRef.current = false;
      addToast('Maximum words reached, starting fresh', 'info');
    }
    if (transcript === '') autoClearingRef.current = false;
  }, [transcript, setTranscript, addToast, general.maxWords]);

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();

      // Configure for continuous recognition
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.maxAlternatives = 1;
      newRecognition.lang = general.speechLanguage;

      // Initialize state from sessionStorage or defaults
      const getSessionState = () => ({
        manualStop: sessionStorage.getItem('recognitionManualStop') === 'true',
        lastRestartTime: parseInt(sessionStorage.getItem('recognitionLastRestart') || '0'),
      });

      const updateSessionState = (updates: { manualStop?: boolean; lastRestartTime?: number }) => {
        const currentState = getSessionState();
        const newState = { ...currentState, ...updates };

        if (updates.manualStop !== undefined) {
          sessionStorage.setItem('recognitionManualStop', updates.manualStop.toString());
        }
        if (updates.lastRestartTime !== undefined) {
          sessionStorage.setItem('recognitionLastRestart', updates.lastRestartTime.toString());
        }
        return newState;
      };

      const MIN_RESTART_DELAY = 50; // Minimum delay between restarts

      const safeRestart = () => {
        const state = getSessionState();
        const now = Date.now();
        const timeSinceLastRestart = now - state.lastRestartTime;

        if (!isListening || state.manualStop) {
          console.log('Not restarting - microphone is off or manual stop', {
            isListening,
            manualStop: state.manualStop,
            lastRestart: new Date(state.lastRestartTime).toISOString()
          });
          return;
        }

        // Prevent rapid restarts
        if (timeSinceLastRestart < MIN_RESTART_DELAY) {
          console.log('Delaying restart to prevent rapid cycling');
          setTimeout(safeRestart, MIN_RESTART_DELAY - timeSinceLastRestart);
          return;
        }

        try {
          console.log('Attempting safe restart', new Date().toISOString());
          newRecognition.start();
          updateSessionState({ lastRestartTime: now });
        } catch (error) {
          console.error('Error during safe restart:', error);
          // If we fail to restart, wait a bit longer
          setTimeout(safeRestart, 1000);
        }
      };

      newRecognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('Recognition result received', new Date().toISOString());
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
        // Always get the latest maxWords from the store
        const latestMaxWords = useSettingsStore.getState().general.maxWords;

        // If exceeding max words, clear everything and start fresh
        if (allWords.length > latestMaxWords) {
          if (autoClearingRef.current) return;
          autoClearingRef.current = true;
          const latestEnableSaving = useSettingsStore.getState().general.enableTranscriptSaving;
          const now = Date.now();
          const canSave = now - lastAutoSaveTimeRef.current > 10000;
          if (latestEnableSaving && (finalTranscript + ' ' + interimTranscript).trim() && canSave) {
            saveTranscript({
              title: '',
              text: (finalTranscript + ' ' + interimTranscript).trim(),
              wordCount: allWords.length,
              folderId: null,
            });
            lastAutoSaveTimeRef.current = now;
          }
          finalTranscriptRef.current = '';
          fullTranscriptRef.current = [];
          interimTranscriptRef.current = '';
          setTranscript('');
          autoClearingRef.current = false;
        } else {
          // Update transcript normally
          fullTranscriptRef.current = allWords;
          setTranscript(allWords.join(' '));
        }
      };

      newRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Recognition error:', event.error, event.message, new Date().toISOString());

        // Don't restart for these errors
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          setIsListening(false);
          localStorage.setItem('microphoneState', 'false');
          addToast(`Microphone error: ${event.error}. Please check your microphone permissions.`, 'error');
          return;
        }

        // For other errors, try to restart if we're supposed to be listening
        if (isListening && !getSessionState().manualStop) {
          console.log('Error recovery restart');
          safeRestart();
        }
      };

      // Handle no match event
      newRecognition.onnomatch = () => {
        console.log('No match detected', new Date().toISOString());
        if (isListening && !getSessionState().manualStop) {
          console.log('Restarting after no match');
          safeRestart();
        }
      };

      // Handle speech end
      newRecognition.onspeechend = () => {
        console.log('Speech ended', new Date().toISOString());
        console.log('Session state:', getSessionState());
        console.log('isListening:', isListening);
        if (isListening && !getSessionState().manualStop) {
          console.log('Restarting after speech end');
          safeRestart();
        }
      };

      // Handle recognition end
      newRecognition.onend = () => {
        const now = new Date().toISOString();
        const shouldBeListening = localStorage.getItem('microphoneState') === 'true';

        console.log('Recognition ended - State Debug:', {
          timestamp: now,
          shouldBeListening,
          actualIsListening: isListening, // for debugging comparison
        });

        if (shouldBeListening) {
          console.log('Auto-restart based on localStorage state');
          try {
            setTimeout(() => {
              if (localStorage.getItem('microphoneState') === 'true') {
                newRecognition.start();
                console.log('Recognition restarted successfully');
              }
            }, 100);
          } catch (error) {
            console.error('Error during restart:', error);
            setTimeout(() => {
              try {
                newRecognition.start();
              } catch (retryError) {
                console.error('Retry failed:', retryError);
                setIsListening(false);
                localStorage.setItem('microphoneState', 'false');
                addToast('Failed to restart recognition', 'error');
              }
            }, 1000);
          }
        } else {
          console.log('Not restarting - microphone should be off according to localStorage');
        }
      };

      setRecognition(newRecognition);

      // Clear session state when component unmounts
      return () => {
        sessionStorage.removeItem('recognitionManualStop');
        sessionStorage.removeItem('recognitionLastRestart');
      };
    }
  }, [general.maxWords, setTranscript, setRecognition, general.speechLanguage, isListening, addToast, transcript]);

  // Effect to sync microphone state with localStorage
  useEffect(() => {
    localStorage.setItem('microphoneState', isListening.toString());
    console.log('Microphone state updated:', isListening, new Date().toISOString());
  }, [isListening]);

  const handleClearTranscript = async () => {
    if (general.enableTranscriptSaving && transcript.trim()) {
      try {
        await saveTranscript({
          title: '',
          text: transcript,
          wordCount: transcript.split(/\s+/).filter(Boolean).length,
          folderId: null,
        });
        addToast('Transcript saved to history', 'success');
      } catch {
        addToast('Failed to save transcript', 'error');
      }
    }
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
          // Only trigger translation on hover if enabled and not punctuation
          const isPunctuation = /^[.,!?;:()[\]{}'"-]+$/.test(word);
          const handleMouseEnter = (e: React.MouseEvent) => {
            if (!enableTranslationOnHover || isPunctuation) return;
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            const { clientX, clientY } = e;
            hoverTimeout.current = setTimeout(() => {
              setHoveredWord(word);
              setHoverPosition({ x: clientX, y: clientY });
              setHoveredWordRect((e.target as HTMLElement).getBoundingClientRect());
              setTranslationIndex(0);
            }, 300); // debounce 300ms
          };
          const handleMouseLeave = () => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            setHoveredWord(null);
            setHoverPosition(null);
            setHoveredWordRect(undefined);
          };
          const handleMouseMove = (e: React.MouseEvent) => {
            if (hoveredWord === word && hoverPosition) {
              setHoverPosition({ x: e.clientX, y: e.clientY });
            }
          };
          return (
            <span
              key={`word-${index}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <WordPopup word={word} />
            </span>
          );
        })}
        {/* Floating translation popup */}
        {enableTranslationOnHover && hoveredWord && hoverPosition && (
          <TranslationHoverPopup
            word={hoveredWord}
            position={hoverPosition}
            cache={translationCache}
            setCache={setTranslationCache}
            index={translationIndex}
            setIndex={setTranslationIndex}
            onClose={() => {
              setHoveredWord(null);
              setHoverPosition(null);
              setHoveredWordRect(undefined);
            }}
            wordRect={hoveredWordRect}
          />
        )}
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
      toggleChatPanel();
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

  const toggleFullscreen = () => {
    setFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  // Update initial height when fullscreen changes
  useEffect(() => {
    const newHeight = isFullscreen ? window.innerHeight * 0.95 : window.innerHeight * 0.65; // Changed from 0.75 to 0.85
    setTranscriptHeight(newHeight);
  }, [isFullscreen]);

  const toggleListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      addToast('Speech recognition unavailable. Please use Chrome or Edge or Safari or Opera for this feature.', 'error');
      return;
    }

    if (!recognition) return;

    if (isListening) {
      console.log('Manual stop requested');
      sessionStorage.setItem('recognitionManualStop', 'true');
      recognition.stop();
      setIsListening(false);
      localStorage.setItem('microphoneState', 'false');
      addToast('Microphone stopped', 'info');
    } else {
      console.log('Starting microphone');
      sessionStorage.setItem('recognitionManualStop', 'false');
      finalTranscriptRef.current = transcript;
      fullTranscriptRef.current = transcript.split(/\s+/).filter(Boolean);
      try {
        recognition.start();
        setIsListening(true);
        localStorage.setItem('microphoneState', 'true');
        addToast('Microphone started', 'success');
      } catch (error) {
        console.error('Error starting recognition:', error);
        addToast('Failed to start recognition. Please try again.', 'error');
      }
    }
  };

  // Ensure wheel always cycles translations when popup is visible
  useEffect(() => {
    if (!hoveredWord) return;
    const handleGlobalWheel = (e: WheelEvent) => {
      // Only act if popup is visible
      if (!hoveredWord) return;
      e.preventDefault();
      e.stopPropagation();
      if (!translationCache[hoveredWord] || !translationCache[hoveredWord].matches?.length) return;
      let newIndex = translationIndex;
      const translations = translationCache[hoveredWord].matches.filter((item: { translation: string }, idx: number, arr: { translation: string }[]) => arr.findIndex((t: { translation: string }) => t.translation === item.translation) === idx);
      if (e.deltaY > 0) {
        newIndex = (translationIndex + 1) % translations.length;
      } else if (e.deltaY < 0) {
        newIndex = (translationIndex - 1 + translations.length) % translations.length;
      }
      setTranslationIndex(newIndex);
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, [hoveredWord, translationCache, translationIndex]);

  return (
    <div className="flex flex-col h-full bg-white transcript-panel">
      <div
        className="flex flex-col bg-white transcript-content"
        style={{ height: `${transcriptHeight}px` }}
      >
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="flex justify-between items-center p-4 flex-wrap">
            <div className="flex items-center gap-4 flex-grow mb-2">
              <h2 className={cn(
                "font-semibold",
                isFullscreen ? "text-2xl" : "text-lg"
              )}>Live Transcription</h2>
              <span className="text-sm text-gray-500">
                {transcript.split(/\s+/).filter(Boolean).length} / {general.maxWords} words
              </span>
            </div>
            <div className="flex gap-3 flex-shrink-0 flex-wrap">
              <button
                onClick={toggleListening}
                className={`p-2 rounded-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
              >
                <Mic size={isFullscreen ? 24 : 20} />
              </button>
              <a
                href="https://discord.gg/c3pxrhTCAB"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                title="Join our Discord community"
              >
                <img src={DiscordIcon} alt="Discord" width={isFullscreen ? 24 : 20} height={isFullscreen ? 24 : 20} style={{ filter: 'invert(1)' }} />
              </a>
              <button
                onClick={handleClearTranscript}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                title="Clear transcript"
              >
                <Trash2 size={isFullscreen ? 24 : 20} />
              </button>
              <button
                onClick={handleCopyTranscript}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                title="Copy transcript"
              >
                <Copy size={isFullscreen ? 24 : 20} />
              </button>
              {general.enableTranscriptSaving && (
                <button
                  onClick={() => setShowHistoryPanel((v) => !v)}
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                  title="Transcript History"
                >
                  <History size={isFullscreen ? 24 : 20} />
                </button>
              )}
              <SettingsDialog />
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                title={isFullscreen ? "Minimize screen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={20} />}
              </button>
            </div>
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
              fontSize: isFullscreen ? `${general.fontSize * 1.2}px` : `${general.fontSize}px`,
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

      <ResizableSplitter
        onResize={setTranscriptHeight}
        minHeight={100}
        maxHeight={window.innerHeight * 0.9}
        isFullscreen={isFullscreen}
      />

      <div className="flex-1 min-h-0">
        <TranslationPanel
          textToTranslate={transcript}
          speechLanguage={general.speechLanguage}
          translationLanguage={general.translationLanguage}
        />
      </div>

      {showHistoryPanel && (
        <TranscriptHistoryPanel
          onClose={() => setShowHistoryPanel(false)}
        />
      )}
    </div>
  );
}