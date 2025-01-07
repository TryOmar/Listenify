import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface TranslationPanelProps {
    textToTranslate: string;
    speechLanguage: string;
    translationLanguage: string;
}

export function TranslationPanel({ textToTranslate, speechLanguage, translationLanguage }: TranslationPanelProps) {
    const [translatedText, setTranslatedText] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
        if (!isVisible && textToTranslate.trim() !== '') {
            // Fetch translation when making the panel visible
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${speechLanguage}|${translationLanguage}`)
                .then(response => response.json())
                .then(data => {
                    if (data.responseData) {
                        setTranslatedText(data.responseData.translatedText);
                    }
                })
                .catch(error => console.error('Error fetching translation:', error));
        }
    };

    useEffect(() => {
        if (!isVisible || textToTranslate.trim() === '') {
            setTranslatedText('');
            return;
        }

        // Example API call to a free translation service
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${speechLanguage}|${translationLanguage}`)
            .then(response => response.json())
            .then(data => {
                if (data.responseData) {
                    setTranslatedText(data.responseData.translatedText);
                }
            })
            .catch(error => console.error('Error fetching translation:', error));
    }, [textToTranslate, speechLanguage, translationLanguage, isVisible]);

    return (
        <div className="flex flex-col h-[50vh] bg-gray-100">
            <div className="flex justify-between items-center p-4 border-b flex-wrap">
                <h2 className="text-lg font-semibold">Live Translation</h2>
                <button onClick={toggleVisibility} className="p-2">
                    {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            {isVisible && (
                <div className="flex-1 overflow-y-auto p-4">
                    <p>{translatedText}</p>
                </div>
            )}
        </div>
    );
} 