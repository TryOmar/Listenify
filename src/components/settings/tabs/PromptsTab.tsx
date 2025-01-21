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
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">AI Prompts</h3>

      <div className="text-sm text-gray-500 mb-4">
        <p>Available placeholders:</p>
        <ul className="list-disc list-inside mt-1">
          {Object.entries(VARIABLES_DOC).map(([key, desc]) => (
            <li key={key}>
              <code className="bg-gray-100 px-1 rounded">{`{${key}}`}</code> - {desc}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[auto,1fr] gap-4">
          <EmojiPicker
            value={newPrompt.icon}
            onChange={(emoji) => setNewPrompt({ ...newPrompt, icon: emoji })}
          />
          <input
            type="text"
            placeholder="Enter prompt name (e.g., 'Translate to Spanish', 'Define Word')"
            value={newPrompt.name}
            onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        <textarea
          placeholder="Enter prompt template using variables like {word} or {text}. Example: 'Translate this {text} from {speech_language} to {translation_language}'"
          value={newPrompt.prompt}
          onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
          className="w-full h-24 px-3 py-2 border rounded-lg resize-none"
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="inline mr-2" size={20} />
          Add Prompt
        </button>
      </form>

      <div className="flex gap-2 border-b mb-4">
        <button
          onClick={() => setActiveType('word')}
          className={`py-2 px-4 relative ${activeType === 'word' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          Word Prompts ({wordPrompts.length})
          {activeType === 'word' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
        </button>
        <button
          onClick={() => setActiveType('text')}
          className={`py-2 px-4 relative ${activeType === 'text' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
        >
          Text Prompts ({textPrompts.length})
          {activeType === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
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
            <p className="text-center text-gray-500 py-4">
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
            <p className="text-center text-gray-500 py-4">
              No text prompts yet
            </p>
          )
        )}
      </div>
    </section>
  );
}