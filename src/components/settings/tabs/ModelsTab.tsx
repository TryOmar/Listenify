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
  Settings,
  Fish
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
  { value: 'deepseek', label: 'DeepSeek', icon: Fish },
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
    <section className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add AI Model</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Custom Name (e.g., My Gemini)"
              value={newModel.name}
              onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newModel.model}
              onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AI_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
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
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowNewApiKey(!showNewApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
              aria-label="Toggle API key visibility"
            >
              {showNewApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-xs"
          >
            <Plus className="inline mr-1.5" size={18} />
            Add Model
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Configured Models</h3>
        <div className="space-y-3">
          {aiModels.map((model) => (
            <div
              key={model.id}
              className="flex items-center gap-3 sm:gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl"
            >
              <div className="text-slate-500 dark:text-slate-400 shrink-0">
                {getModelIcon(model.model)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{model.name}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {AI_MODEL_OPTIONS.find(opt => opt.value === model.model)?.label || 'Custom Model'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type={visibleKeys[model.id] ? "text" : "password"}
                    value={model.apiKey}
                    readOnly
                    className="text-xs text-slate-500 dark:text-slate-400 bg-transparent border-none p-0 font-mono truncate focus:outline-none"
                  />
                  <button
                    onClick={() => toggleKeyVisibility(model.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md shrink-0"
                  >
                    {visibleKeys[model.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveModel(model.id)}
                  className={`p-2 rounded-xl transition-colors ${activeModelId === model.id
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800/80'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                    }`}
                  title={activeModelId === model.id ? 'Active Model' : 'Set as Active'}
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => handleRemoveModel(model.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
                  title="Remove Model"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {aiModels.length === 0 && (
            <p className="text-center text-slate-400 dark:text-slate-500 py-4 text-xs sm:text-sm">
              No AI models configured yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}