import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSettingsStore, VARIABLES_DOC } from '../../../store/useSettingsStore';
import type { AIPrompt } from '../../../store/useSettingsStore';
import { EmojiPicker } from '../../shared/EmojiPicker';
import { ActionCard } from '../../shared/ActionCard';

export function PromptsTab() {
  const { prompts, updatePrompts } = useSettingsStore();
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
    if (index > 0) {
      const allPrompts = [...prompts];
      const typeStartIndex = prompts.findIndex(p => p.type === type);
      const actualIndex = typeStartIndex + index;
      [allPrompts[actualIndex - 1], allPrompts[actualIndex]] = [allPrompts[actualIndex], allPrompts[actualIndex - 1]];
      updatePrompts(allPrompts);
    }
  };

  const handleMoveDown = (index: number, type: 'word' | 'text') => {
    const typePrompts = prompts.filter(p => p.type === type);
    if (index < typePrompts.length - 1) {
      const allPrompts = [...prompts];
      const typeStartIndex = prompts.findIndex(p => p.type === type);
      const actualIndex = typeStartIndex + index;
      [allPrompts[actualIndex], allPrompts[actualIndex + 1]] = [allPrompts[actualIndex + 1], allPrompts[actualIndex]];
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

      <div className="grid grid-cols-2 gap-6">
        {/* Word Prompts */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-4">
            Word Prompts
            <span className="text-sm text-gray-500">({wordPrompts.length})</span>
          </h4>
          <div className="space-y-2">
            {wordPrompts.map((prompt, index) => (
              <ActionCard
                key={prompt.id}
                id={prompt.id}
                icon={prompt.icon}
                name={prompt.name}
                content={prompt.prompt}
                onDelete={handleDelete}
                onMoveUp={() => handleMoveUp(index, 'word')}
                onMoveDown={() => handleMoveDown(index, 'word')}
                isFirst={index === 0}
                isLast={index === wordPrompts.length - 1}
              />
            ))}
            {wordPrompts.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No word prompts yet
              </p>
            )}
          </div>
        </div>

        {/* Text Prompts */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-4">
            Text Prompts
            <span className="text-sm text-gray-500">({textPrompts.length})</span>
          </h4>
          <div className="space-y-2">
            {textPrompts.map((prompt, index) => (
              <ActionCard
                key={prompt.id}
                id={prompt.id}
                icon={prompt.icon}
                name={prompt.name}
                content={prompt.prompt}
                onDelete={handleDelete}
                onMoveUp={() => handleMoveUp(index, 'text')}
                onMoveDown={() => handleMoveDown(index, 'text')}
                isFirst={index === 0}
                isLast={index === textPrompts.length - 1}
              />
            ))}
            {textPrompts.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No text prompts yet
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}