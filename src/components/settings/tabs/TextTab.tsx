import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import type { Action } from '../../../store/useSettingsStore';
import { EmojiPicker } from '../../shared/EmojiPicker';

export function TextTab() {
  const { actions, addTextAction, removeTextAction } = useSettingsStore();
  const [newAction, setNewAction] = useState<Omit<Action, 'id'>>({
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

      <div className="text-sm text-gray-500 mb-4">
        <p>Available placeholders:</p>
        <ul className="list-disc list-inside mt-1">
          <li><code>{'{text}'}</code> - Selected text - use in text selection prompts</li>
          <li><code>{'{speech_language}'}</code> - Speech language (e.g., "English")</li>
          <li><code>{'{translation_language}'}</code> - Translation language (e.g., "Arabic")</li>
          <li><code>{'{speech_language_code}'}</code> - Speech language code (e.g., "en")</li>
          <li><code>{'{translation_language_code}'}</code> - Translation language code (e.g., "ar")</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[auto,1fr] gap-4">
          <EmojiPicker
            value={newAction.icon}
            onChange={(emoji) => setNewAction({ ...newAction, icon: emoji })}
          />
          <input
            type="text"
            placeholder="Enter action name (e.g., 'Translate Selection', 'Search Text')"
            value={newAction.name}
            onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        <input
          type="text"
          placeholder="Enter URL template using variables like {text}. Example: 'https://translate.google.com/?text={text}'"
          value={newAction.url}
          onChange={(e) => setNewAction({ ...newAction, url: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="inline mr-2" size={20} />
          Add Text Action
        </button>
      </form>

      <div className="space-y-2">
        {actions.text.map((action) => (
          <div
            key={action.id}
            className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg group"
          >
            <div className="flex items-center gap-2">
              <EmojiPicker
                value={action.icon}
                onChange={() => { }}
                readOnly
              />
              <span className="font-medium flex-1">{action.name}</span>
              <button
                onClick={() => removeTextAction(action.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 font-mono pl-10">
              {action.url}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}