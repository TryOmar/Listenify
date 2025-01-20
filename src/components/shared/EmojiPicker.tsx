import React, { useState, useRef, useEffect } from 'react';
import EmojiPickerReact from 'emoji-picker-react';
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

    return (
        <div className="relative" ref={pickerRef}>
            <input
                type="text"
                value={value}
                readOnly
                onClick={() => !readOnly && setShowPicker(!showPicker)}
                className={`w-12 text-center px-3 py-2 border rounded-lg ${readOnly ? 'bg-transparent cursor-default' : 'cursor-pointer hover:bg-gray-50'
                    }`}
            />
            {showPicker && !readOnly && (
                <div className="absolute z-50 top-full left-0 mt-1">
                    <EmojiPickerReact onEmojiClick={handleEmojiClick} />
                </div>
            )}
        </div>
    );
} 