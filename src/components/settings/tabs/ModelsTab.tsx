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
import { useToastStore } from '../../../store/useToastStore';

interface AIModel {
  id: string;
  name: string;
  model: string;
  apiKey: string;
}

const AI_MODEL_OPTIONS = [
  { value: 'gemini', label: 'Gemini', icon: Sparkles },
  { value: 'gpt-4', label: 'GPT-4', icon: Cpu },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', icon: Zap },
  { value: 'claude-3', label: 'Claude 3', icon: Brain },
  { value: 'custom', label: 'Custom Model', icon: Settings },
];

export function ModelsTab() {
  const { aiModels, activeModelId, updateAIModels, setActiveModel } = useSettingsStore();
  const [newModel, setNewModel] = useState<Omit<AIModel, 'id'>>({
    name: '',
    model: AI_MODEL_OPTIONS[0].value,
    apiKey: '',
  });
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [showNewApiKey, setShowNewApiKey] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    if (id === 'default-gemini') {
      useToastStore.getState().addToast('Cannot reveal the default model API key', 'error');
      return;
    }
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getModelIcon = (modelType: string) => {
    const IconComponent = AI_MODEL_OPTIONS.find(opt => opt.value === modelType)?.icon || Settings;
    return <IconComponent size={24} />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newModel.name && newModel.model && newModel.apiKey) {
      const newModelWithId = { ...newModel, id: crypto.randomUUID() };
      updateAIModels([...aiModels, newModelWithId]);
      setNewModel({ name: '', model: AI_MODEL_OPTIONS[0].value, apiKey: '' });
    }
  };

  const handleRemoveModel = (id: string) => {
    if (id === 'default-gemini') {
      useToastStore.getState().addToast('Cannot delete the default model', 'error');
      return;
    }
    const updatedModels = aiModels.filter(model => model.id !== id);
    updateAIModels(updatedModels);
    if (activeModelId === id) {
      setActiveModel(null);
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
              placeholder="Custom Name (e.g., My Gemini)"
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
        <h3 className="text-lg font-semibold">Configured Models</h3>
        <div className="space-y-3">
          {aiModels.map((model) => (
            <div
              key={model.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="text-gray-500">
                {getModelIcon(model.model)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{model.name}</h4>
                  <span className="text-xs text-gray-400">
                    {AI_MODEL_OPTIONS.find(opt => opt.value === model.model)?.label || 'Custom Model'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={visibleKeys[model.id] ? "text" : "password"}
                    value={model.apiKey}
                    readOnly
                    className="text-sm text-gray-500 bg-transparent border-none p-0"
                  />
                  <button
                    onClick={() => toggleKeyVisibility(model.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    {visibleKeys[model.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModel(model.id)}
                  className={`p-2 rounded ${activeModelId === model.id
                    ? 'text-green-500 bg-green-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  title={activeModelId === model.id ? 'Active Model' : 'Set as Active'}
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => handleRemoveModel(model.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {aiModels.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No AI models configured yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}