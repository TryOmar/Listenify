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
    const [showTranslation, setShowTranslation] = useState(false);
    const [originalSnapshot, setOriginalSnapshot] = useState('');
    const [translatedLines, setTranslatedLines] = useState<string[]>([]);
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
            setOriginalSnapshot(formattedText);
            const prompt = `Translate the following text from ${speechLanguage} to ${translationLanguage}. Return ONLY the translation, preserving the same number of lines and line breaks as the original. Each line in the translation should correspond to the same line in the original. Do not add or remove lines.\n\n${formattedText}`;
            const response = await generateGeminiResponse(prompt, activeModel.apiKey);
            setShowTranslation(true);
            const originalLines = formattedText.split(/\n{1,2}/);
            let splitTranslation = response.split(/\n{1,2}/);
            if (splitTranslation.length !== originalLines.length) {
                splitTranslation = response.split(/(?<=[.!?؟])\s+/);
            }
            if (splitTranslation.length < originalLines.length) {
                splitTranslation = [
                  ...splitTranslation,
                  ...Array(originalLines.length - splitTranslation.length).fill('')
                ];
            } else if (splitTranslation.length > originalLines.length) {
                splitTranslation = splitTranslation.slice(0, originalLines.length);
            }
            setTranslatedLines(splitTranslation);
        } catch (error) {
            console.error('Error generating translation:', error);
            addToast('Error generating translation.', 'error');
        }
    };

    const clearTranslation = () => {
        setShowTranslation(false);
        setOriginalSnapshot('');
        setTranslatedLines([]);
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
                {/* Side-by-side original and translation, only shown after translation */}
                {showTranslation && (
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="font-semibold text-gray-600 border-b pb-2">Original</div>
                    <div className="font-semibold text-gray-600 border-b pb-2">Translation</div>
                    {(() => {
                      const originalLines = originalSnapshot.split(/\n{1,2}/);
                      const maxLines = Math.max(originalLines.length, translatedLines.length);
                      return Array.from({ length: maxLines }).map((_, idx) => (
                        <React.Fragment key={idx}>
                          <div className="whitespace-pre-wrap text-gray-800 pr-4 border-r min-h-[1.5em]" dir="auto">{originalLines[idx] || ''}</div>
                          <div className="whitespace-pre-wrap text-blue-900 pl-4 min-h-[1.5em]" dir="auto">{translatedLines[idx] || ''}</div>
                        </React.Fragment>
                      ));
                    })()}
                  </div>
                )}
            </div>
        </div>
    );
} 