import React, { useState, useRef, useEffect } from 'react';
import EmojiPickerReact, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';

interface EmojiPickerProps {
    value: string;
    onChange: (emoji: string) => void;
    readOnly?: boolean;
}

export function EmojiPicker({ value, onChange, readOnly }: EmojiPickerProps) {
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onChange(emojiData.emoji);
        setShowPicker(false);
    };

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <div className="relative" ref={pickerRef}>
            <button
                type="button"
                onClick={() => !readOnly && setShowPicker(!showPicker)}
                className={`text-2xl p-1 rounded-lg ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'}`}
            >
                {value}
            </button>
            {showPicker && !readOnly && (
                <div className="absolute z-[999] top-full left-0 mt-1 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <EmojiPickerReact
                        onEmojiClick={handleEmojiClick}
                        theme={isDark ? Theme.DARK : Theme.LIGHT}
                    />
                </div>
            )}
        </div>
    );
} 