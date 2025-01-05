import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

interface TextSelectionPopupProps {
    selectedText: string;
    onAIPromptClick: (prompt: string) => void;
}

export function TextSelectionPopup({ selectedText, onAIPromptClick }: TextSelectionPopupProps) {
    const { actions, prompts, general } = useSettingsStore();

    const getProcessedUrl = (url: string) => {
        return url
            .replace('{text}', encodeURIComponent(selectedText))
            .replace('{speech_language_code}', general.speechLanguage)
            .replace('{translation_language_code}', general.translationLanguage);
    };

    const handleAIPromptClick = (prompt: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const processedPrompt = prompt
            .replace('{text}', selectedText)
            .replace('{speech_language_code}', general.speechLanguage)
            .replace('{translation_language_code}', general.translationLanguage);
        onAIPromptClick(processedPrompt);
    };

    const handleTextActionClick = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        window.open(url, '_blank');
        setTimeout(() => {
            window.getSelection()?.removeAllRanges();
        }, 100);
    };

    const textPrompts = prompts.filter(p => p.type === 'text');

    return (
        <div className="bg-white rounded-lg shadow-lg p-2 w-64 animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col gap-1">
                <div className="border-b pb-2 mb-2">
                    <h3 className="font-medium text-sm text-gray-600 mb-1">Text Actions</h3>
                    {actions.text.map((action) => (
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
                    <h3 className="font-medium text-sm text-gray-600 mb-1">AI Actions</h3>
                    {textPrompts.map((prompt) => (
                        <button
                            key={prompt.id}
                            onClick={(e) => handleAIPromptClick(prompt.prompt, e)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors w-full text-left"
                        >
                            <span>🤖</span>
                            <span className="flex-1">{prompt.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-white"></div>
        </div>
    );
} 