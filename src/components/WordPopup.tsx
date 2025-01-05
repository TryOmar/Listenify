import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

interface WordPopupProps {
  word: string;
}

export function WordPopup({ word }: WordPopupProps) {
  const { popupActions, general } = useSettingsStore();

  const getProcessedUrl = (url: string, word: string) => {
    return url
      .replace('{word}', encodeURIComponent(word))
      .replace('{speech_language_code}', general.speechLanguage)
      .replace('{translation_language_code}', general.translationLanguage);
  };

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
            {popupActions.map((action) => (
              <a
                key={action.id}
                href={getProcessedUrl(action.url, word)}
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
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}