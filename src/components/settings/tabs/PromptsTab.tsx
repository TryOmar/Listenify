import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSettingsStore, VARIABLES_DOC } from '../../../store/useSettingsStore';
import type { AIPrompt } from '../../../store/useSettingsStore';
import { EmojiPicker } from '../../shared/EmojiPicker';
import { ActionCard } from '../../shared/ActionCard';

export function PromptsTab() {
  const { prompts, updatePrompts, editPrompt } = useSettingsStore();
  const [activeType, setActiveType] = useState<'word' | 'text'>('word');
  const [newPrompt, setNewPrompt] = useState<Omit<AIPrompt, 'id' | 'modelId'>>({
    name: '',
    prompt: '',
    type: 'text',
    icon: '📝',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrompt.name && newPrompt.prompt) {
      // Determine type based on prompt content
      const type = newPrompt.prompt.includes('{word}') ? 'word' : 'text';
      const newPrompts = [
        ...prompts,
        {
          id: crypto.randomUUID(),
          ...newPrompt,
          type: type as 'word' | 'text',
          modelId: '',
        }
      ];
      updatePrompts(newPrompts);
      setNewPrompt({ name: '', prompt: '', type: 'text', icon: '📝' });
    }
  };

  const handleDelete = (id: string) => {
    const newPrompts = prompts.filter(p => p.id !== id);
    updatePrompts(newPrompts);
  };

  const handleMoveUp = (index: number, type: 'word' | 'text') => {
    const allPrompts = [...prompts];
    const typePrompts = allPrompts.filter(p => p.type === type);

    if (index > 0) {
      // Find the actual indices in the full array for the items we want to swap
      const currentPrompt = typePrompts[index];
      const previousPrompt = typePrompts[index - 1];

      const currentIndex = allPrompts.findIndex(p => p.id === currentPrompt.id);
      const previousIndex = allPrompts.findIndex(p => p.id === previousPrompt.id);

      // Swap the items
      [allPrompts[previousIndex], allPrompts[currentIndex]] =
        [allPrompts[currentIndex], allPrompts[previousIndex]];

      updatePrompts(allPrompts);
    }
  };

  const handleMoveDown = (index: number, type: 'word' | 'text') => {
    const allPrompts = [...prompts];
    const typePrompts = allPrompts.filter(p => p.type === type);

    if (index < typePrompts.length - 1) {
      // Find the actual indices in the full array for the items we want to swap
      const currentPrompt = typePrompts[index];
      const nextPrompt = typePrompts[index + 1];

      const currentIndex = allPrompts.findIndex(p => p.id === currentPrompt.id);
      const nextIndex = allPrompts.findIndex(p => p.id === nextPrompt.id);

      // Swap the items
      [allPrompts[currentIndex], allPrompts[nextIndex]] =
        [allPrompts[nextIndex], allPrompts[currentIndex]];

      updatePrompts(allPrompts);
    }
  };

  const wordPrompts = prompts.filter(p => p.type === 'word');
  const textPrompts = prompts.filter(p => p.type === 'text');

  return (
        <section className="space-y-4 text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Prompts</h3>

            <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Available placeholders:</p>
                <ul className="list-disc list-inside space-y-0.5 font-mono">
                    {Object.entries(VARIABLES_DOC).map(([key, desc]) => (
                        <li key={key}>
                            <code className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-1 py-0.5 rounded text-[11px]">{`{${key}}`}</code> - {desc}
                        </li>
                    ))}
                </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-[auto,1fr] gap-3">
                    <EmojiPicker
                        value={newPrompt.icon}
                        onChange={(emoji) => setNewPrompt({ ...newPrompt, icon: emoji })}
                    />
                    <input
                        type="text"
                        placeholder="Enter prompt name (e.g., 'Translate to Spanish')"
                        value={newPrompt.name}
                        onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <textarea
                    placeholder="Enter prompt template using variables like {word} or {text}. Example: 'Translate this {text} from {speech_language} to {translation_language}'"
                    value={newPrompt.prompt}
                    onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                    className="w-full h-24 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                />
                <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-xs"
                >
                    <Plus className="inline mr-1.5" size={18} />
                    Add Prompt
                </button>
            </form>

            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-4 pt-2">
                <button
                    onClick={() => setActiveType('word')}
                    className={`py-2 px-4 text-xs sm:text-sm font-bold relative transition-colors ${activeType === 'word' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                    Word Prompts ({wordPrompts.length})
                    {activeType === 'word' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>}
                </button>
                <button
                    onClick={() => setActiveType('text')}
                    className={`py-2 px-4 text-xs sm:text-sm font-bold relative transition-colors ${activeType === 'text' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                    Text Prompts ({textPrompts.length})
                    {activeType === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>}
                </button>
            </div>

            <div className="space-y-2">
                {activeType === 'word' ? (
                    wordPrompts.length > 0 ? (
                        wordPrompts.map((prompt, index) => (
                            <ActionCard
                                key={prompt.id}
                                id={prompt.id}
                                icon={prompt.icon}
                                name={prompt.name}
                                content={prompt.prompt}
                                onDelete={handleDelete}
                                onMoveUp={() => handleMoveUp(index, 'word')}
                                onMoveDown={() => handleMoveDown(index, 'word')}
                                onEdit={(id, updates) => editPrompt(id, { ...updates, prompt: updates.content })}
                                isFirst={index === 0}
                                isLast={index === wordPrompts.length - 1}
                            />
                        ))
                    ) : (
                        <p className="text-center text-slate-400 dark:text-slate-500 py-4 text-xs sm:text-sm">
                            No word prompts yet
                        </p>
                    )
                ) : (
                    textPrompts.length > 0 ? (
                        textPrompts.map((prompt, index) => (
                            <ActionCard
                                key={prompt.id}
                                id={prompt.id}
                                icon={prompt.icon}
                                name={prompt.name}
                                content={prompt.prompt}
                                onDelete={handleDelete}
                                onMoveUp={() => handleMoveUp(index, 'text')}
                                onMoveDown={() => handleMoveDown(index, 'text')}
                                onEdit={(id, updates) => editPrompt(id, { ...updates, prompt: updates.content })}
                                isFirst={index === 0}
                                isLast={index === textPrompts.length - 1}
                            />
                        ))
                    ) : (
                        <p className="text-center text-slate-400 dark:text-slate-500 py-4 text-xs sm:text-sm">
                            No text prompts yet
                        </p>
                    )
                )}
            </div>
        </section>
    );
}