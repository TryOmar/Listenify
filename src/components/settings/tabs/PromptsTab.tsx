import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { useSettingsStore, VARIABLES_DOC } from '../../../store/useSettingsStore';
import type { AIPrompt } from '../../../store/useSettingsStore';

export function PromptsTab() {
  const { prompts, updatePrompts } = useSettingsStore();
  const [newPrompt, setNewPrompt] = useState<Omit<AIPrompt, 'id' | 'modelId'>>({
    name: '',
    prompt: '',
    type: 'text',
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
      setNewPrompt({ name: '', prompt: '', type: 'text' });
    }
  };

  const handleRemove = (id: string) => {
    const newPrompts = prompts.filter(p => p.id !== id);
    updatePrompts(newPrompts);
  };

  const wordPrompts = prompts.filter(p => p.type === 'word');
  const textPrompts = prompts.filter(p => p.type === 'text');

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">AI Prompts</h3>

        <div className="text-sm text-gray-500 mb-4">
          <p>Available variables:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {Object.entries(VARIABLES_DOC).map(([key, desc]) => (
              <li key={key}>
                <code className="bg-gray-100 px-1 rounded">{`{${key}}`}</code> - {desc}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Prompt Name (e.g., Translate to Spanish)"
              value={newPrompt.name}
              onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <textarea
              placeholder="Prompt Template (use {text} for text selection or {word} for word popup)"
              value={newPrompt.prompt}
              onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
              className="w-full h-24 px-3 py-2 border rounded-lg resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="inline mr-2" size={20} />
            Add Prompt
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Word Prompts */}
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-4">
            Word Prompts
            <span className="text-sm text-gray-500">({wordPrompts.length})</span>
          </h4>
          <div className="space-y-2">
            {wordPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg group"
              >
                <span className="w-8 text-center mt-1">🤖</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium">{prompt.name}</span>
                    <button
                      onClick={() => handleRemove(prompt.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border border-gray-100">
                    {prompt.prompt}
                  </p>
                </div>
              </div>
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
            {textPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg group"
              >
                <span className="w-8 text-center mt-1">🤖</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium">{prompt.name}</span>
                    <button
                      onClick={() => handleRemove(prompt.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border border-gray-100">
                    {prompt.prompt}
                  </p>
                </div>
              </div>
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