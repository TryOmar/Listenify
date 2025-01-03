import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export function AIActionsSettings() {
  const { aiActions, addAIAction, removeAIAction } = useSettingsStore();
  const [newAction, setNewAction] = useState({
    name: '',
    prompt: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAction.name && newAction.prompt) {
      addAIAction({
        ...newAction,
        modelId: '', // Model will be selected from Models page
      });
      setNewAction({ name: '', prompt: '' });
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">AI Prompts</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Prompt Name (e.g., Translate to Spanish)"
            value={newAction.name}
            onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Prompt Template (use {text} for selected text, e.g., 'Translate this text to Spanish: {text}')"
            value={newAction.prompt}
            onChange={(e) => setNewAction({ ...newAction, prompt: e.target.value })}
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

      <div className="space-y-2">
        {aiActions.map((action) => (
          <div
            key={action.id}
            className="p-4 bg-gray-50 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{action.name}</h4>
              <button
                onClick={() => removeAIAction(action.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600">{action.prompt}</p>
          </div>
        ))}
      </div>
    </section>
  );
}