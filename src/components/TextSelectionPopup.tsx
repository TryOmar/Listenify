import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { LANGUAGES } from '../constants/languages';

interface TextSelectionPopupProps {
    selectedText: string;
    onAIPromptClick: (prompt: string) => void;
    onClose: () => void;
    preventSave?: boolean;
}

export function TextSelectionPopup({ selectedText, onAIPromptClick, onClose, preventSave = false }: TextSelectionPopupProps) {
    const { actions, prompts, general } = useSettingsStore();

    const getLanguageLabel = (code: string) => {
        return LANGUAGES.find(lang => lang.value === code)?.label || code;
    };

    // Add window blur handler
    useEffect(() => {
        const handleWindowBlur = () => {
            onClose();
        };

        window.addEventListener('blur', handleWindowBlur);
        return () => window.removeEventListener('blur', handleWindowBlur);
    }, [onClose]);

    const getProcessedUrl = (url: string) => {
        return url
            .replaceAll('{text}', encodeURIComponent(selectedText))
            .replaceAll('{speech_language}', getLanguageLabel(general.speechLanguage))
            .replaceAll('{translation_language}', getLanguageLabel(general.translationLanguage))
            .replaceAll('{speech_language_code}', general.speechLanguage)
            .replaceAll('{translation_language_code}', general.translationLanguage);
    };

    const handleAIPromptClick = (prompt: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const processedPrompt = prompt
            .replaceAll('{text}', selectedText)
            .replaceAll('{speech_language}', getLanguageLabel(general.speechLanguage))
            .replaceAll('{translation_language}', getLanguageLabel(general.translationLanguage))
            .replaceAll('{speech_language_code}', general.speechLanguage)
            .replaceAll('{translation_language_code}', general.translationLanguage);
        onAIPromptClick(processedPrompt);
        onClose();
    };

    const handleTextActionClick = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        window.open(url, '_blank');
        onClose();
        setTimeout(() => {
            window.getSelection()?.removeAllRanges();
        }, 100);
    };

    const textPrompts = prompts.filter(p => p.type === 'text');

    const addTextToSavedItems = (text: string) => {
        if (preventSave) return;

        const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
        const existingIndex = savedTexts.indexOf(text);
        if (existingIndex !== -1) {
            savedTexts.splice(existingIndex, 1);
        }
        savedTexts.unshift(text);
        localStorage.setItem('savedTexts', JSON.stringify(savedTexts));
        window.dispatchEvent(new Event('storage'));
    };

    // Call addTextToSavedItems when text is selected
    useEffect(() => {
        addTextToSavedItems(selectedText);
    }, [selectedText]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-2 w-64 max-h-80 overflow-y-auto animate-in fade-in-0 zoom-in-95">
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
                            <span>{prompt.icon}</span>
                            <span className="flex-1">{prompt.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-white"></div>
        </div>
    );
} 