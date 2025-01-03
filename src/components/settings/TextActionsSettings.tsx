import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export function TextActionsSettings() {
  const { textActions, addTextAction, removeTextAction } = useSettingsStore();
  const [newAction, setNewAction] = useState({
    name: '',
    url: '',
    icon: '🔗',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAction.name && newAction.url) {
      addTextAction(newAction);
      setNewAction({ name: '', url: '', icon: '🔗' });
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Text Selection Actions</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[1fr,1fr,auto] gap-4">
          <input
            type="text"
            placeholder="Action Name"
            value={newAction.name}
            onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="URL Template (use {text})"
            value={newAction.url}
            onChange={(e) => setNewAction({ ...newAction, url: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Icon"
            value={newAction.icon}
            onChange={(e) => setNewAction({ ...newAction, icon: e.target.value })}
            className="w-20 px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="inline mr-2" size={20} />
          Add Text Action
        </button>
      </form>

      <div className="space-y-2">
        {textActions.map((action) => (
          <div
            key={action.id}
            className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg"
          >
            <span className="w-8 text-center">{action.icon}</span>
            <span className="flex-1">{action.name}</span>
            <span className="flex-1 text-gray-500 truncate">{action.url}</span>
            <button
              onClick={() => removeTextAction(action.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}