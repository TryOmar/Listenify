import React, { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateGeminiResponse } from '../services/geminiService';
import { useToastStore } from '../store/useToastStore';
import { formatTranscriptWithLineBreaks } from '../lib/textFormat';

interface TranslationPanelProps {
    textToTranslate: string;
    speechLanguage: string;
    translationLanguage: string;
}

export function TranslationPanel({ textToTranslate, speechLanguage, translationLanguage }: TranslationPanelProps) {
    const [translatedText, setTranslatedText] = useState('');
    const { aiModels, activeModelId, general } = useSettingsStore();
    const { addToast } = useToastStore();
    const activeModel = aiModels.find(model => model.id === activeModelId);

    const translateText = async () => {
        if (!activeModel || !activeModel.apiKey) {
            addToast('No AI model configured. Please configure an AI model in settings.', 'error');
            return;
        }

        try {
            const formattedText = formatTranscriptWithLineBreaks(
                textToTranslate,
                general.breakSentences,
                general.lineBreakStyle
            );
            const prompt = `Translate the following text from ${speechLanguage} to ${translationLanguage} and provide only the translation without any additional information or alternatives:\n\n${formattedText}`;
            const response = await generateGeminiResponse(prompt, activeModel.apiKey);
            setTranslatedText(response);
        } catch (error) {
            console.error('Error generating translation:', error);
            addToast('Error generating translation.', 'error');
        }
    };

    const clearTranslation = () => {
        setTranslatedText('');
        addToast('Translation cleared', 'info');
    };

    return (
        <div className="flex flex-col flex-1 bg-gray-100">
            <div className="flex justify-between items-center p-4 border-b flex-wrap">
                <h2 className="text-lg font-semibold">Translate with AI</h2>
                <div className="flex gap-2">
                    <button onClick={clearTranslation} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                        <Trash2 size={20} />
                    </button>
                    <button onClick={translateText} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4" dir="auto">
                {translatedText
                  .split(/\n{1,2}/)
                  .map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
            </div>
        </div>
    );
} 