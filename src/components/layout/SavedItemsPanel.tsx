import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SavedItemsPanel() {
    const [viewType, setViewType] = useState<'word' | 'sentence'>('word');
    const [items, setItems] = useState<string[]>([]);

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

    const handleDelete = (text: string) => {
        const storageKey = viewType === 'word' ? 'savedWords' : 'savedTexts';
        const savedItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedItems = savedItems.filter((item: string) => item !== text);
        localStorage.setItem(storageKey, JSON.stringify(updatedItems));
        setItems(updatedItems);
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
                        <span className="flex-1 text-base text-gray-700">{item}</span>
                        <button
                            onClick={() => handleDelete(item)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
} 