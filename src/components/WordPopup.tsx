import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useChatStore } from '../store/useChatStore';
import { usePanelStore } from '../store/usePanelStore';

interface WordPopupProps {
  word: string;
}

export function WordPopup({ word }: WordPopupProps) {
  const { actions, prompts, general } = useSettingsStore();
  const { addMessage } = useChatStore();
  const { isChatPanelOpen, openChatPanel } = usePanelStore();

  const getProcessedUrl = (url: string) => {
    return url
      .replace('{word}', encodeURIComponent(word))
      .replace('{speech_language_code}', general.speechLanguage)
      .replace('{translation_language_code}', general.translationLanguage);
  };

  const handleAIPromptClick = (prompt: string) => {
    // Open chat panel if it's closed
    if (!isChatPanelOpen) {
      openChatPanel();
    }

    // Process and send the prompt
    const processedPrompt = prompt
      .replace('{word}', word)
      .replace('{speech_language_code}', general.speechLanguage)
      .replace('{translation_language_code}', general.translationLanguage);

    addMessage(processedPrompt, 'user');
    // Simulate AI response
    setTimeout(() => {
      addMessage('This is a simulated AI response.', 'ai');
    }, 1000);
  };

  const wordPrompts = prompts.filter(p => p.type === 'word');

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="inline-block px-1 py-0.5 hover:bg-blue-100 rounded transition-colors">
          {word}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-white rounded-lg shadow-lg p-2 w-64 animate-in fade-in-0 zoom-in-95"
          sideOffset={5}
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
                  <span>🤖</span>
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