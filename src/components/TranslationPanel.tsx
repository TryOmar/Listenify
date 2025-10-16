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

    function getLastNSentences(text: string, n: number): string[] {
        // First, try to split by sentence endings
        const sentences = text.match(/[^.!?؟]+[.!?؟]?/g);
        if (sentences && sentences.length > 1) {
            // Take the last n sentences and return as array
            return sentences.slice(-n).map(s => s.trim()).filter(s => s.length > 0);
        } else {
            // If no clear sentences, split by words and take last chunk
            const words = text.split(/\s+/).filter(Boolean);
            const wordsPerSentence = 10;
            const totalWords = Math.min(words.length, n * wordsPerSentence);
            const chunk = words.slice(-totalWords).join(' ');
            return [chunk]; // Return as single sentence
        }
    }

    const translateText = async () => {
        if (!activeModel || !activeModel.apiKey) {
            addToast('No AI model configured. Please configure an AI model in settings.', 'error');
            return;
        }

        try {
            const originalSentences = getLastNSentences(textToTranslate, numSentences);
            setOriginalSnapshot(originalSentences.join('\n'));
            
            // Create a prompt that requests sentence-by-sentence translation
            const prompt = `Translate the following sentences from ${speechLanguage} to ${translationLanguage}. 

IMPORTANT INSTRUCTIONS:
1. Translate each sentence separately
2. Return ONLY the translations, one per line
3. Maintain the same order as the original sentences
4. Use proper punctuation in the target language
5. Do not add explanations or extra text

Original sentences:
${originalSentences.map((sentence, index) => `${index + 1}. ${sentence}`).join('\n')}

Translation (one sentence per line):`;

            const response = await generateGeminiResponse(prompt, activeModel.apiKey);
            setShowTranslation(true);
            
            // Clean the response and split into lines
            const cleanResponse = response.trim();
            let translatedSentences = cleanResponse.split(/\n+/).filter(line => line.trim().length > 0);
            
            // Remove numbering if present (e.g., "1. ", "2. ", etc.)
            translatedSentences = translatedSentences.map(line => 
                line.replace(/^\d+\.\s*/, '').trim()
            );
            
            // Ensure we have the same number of translations as original sentences
            if (translatedSentences.length < originalSentences.length) {
                // Pad with empty strings
                translatedSentences = [
                    ...translatedSentences,
                    ...Array(originalSentences.length - translatedSentences.length).fill('')
                ];
            } else if (translatedSentences.length > originalSentences.length) {
                // Truncate to match original length
                translatedSentences = translatedSentences.slice(0, originalSentences.length);
            }
            
            setTranslatedLines(translatedSentences);
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
                {/* Side-by-side sentence matching, only shown after translation */}
                {showTranslation && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="font-semibold text-gray-600 border-b pb-2">Original ({speechLanguage})</div>
                      <div className="font-semibold text-gray-600 border-b pb-2">Translation ({translationLanguage})</div>
                    </div>
                    
                    <div className="space-y-3">
                      {(() => {
                        const originalSentences = originalSnapshot.split('\n').filter(s => s.trim().length > 0);
                        const maxLines = Math.max(originalSentences.length, translatedLines.length);
                        
                        return Array.from({ length: maxLines }).map((_, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded border">
                            <div className="whitespace-pre-wrap text-gray-800 pr-4 border-r" dir="auto">
                              {originalSentences[idx] || ''}
                            </div>
                            <div className="whitespace-pre-wrap text-blue-900 pl-4" dir="auto">
                              {translatedLines[idx] || ''}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
} 