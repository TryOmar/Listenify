import React, { useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ExternalLink, Volume2 } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { speakText } from '../lib/tts';
import { useChatStore } from '../store/useChatStore';
import { usePanelStore } from '../store/usePanelStore';
import { useToastStore } from '../store/useToastStore';
import { generateGeminiResponse } from '../services/geminiService';
import { LANGUAGES } from '../constants/languages';

interface WordPopupProps {
  word: string;
  preventSave?: boolean;
  onOpen?: () => void;
  onHoverContent?: () => void;
}

export function WordPopup({ word, preventSave = false, onOpen, onHoverContent }: WordPopupProps) {
  const { actions, prompts, general } = useSettingsStore();
  const { addMessage } = useChatStore();
  const { isChatPanelOpen, openChatPanel } = usePanelStore();
  const { addToast } = useToastStore();

  // Add window blur handler
  useEffect(() => {
    const handleWindowBlur = () => {
      const popoverTrigger = document.querySelector('[data-state="open"]') as HTMLElement;
      if (popoverTrigger) {
        popoverTrigger.click(); // Close the popover
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, []);

  const getLanguageLabel = (code: string) => {
    return LANGUAGES.find(lang => lang.value === code)?.label || code;
  };

  const getProcessedUrl = (url: string) => {
    return url
      .replaceAll('{word}', encodeURIComponent(word))
      .replaceAll('{speech_language}', getLanguageLabel(general.speechLanguage))
      .replaceAll('{translation_language}', getLanguageLabel(general.translationLanguage))
      .replaceAll('{speech_language_code}', general.speechLanguage)
      .replaceAll('{translation_language_code}', general.translationLanguage);
  };

  const handleAIPromptClick = async (prompt: string) => {
    // Close the popover after clicking
    const popoverTrigger = document.querySelector('[data-state="open"]') as HTMLElement;
    if (popoverTrigger) {
      popoverTrigger.click();
    }

    // Open chat panel if it's closed
    if (!isChatPanelOpen) {
      openChatPanel();
    }

    // Process and send the prompt
    const processedPrompt = prompt
      .replaceAll('{word}', word)
      .replaceAll('{speech_language}', getLanguageLabel(general.speechLanguage))
      .replaceAll('{translation_language}', getLanguageLabel(general.translationLanguage))
      .replaceAll('{speech_language_code}', general.speechLanguage)
      .replaceAll('{translation_language_code}', general.translationLanguage);

    // Add user's prompt to chat
    addMessage(processedPrompt, 'user');

    const activeModel = useSettingsStore.getState().aiModels.find(
      model => model.id === useSettingsStore.getState().activeModelId
    );

    try {
      if (activeModel?.model === 'gemini' && activeModel.apiKey) {
        // Use Gemini
        const response = await generateGeminiResponse(processedPrompt, activeModel.apiKey);
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
  };

  const handleTextActionClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
    // Close the popover after clicking
    const popoverTrigger = document.querySelector('[data-state="open"]') as HTMLElement;
    if (popoverTrigger) {
      popoverTrigger.click();
    }
  };

  const wordPrompts = prompts.filter(p => p.type === 'word');

  const addWordToSavedItems = (word: string) => {
    const savedWords = JSON.parse(localStorage.getItem('savedWords') || '[]');
    const existingIndex = savedWords.indexOf(word);
    if (existingIndex !== -1) {
      savedWords.splice(existingIndex, 1);
    }
    savedWords.unshift(word); // Add to the beginning for reverse order
    localStorage.setItem('savedWords', JSON.stringify(savedWords));
    window.dispatchEvent(new Event('storage')); // Trigger update
  };

  // Call addWordToSavedItems when a word is clicked
  const handleWordClick = () => {
    if (!preventSave) {
      addWordToSavedItems(word);
    }
  };

  return (
    <Popover.Root onOpenChange={open => { if (open && onOpen) onOpen(); }}>
      <Popover.Trigger asChild>
        <button className="inline hover:bg-blue-100 dark:hover:bg-slate-800 rounded transition-colors" style={{ padding: 0, margin: 0, border: 'none' }} onClick={handleWordClick}>
          {word}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          onMouseEnter={onHoverContent}
          className="word-popup-content bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 z-[90] border border-slate-200 dark:border-slate-800"
          sideOffset={8}
          side="top"
          align="center"
          alignOffset={0}
          style={{
            maxWidth: '50vw',
            minWidth: '10em',
            width: 'auto',
            maxHeight: '40vh',
            fontSize: '0.9em',
            padding: '0.6em 0.8em',
            overflow: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakText(word, general.speechLanguage);
              }}
              className="flex items-center justify-center gap-2 p-2 mb-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/60 rounded-xl transition-colors text-blue-700 dark:text-blue-300 w-full text-center shadow-xs"
              title="Read aloud (TTS)"
            >
              <Volume2 size={16} />
              <span className="font-bold text-sm">Read Aloud</span>
            </button>
            <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
              <h3 className="font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Actions</h3>
              {actions.word.map((action) => (
                <a
                  key={action.id}
                  href={getProcessedUrl(action.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-800 dark:text-slate-200"
                  onClick={(e) => handleTextActionClick(e, getProcessedUrl(action.url))}
                >
                  <span>{action.icon}</span>
                  <span className="flex-1">{action.name}</span>
                  <ExternalLink size={16} className="text-slate-400 dark:text-slate-500" />
                </a>
              ))}
            </div>
            <div>
              <h3 className="font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">AI Prompts</h3>
              {wordPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleAIPromptClick(prompt.prompt)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors w-full text-left text-slate-800 dark:text-slate-200"
                >
                  <span>{prompt.icon}</span>
                  <span className="flex-1">{prompt.name}</span>
                </button>
              ))}
            </div>
          </div>
          <Popover.Arrow className="fill-white dark:fill-slate-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}