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
      const newPrompts = [
        ...prompts,
        {
          id: crypto.randomUUID(),
          ...newPrompt,
          modelId: '', // Model will be selected from Models page
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

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">AI Prompts</h3>

      <div className="text-sm text-gray-500 mb-4">
        <p>Available variables:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          {Object.entries(VARIABLES_DOC).map(([key, desc]) => (
            <li key={key}>
              <code className="bg-gray-100 px-1 rounded">{`{${key}}`}</code> - {desc}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs">
          Note: Prompts with {'{word}'} appear in word popup, prompts with {'{text}'} appear in text selection popup.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[1fr,auto] gap-4">
          <input
            type="text"
            placeholder="Prompt Name (e.g., Translate to Spanish)"
            value={newPrompt.name}
            onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
          <select
            value={newPrompt.type}
            onChange={(e) => setNewPrompt({ ...newPrompt, type: e.target.value as AIPrompt['type'] })}
            className="w-40 px-3 py-2 border rounded-lg bg-white"
          >
            <option value="text">Text Selection</option>
            <option value="word">Word Click</option>
          </select>
        </div>
        <textarea
          placeholder="Prompt Template (use variables shown above)"
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

      <div className="space-y-2">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 text-center">🤖</span>
              <span className="flex-1 font-medium">{prompt.name}</span>
              <span className="px-2 py-1 text-xs bg-gray-200 rounded-full">
                {prompt.type === 'word' ? 'Word Click' : 'Text Selection'}
              </span>
              <button
                onClick={() => handleRemove(prompt.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="pl-10">
              <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border border-gray-100">
                {prompt.prompt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}