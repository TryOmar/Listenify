import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useSettingsStore, type PopupAction } from '../../store/useSettingsStore';

export function PopupActionsSettings() {
  const { popupActions, addPopupAction, removePopupAction, updatePopupAction } = useSettingsStore();
  const [newAction, setNewAction] = useState<Omit<PopupAction, 'id'>>({
    name: '',
    url: '',
    icon: '🔗',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAction.name && newAction.url) {
      addPopupAction(newAction);
      setNewAction({ name: '', url: '', icon: '🔗' });
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Word Popup Actions</h3>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Action Name"
          value={newAction.name}
          onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="URL Template (use {word})"
          value={newAction.url}
          onChange={(e) => setNewAction({ ...newAction, url: e.target.value })}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Icon"
          value={newAction.icon}
          onChange={(e) => setNewAction({ ...newAction, icon: e.target.value })}
          className="w-20 px-3 py-2 border rounded-lg"
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} />
        </button>
      </form>

      <div className="space-y-2">
        {popupActions.map((action) => (
          <div
            key={action.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
          >
            <button className="opacity-0 group-hover:opacity-50 cursor-grab">
              <GripVertical size={20} />
            </button>
            <span className="w-8 text-center">{action.icon}</span>
            <span className="flex-1">{action.name}</span>
            <span className="flex-1 text-gray-500 truncate">{action.url}</span>
            <button
              onClick={() => removePopupAction(action.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}