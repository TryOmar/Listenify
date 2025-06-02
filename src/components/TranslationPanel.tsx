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
    const [numSentences, setNumSentences] = useState(10);
    const { aiModels, activeModelId, general } = useSettingsStore();
    const { addToast } = useToastStore();
    const activeModel = aiModels.find(model => model.id === activeModelId);

    function getLastNSentences(text: string, n: number): string {
        const sentences = text.match(/[^.!?؟]+[.!?؟]?/g);
        if (sentences && sentences.length > 1) {
            return sentences.slice(-n).join(' ').trim();
        } else {
            const words = text.split(/\s+/).filter(Boolean);
            const wordsPerSentence = 10;
            const totalWords = Math.min(words.length, n * wordsPerSentence);
            return words.slice(-totalWords).join(' ');
        }
    }

    const translateText = async () => {
        if (!activeModel || !activeModel.apiKey) {
            addToast('No AI model configured. Please configure an AI model in settings.', 'error');
            return;
        }

        try {
            const selectedText = getLastNSentences(textToTranslate, numSentences);
            const formattedText = formatTranscriptWithLineBreaks(
                selectedText,
                general.breakSentences,
                general.lineBreakStyle
            );
            setOriginalSnapshot(formattedText);
            const prompt = `Translate ONLY the following text from ${speechLanguage} to ${translationLanguage}. Return ONLY the translation, preserving the same number of lines and line breaks as the original. Each line in the translation should correspond to the same line in the original. Do not add or remove lines. If the original text has no punctuation and is a single long line, break the translation into lines that match the same word chunks as the original (e.g., every 10 words per line).\n\n${formattedText}`;
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
                <div className="flex gap-2 items-center">
                    <select
                        className="p-2 rounded bg-gray-200 text-sm mr-2"
                        value={numSentences}
                        onChange={e => setNumSentences(Number(e.target.value))}
                        title="Select how much to translate"
                    >
                        <option value={5}>Last 5 sentences (~50 words)</option>
                        <option value={10}>Last 10 sentences (~100 words)</option>
                        <option value={20}>Last 20 sentences (~200 words)</option>
                        <option value={30}>Last 30 sentences (~300 words)</option>
                        <option value={40}>Last 40 sentences (~400 words)</option>
                        <option value={50}>Last 50 sentences (~500 words)</option>
                        <option value={100}>Last 100 sentences (~1000 words)</option>
                    </select>
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