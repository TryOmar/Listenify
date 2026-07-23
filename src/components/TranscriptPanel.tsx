import React, { useEffect, useRef, useState } from 'react';
import { Mic, Trash2, Copy, Maximize, Minimize, History, Coffee } from 'lucide-react';
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
import { formatTranscriptWithLineBreaks } from '../lib/textFormat';

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

const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ru: 'ru-RU',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ar: 'ar-SA',
  hi: 'hi-IN',
  bn: 'bn-IN',
  tr: 'tr-TR',
  nl: 'nl-NL',
  pl: 'pl-PL',
  vi: 'vi-VN',
  th: 'th-TH',
  id: 'id-ID',
  ms: 'ms-MY',
  fa: 'fa-IR',
};

const getSpeechLanguageTag = (code: string) => {
  if (!code) return 'en-US';
  if (code.includes('-')) return code;
  return SPEECH_LANG_MAP[code] || `${code}-${code.toUpperCase()}`;
};

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
        const formattedText = formatTranscriptWithLineBreaks(transcript, general.breakSentences, general.lineBreakStyle);
        saveTranscript({
          title: '',
          text: formattedText,
          wordCount: formattedText.split(/\s+/).filter(Boolean).length,
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
        const formattedText = formatTranscriptWithLineBreaks(transcript, general.breakSentences, general.lineBreakStyle);
        saveTranscript({
          title: '',
          text: formattedText,
          wordCount: formattedText.split(/\s+/).filter(Boolean).length,
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

  const isListeningRef = useRef(isListening);
  const generalRef = useRef(general);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    generalRef.current = general;
  }, [general]);

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();

      // Configure for continuous recognition
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.maxAlternatives = 1;
      newRecognition.lang = getSpeechLanguageTag(general.speechLanguage);

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

      const MIN_RESTART_DELAY = 100; // Minimum delay between restarts

      const isStartedRef = { current: false };

      const safeRestart = () => {
        const state = getSessionState();
        const now = Date.now();
        const timeSinceLastRestart = now - state.lastRestartTime;

        if (!isListeningRef.current || state.manualStop || isStartedRef.current) {
          return;
        }

        // Prevent rapid restarts
        if (timeSinceLastRestart < MIN_RESTART_DELAY) {
          setTimeout(safeRestart, MIN_RESTART_DELAY - timeSinceLastRestart);
          return;
        }

        try {
          isStartedRef.current = true;
          newRecognition.start();
          updateSessionState({ lastRestartTime: now });
        } catch (error) {
          // If start fails (e.g. state transition in progress), reset ref so onend can try again cleanly
          isStartedRef.current = false;
          console.warn('Safe restart ignored:', error);
        }
      };

      newRecognition.onstart = () => {
        isStartedRef.current = true;
      };

      newRecognition.onresult = (event: SpeechRecognitionEvent) => {
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

        const combined = (finalTranscript + ' ' + interimTranscript).trim();
        const allWords = combined.split(/\s+/).filter(Boolean);
        const latestMaxWords = generalRef.current.maxWords;

        // If exceeding max words, clear everything and start fresh
        if (allWords.length > latestMaxWords) {
          if (autoClearingRef.current) return;
          autoClearingRef.current = true;
          const latestEnableSaving = generalRef.current.enableTranscriptSaving;
          const now = Date.now();
          const canSave = now - lastAutoSaveTimeRef.current > 10000;
          if (latestEnableSaving && combined && canSave) {
            const formattedText = formatTranscriptWithLineBreaks(combined, generalRef.current.breakSentences, generalRef.current.lineBreakStyle);
            saveTranscript({
              title: '',
              text: formattedText,
              wordCount: formattedText.split(/\s+/).filter(Boolean).length,
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
        console.warn('SpeechRecognition error:', event.error, event.message);

        // Don't restart for permission or audio hardware errors
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          setIsListening(false);
          isStartedRef.current = false;
          localStorage.setItem('microphoneState', 'false');
          addToast(`Microphone access error (${event.error}). Please check microphone permissions in browser settings.`, 'error');
        }
        // For non-fatal errors (no-speech, network, aborted), onend will handle clean restart
      };

      newRecognition.onend = () => {
        isStartedRef.current = false;
        const shouldBeListening = localStorage.getItem('microphoneState') === 'true' || isListeningRef.current;
        const manualStop = getSessionState().manualStop;

        if (shouldBeListening && !manualStop) {
          setTimeout(() => {
            if (isListeningRef.current && !getSessionState().manualStop && !isStartedRef.current) {
              safeRestart();
            }
          }, 200);
        }
      };

      setRecognition(newRecognition);

      return () => {
        try {
          newRecognition.stop();
        } catch (e) {
          // Ignore error on unmount
        }
      };
    }
  }, [general.speechLanguage, setTranscript, setRecognition, addToast, setIsListening]);

  // Effect to sync microphone state with localStorage
  useEffect(() => {
    localStorage.setItem('microphoneState', isListening.toString());
    console.log('Microphone state updated:', isListening, new Date().toISOString());
  }, [isListening]);

  const handleClearTranscript = async () => {
    if (general.enableTranscriptSaving && transcript.trim()) {
      try {
        const formattedText = formatTranscriptWithLineBreaks(transcript, general.breakSentences, general.lineBreakStyle);
        await saveTranscript({
          title: '',
          text: formattedText,
          wordCount: formattedText.split(/\s+/).filter(Boolean).length,
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
    if (!transcript) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all shadow-xs border",
            isListening
              ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse"
              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500"
          )}>
            <Mic size={26} />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isListening ? 'Listening for speech...' : 'Microphone is paused'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 leading-relaxed">
            {isListening
              ? 'Speak into your microphone to transcribe in real-time.'
              : 'Tap the microphone button above to start live transcription.'}
          </p>
        </div>
      );
    }

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
          const handleWordPopupOpen = () => {
            setHoveredWord(null);
            setHoverPosition(null);
            setHoveredWordRect(undefined);
            setTranslationIndex(0);
          };
          return (
            <span
              key={`word-${index}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <WordPopup word={word} onOpen={handleWordPopupOpen} />
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
        const promptText = formatTranscriptWithLineBreaks(transcript, general.breakSentences, general.lineBreakStyle);
        const response = await generateGeminiResponse(promptText, activeModel.apiKey);
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
    const newHeight = isFullscreen ? window.innerHeight * 0.95 : window.innerHeight * 0.65;
    setTranscriptHeight(newHeight);
  }, [isFullscreen]);

  const toggleListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      addToast('Speech recognition unavailable. Please use Chrome, Edge, Safari, or Opera.', 'error');
      return;
    }

    if (!recognition) return;

    if (isListening) {
      console.log('Manual stop requested');
      sessionStorage.setItem('recognitionManualStop', 'true');
      localStorage.setItem('microphoneState', 'false');
      try {
        recognition.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      setIsListening(false);
      addToast('Microphone stopped', 'info');
    } else {
      console.log('Starting microphone');
      sessionStorage.setItem('recognitionManualStop', 'false');
      localStorage.setItem('microphoneState', 'true');
      finalTranscriptRef.current = transcript;
      fullTranscriptRef.current = transcript.split(/\s+/).filter(Boolean);
      try {
        recognition.start();
        setIsListening(true);
        addToast('Microphone started', 'success');
      } catch (error) {
        console.warn('Error starting recognition (may already be running):', error);
        setIsListening(true);
        addToast('Microphone active', 'success');
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden transcript-panel">
      <div
        className="flex flex-col bg-white dark:bg-slate-900 transcript-content"
        style={{ height: `${transcriptHeight}px` }}
      >
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex justify-between items-center px-3 py-2.5 sm:px-5 sm:py-3 gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "relative flex h-3 w-3 items-center justify-center"
                )}>
                  {isListening && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  )}
                  <span className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5",
                    isListening ? "bg-red-500" : "bg-slate-300 dark:bg-slate-600"
                  )} />
                </span>
                <h2 className={cn(
                  "font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate",
                  isFullscreen ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
                )}>
                  Live Transcription
                </h2>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hidden xs:inline-block">
                {transcript.split(/\s+/).filter(Boolean).length} / {general.maxWords} w
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={toggleListening}
                className={cn(
                  "px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs",
                  isListening
                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20 animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                )}
                title={isListening ? "Pause microphone" : "Start microphone"}
              >
                <Mic size={isFullscreen ? 20 : 16} />
                <span>{isListening ? 'Listening' : 'Start Mic'}</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden xs:block" />

              <a
                href="https://buymeacoffee.com/tryomar"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 sm:p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 transition-colors"
                title="Buy me a coffee ☕"
              >
                <Coffee size={isFullscreen ? 20 : 17} />
              </a>

              <button
                onClick={handleClearTranscript}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Clear transcript"
              >
                <Trash2 size={isFullscreen ? 20 : 17} />
              </button>

              <button
                onClick={handleCopyTranscript}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Copy transcript"
              >
                <Copy size={isFullscreen ? 20 : 17} />
              </button>

              {general.enableTranscriptSaving && (
                <button
                  onClick={() => setShowHistoryPanel((v) => !v)}
                  className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Transcript History"
                >
                  <History size={isFullscreen ? 20 : 17} />
                </button>
              )}

              <SettingsDialog />

              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors hidden sm:inline-flex"
                title={isFullscreen ? "Minimize screen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={17} />}
              </button>
            </div>
          </div>
        </div>

        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto pt-3 sm:pt-4 pb-3 px-1.5 sm:px-3"
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
              lineHeight: '1.6',
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
                zIndex: 60,
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