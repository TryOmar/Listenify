import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  Zap,
  Brain,
  Settings
} from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import type { AIModel } from '../../../store/useSettingsStore';

const AI_MODEL_OPTIONS = [
  { value: 'gpt-4', label: 'GPT-4', icon: Cpu },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', icon: Zap },
  { value: 'gemini-pro', label: 'Gemini Pro', icon: Sparkles },
  { value: 'claude-3', label: 'Claude 3', icon: Brain },
  { value: 'custom', label: 'Custom Model', icon: Settings },
];

export function ModelsTab() {
  const { aiModels, activeModelId, addAIModel, removeAIModel, setActiveModel } = useSettingsStore();
  const [newModel, setNewModel] = useState<Omit<AIModel, 'id'>>({
    name: '',
    model: AI_MODEL_OPTIONS[0].value,
    apiKey: '',
  });
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [showNewApiKey, setShowNewApiKey] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getModelIcon = (modelType: string) => {
    const IconComponent = AI_MODEL_OPTIONS.find(opt => opt.value === modelType)?.icon || Settings;
    return <IconComponent size={24} />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newModel.name && newModel.model && newModel.apiKey) {
      addAIModel(newModel);
      setNewModel({ name: '', model: AI_MODEL_OPTIONS[0].value, apiKey: '' });
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
              placeholder="Custom Name (e.g., My Work GPT-4)"
              value={newModel.name}
              onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <select
              value={newModel.model}
              onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              {AI_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <input
              type={showNewApiKey ? "text" : "password"}
              placeholder="API Key for Authentication"
              value={newModel.apiKey}
              onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewApiKey(!showNewApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 rounded"
              aria-label="Toggle API key visibility"
            >
              {showNewApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
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
        <div className="space-y-3">
          {aiModels.map((model) => (
            <div
              key={model.id}
              className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-gray-600" role="img" aria-label={model.model}>
                  {getModelIcon(model.model)}
                </span>
                <button
                  onClick={() => setActiveModel(model.id)}
                  className={`flex-1 flex items-center gap-2 text-left ${activeModelId === model.id ? 'text-blue-600' : ''
                    }`}
                >
                  <div>
                    <h4 className="font-medium text-lg">{model.name}</h4>
                    <p className="text-sm text-gray-500">{model.model}</p>
                  </div>
                  {activeModelId === model.id && (
                    <Check size={16} className="text-blue-600 ml-2" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleKeyVisibility(model.id)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded"
                    aria-label="Toggle API key visibility"
                  >
                    {visibleKeys[model.id] ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <button
                    onClick={() => removeAIModel(model.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-500">API Key:</span>
                <code className="flex-1 font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                  {visibleKeys[model.id] ? model.apiKey : '•'.repeat(20)}
                </code>
              </div>
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