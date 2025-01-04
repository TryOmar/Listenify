import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SavedItem {
    id: string;
    text: string;
    type: 'word' | 'sentence';
}

export function SavedItemsPanel() {
    const [viewType, setViewType] = useState<'word' | 'sentence'>('word');
    const [items, setItems] = useState<SavedItem[]>([]);

    const handleDelete = (id: string) => {
        setItems(items.filter(item => item.id !== id));
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
                {items
                    .filter(item => item.type === viewType)
                    .map(item => (
                        <div
                            key={item.id}
                            className="group flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <span className="flex-1 text-sm text-gray-700">{item.text}</span>
                            <button
                                onClick={() => handleDelete(item.id)}
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