import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

interface TextSelectionPopupProps {
    selectedText: string;
    onAIPromptClick: (prompt: string) => void;
}

export function TextSelectionPopup({ selectedText, onAIPromptClick }: TextSelectionPopupProps) {
    const { textActions, aiActions, general } = useSettingsStore();

    const getProcessedUrl = (url: string, text: string) => {
        return url
            .replace('{text}', encodeURIComponent(text))
            .replace('{speech_language_code}', general.speechLanguage)
            .replace('{translation_language_code}', general.translationLanguage);
    };

    const handleAIPromptClick = (prompt: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const processedPrompt = prompt.replace('{text}', selectedText);
        onAIPromptClick(processedPrompt);
    };

    const handleTextActionClick = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        // Open in new tab first, then clear selection
        window.open(url, '_blank');
        setTimeout(() => {
            window.getSelection()?.removeAllRanges();
        }, 100);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-2 w-64 animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col gap-1">
                <div className="border-b pb-2 mb-2">
                    <h3 className="font-medium text-sm text-gray-600 mb-1">Text Actions</h3>
                    {textActions.map((action) => (
                        <a
                            key={action.id}
                            href={getProcessedUrl(action.url, selectedText)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
                            onClick={(e) => handleTextActionClick(e, getProcessedUrl(action.url, selectedText))}
                        >
                            <span>{action.icon}</span>
                            <span className="flex-1">{action.name}</span>
                            <ExternalLink size={16} className="text-gray-400" />
                        </a>
                    ))}
                </div>
                <div>
                    <h3 className="font-medium text-sm text-gray-600 mb-1">AI Actions</h3>
                    {aiActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={(e) => handleAIPromptClick(action.prompt, e)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors w-full text-left"
                        >
                            <span>🤖</span>
                            <span className="flex-1">{action.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-white"></div>
        </div>
    );
} 