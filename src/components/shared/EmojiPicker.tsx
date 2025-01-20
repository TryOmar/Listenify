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
            <button
                type="button"
                onClick={() => !readOnly && setShowPicker(!showPicker)}
                className={`text-2xl ${readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
            >
                {value}
            </button>
            {showPicker && !readOnly && (
                <div className="absolute z-50 top-full left-0 mt-1">
                    <EmojiPickerReact onEmojiClick={handleEmojiClick} />
                </div>
            )}
        </div>
    );
} 