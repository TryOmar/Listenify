import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WordPopup } from '../WordPopup';
import { TextSelectionPopup } from '../TextSelectionPopup';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useChatStore } from '../../store/useChatStore';
import { usePanelStore } from '../../store/usePanelStore';
import { useToastStore } from '../../store/useToastStore';
import { generateGeminiResponse } from '../../services/geminiService';

export function SavedItemsPanel() {
    const [viewType, setViewType] = useState<'word' | 'sentence'>('word');
    const [items, setItems] = useState<string[]>([]);
    const [selectedText, setSelectedText] = useState('');
    const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);

    const { addMessage } = useChatStore();
    const { isChatPanelOpen, openChatPanel } = usePanelStore();
    const { addToast } = useToastStore();

    useEffect(() => {
        const handleStorageChange = () => {
            const savedWords = JSON.parse(localStorage.getItem('savedWords') || '[]');
            const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
            setItems(viewType === 'word' ? savedWords : savedTexts);
        };

        window.addEventListener('storage', handleStorageChange);
        handleStorageChange(); // Initial load

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [viewType]);

    // Add click away handler for sentence popup
    useEffect(() => {
        const handleClickAway = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.text-selection-popup')) {
                return;
            }
            setSelectedText('');
            setSelectionPosition(null);
        };

        document.addEventListener('mousedown', handleClickAway);
        return () => document.removeEventListener('mousedown', handleClickAway);
    }, []);

    const handleDelete = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const storageKey = viewType === 'word' ? 'savedWords' : 'savedTexts';
        const savedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedItems = savedItems.filter((item: string) => item !== text);
        localStorage.setItem(storageKey, JSON.stringify(updatedItems));
        setItems(updatedItems);
    };

    const handleSentenceClick = (text: string, e: React.MouseEvent) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setSelectedText(text);
        setSelectionPosition({
            x: rect.right + 20,
            y: rect.top,
        });
    };

    const handleAIPromptClick = async (prompt: string) => {
        if (!isChatPanelOpen) {
            openChatPanel();
        }

        addMessage(prompt, 'user');

        const activeModel = useSettingsStore.getState().aiModels.find(
            model => model.id === useSettingsStore.getState().activeModelId
        );

        try {
            if (activeModel?.model === 'gemini' && activeModel.apiKey) {
                const response = await generateGeminiResponse(prompt, activeModel.apiKey);
                addMessage(response, 'ai');
            } else {
                setTimeout(() => {
                    addMessage('Please configure an AI model in settings.', 'ai');
                }, 1000);
            }
        } catch (error) {
            console.error('Error generating response:', error);
            addToast('Error generating AI response', 'error');
        }

        setTimeout(() => {
            setSelectedText('');
            setSelectionPosition(null);
        }, 100);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toggle Switch */}
            <div className="p-4">
                <div className="flex rounded-lg border p-1">
                    <button
                        onClick={() => setViewType('word')}
                        className={cn(
                            'flex-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                            viewType === 'word' ? 'bg-blue-500 text-white' : 'text-gray-600'
                        )}
                    >
                        Words
                    </button>
                    <button
                        onClick={() => setViewType('sentence')}
                        className={cn(
                            'flex-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                            viewType === 'sentence' ? 'bg-blue-500 text-white' : 'text-gray-600'
                        )}
                    >
                        Sentences
                    </button>
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
                {items.map(item => (
                    <div
                        key={item}
                        className="group flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <span className="flex-1 text-base text-gray-700">
                            {viewType === 'word' ? (
                                <div className="word-popup-wrapper" style={{ position: 'relative' }}>
                                    <WordPopup word={item} preventSave={true} />
                                </div>
                            ) : (
                                <button
                                    className="hover:bg-blue-100 rounded px-1 py-0.5 transition-colors"
                                    onClick={(e) => handleSentenceClick(item, e)}
                                >
                                    {item}
                                </button>
                            )}
                        </span>
                        <button
                            onClick={(e) => handleDelete(item, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Text Selection Popup */}
            {viewType === 'sentence' && selectedText && selectionPosition && (
                <div
                    className="text-selection-popup fixed"
                    style={{
                        left: `${selectionPosition.x}px`,
                        top: `${selectionPosition.y}px`,
                        transform: 'translate(0, 0)',
                        zIndex: 50,
                    }}
                >
                    <TextSelectionPopup
                        selectedText={selectedText}
                        onAIPromptClick={handleAIPromptClick}
                        onClose={() => {
                            setSelectedText('');
                            setSelectionPosition(null);
                        }}
                        preventSave={true}
                    />
                </div>
            )}
        </div>
    );
} 