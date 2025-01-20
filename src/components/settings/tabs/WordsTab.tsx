import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import type { Action } from '../../../store/useSettingsStore';
import { EmojiPicker } from '../../shared/EmojiPicker';
import { ActionCard } from '../../shared/ActionCard';

export function WordsTab() {
  const { actions, addWordAction, removeWordAction, updateWordActions } = useSettingsStore();
  const [newAction, setNewAction] = useState<Omit<Action, 'id'>>({
    name: '',
    url: '',
    icon: '🔗',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAction.name && newAction.url) {
      addWordAction(newAction);
      setNewAction({ name: '', url: '', icon: '🔗' });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newActions = [...actions.word];
      [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
      updateWordActions(newActions);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < actions.word.length - 1) {
      const newActions = [...actions.word];
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
      updateWordActions(newActions);
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Word Actions</h3>

      <div className="text-sm text-gray-500 mb-4">
        <p>Available placeholders:</p>
        <ul className="list-disc list-inside mt-1">
          <li><code>{'{word}'}</code> - Selected single word - use in word popup prompts</li>
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
            placeholder="Enter action name (e.g., 'Google Translate', 'Dictionary Lookup')"
            value={newAction.name}
            onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        <input
          type="text"
          placeholder="Enter URL template using variables like {word}. Example: 'https://translate.google.com/?text={word}'"
          value={newAction.url}
          onChange={(e) => setNewAction({ ...newAction, url: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="inline mr-2" size={20} />
          Add Word Action
        </button>
      </form>

      <div className="space-y-2">
        {actions.word.map((action, index) => (
          <ActionCard
            key={action.id}
            id={action.id}
            icon={action.icon}
            name={action.name}
            content={action.url}
            onDelete={removeWordAction}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            isFirst={index === 0}
            isLast={index === actions.word.length - 1}
          />
        ))}
      </div>
    </section>
  );
}