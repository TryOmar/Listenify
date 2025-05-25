import React, { useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useChatStore } from '../store/useChatStore';
import { usePanelStore } from '../store/usePanelStore';
import { useToastStore } from '../store/useToastStore';
import { generateGeminiResponse } from '../services/geminiService';
import { LANGUAGES } from '../constants/languages';

interface WordPopupProps {
  word: string;
  preventSave?: boolean;
  onOpen?: () => void;
}

export function WordPopup({ word, preventSave = false, onOpen }: WordPopupProps) {
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
        <button className="inline hover:bg-blue-100 rounded transition-colors" style={{ padding: 0, margin: 0, border: 'none' }} onClick={handleWordClick}>
          {word}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-white rounded-lg shadow-lg p-2 w-64 max-h-80 overflow-y-auto animate-in fade-in-0 zoom-in-95"
          sideOffset={5}
          side="top"
          align="center"
          alignOffset={0}
        >
          <div className="flex flex-col gap-1">
            <div className="border-b pb-2 mb-2">
              <h3 className="font-medium text-sm text-gray-600 mb-1">Actions</h3>
              {actions.word.map((action) => (
                <a
                  key={action.id}
                  href={getProcessedUrl(action.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
                  onClick={(e) => handleTextActionClick(e, getProcessedUrl(action.url))}
                >
                  <span>{action.icon}</span>
                  <span className="flex-1">{action.name}</span>
                  <ExternalLink size={16} className="text-gray-400" />
                </a>
              ))}
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-600 mb-1">AI Prompts</h3>
              {wordPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleAIPromptClick(prompt.prompt)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors w-full text-left"
                >
                  <span>{prompt.icon}</span>
                  <span className="flex-1">{prompt.name}</span>
                </button>
              ))}
            </div>
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}