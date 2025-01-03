import React, { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

const AI_MODEL_OPTIONS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'claude-3', label: 'Claude 3' },
  { value: 'custom', label: 'Custom Model' },
];

export function AIModelsSettings() {
  const { aiModels, activeModelId, addAIModel, removeAIModel, setActiveModel } = useSettingsStore();
  const [newModel, setNewModel] = useState({
    name: '',
    type: 'gpt-4',
    apiKey: '',
    baseUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newModel.name && newModel.apiKey) {
      addAIModel({
        name: newModel.name,
        apiKey: newModel.apiKey,
        baseUrl: newModel.baseUrl,
      });
      setNewModel({ name: '', type: 'gpt-4', apiKey: '', baseUrl: '' });
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Add AI Model</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Model Name (e.g., My GPT-4)"
              value={newModel.name}
              onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <select
              value={newModel.type}
              onChange={(e) => setNewModel({ ...newModel, type: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              {AI_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="password"
            placeholder="API Key"
            value={newModel.apiKey}
            onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Base URL (optional)"
            value={newModel.baseUrl}
            onChange={(e) => setNewModel({ ...newModel, baseUrl: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="inline mr-2" size={20} />
            Add Model
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Models</h3>
        <div className="space-y-2">
          {aiModels.map((model) => (
            <div
              key={model.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <button
                onClick={() => setActiveModel(model.id)}
                className={`flex-1 flex items-center gap-2 text-left ${
                  activeModelId === model.id ? 'text-blue-600' : ''
                }`}
              >
                {activeModelId === model.id && (
                  <Check size={16} className="text-blue-600" />
                )}
                <div>
                  <h4 className="font-medium">{model.name}</h4>
                  <p className="text-sm text-gray-500">
                    {model.baseUrl || 'Using default API endpoint'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => removeAIModel(model.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {aiModels.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No AI models added yet. Add one above to get started.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}