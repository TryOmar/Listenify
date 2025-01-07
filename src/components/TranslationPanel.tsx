import React, { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateGeminiResponse } from '../services/geminiService';
import { isRTL } from '../lib/utils';

interface TranslationPanelProps {
    textToTranslate: string;
    speechLanguage: string;
    translationLanguage: string;
}

export function TranslationPanel({ textToTranslate, speechLanguage, translationLanguage }: TranslationPanelProps) {
    const [translatedText, setTranslatedText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { aiModels, activeModelId } = useSettingsStore();
    const activeModel = aiModels.find(model => model.id === activeModelId);

    const translateText = async () => {
        if (!activeModel || !activeModel.apiKey) {
            setErrorMessage('No AI model configured. Please configure an AI model in settings.');
            return;
        }

        try {
            const prompt = `Translate the following text from ${speechLanguage} to ${translationLanguage} and provide only the translation without any additional information or alternatives:\n\n${textToTranslate}`;
            const response = await generateGeminiResponse(prompt, activeModel.apiKey);
            setTranslatedText(response);
            setErrorMessage('');
        } catch (error) {
            console.error('Error generating translation:', error);
            setErrorMessage('Error generating translation.');
        }
    };

    const clearTranslation = () => {
        setTranslatedText('');
        setErrorMessage('');
    };

    return (
        <div className="flex flex-col h-[50vh] bg-gray-100">
            <div className="flex justify-between items-center p-4 border-b flex-wrap">
                <h2 className="text-lg font-semibold">Translate with AI</h2>
                <div className="flex gap-2">
                    <button onClick={translateText} className="p-2 bg-blue-500 text-white rounded">
                        <RefreshCw size={20} />
                    </button>
                    <button onClick={clearTranslation} className="p-2 bg-gray-300 rounded">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4" style={{ direction: isRTL(translationLanguage) ? 'rtl' : 'ltr' }}>
                {errorMessage ? (
                    <p className="text-red-500" style={{ direction: 'ltr' }}>
                        {errorMessage}
                    </p>
                ) : (
                    <p>{translatedText}</p>
                )}
            </div>
        </div>
    );
} 