import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import type { Action } from '../../../store/useSettingsStore';
import { EmojiPicker } from '../../shared/EmojiPicker';
import { ActionCard } from '../../shared/ActionCard';

export function ActionsTab() {
    const {
        actions,
        addWordAction,
        addTextAction,
        removeWordAction,
        removeTextAction,
        updateWordActions,
        updateTextActions,
        editWordAction,
        editTextAction
    } = useSettingsStore();

    const [activeType, setActiveType] = useState<'word' | 'text'>('word');
    const [newAction, setNewAction] = useState<Omit<Action, 'id'>>({
        name: '',
        url: '',
        icon: '🔗',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAction.name && newAction.url) {
            if (activeType === 'word') {
                addWordAction(newAction);
            } else {
                addTextAction(newAction);
            }
            setNewAction({ name: '', url: '', icon: '🔗' });
        }
    };

    const handleMoveUp = (index: number, type: 'word' | 'text') => {
        if (index > 0) {
            const newActions = type === 'word' ? [...actions.word] : [...actions.text];
            [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
            if (type === 'word') {
                updateWordActions(newActions);
            } else {
                updateTextActions(newActions);
            }
        }
    };

    const handleMoveDown = (index: number, type: 'word' | 'text') => {
        const actionsList = type === 'word' ? actions.word : actions.text;
        if (index < actionsList.length - 1) {
            const newActions = [...actionsList];
            [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
            if (type === 'word') {
                updateWordActions(newActions);
            } else {
                updateTextActions(newActions);
            }
        }
    };

    const handleDelete = (id: string) => {
        if (activeType === 'word') {
            removeWordAction(id);
        } else {
            removeTextAction(id);
        }
    };

    const handleEdit = (id: string, updates: { icon: string; name: string; content: string }) => {
        if (activeType === 'word') {
            editWordAction(id, { ...updates, url: updates.content });
        } else {
            editTextAction(id, { ...updates, url: updates.content });
        }
    };

    return (
        <section className="space-y-4">
            <h3 className="text-lg font-semibold">Actions</h3>

            <div className="text-sm text-gray-500 mb-4">
                <p>Available placeholders:</p>
                <ul className="list-disc list-inside mt-1">
                    {activeType === 'word' ? (
                        <li><code>{'{word}'}</code> - Selected single word - use in word popup prompts</li>
                    ) : (
                        <li><code>{'{text}'}</code> - Selected text - use in text selection prompts</li>
                    )}
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
                        placeholder={activeType === 'word'
                            ? "Enter action name (e.g., 'Google Translate', 'Dictionary Lookup')"
                            : "Enter action name (e.g., 'Translate Selection', 'Search Text')"}
                        value={newAction.name}
                        onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                        className="px-3 py-2 border rounded-lg"
                    />
                </div>
                <input
                    type="text"
                    placeholder={`Enter URL template using variables like {${activeType}}. Example: 'https://translate.google.com/?text={${activeType}}'`}
                    value={newAction.url}
                    onChange={(e) => setNewAction({ ...newAction, url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                />
                <button
                    type="submit"
                    className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    <Plus className="inline mr-2" size={20} />
                    Add {activeType === 'word' ? 'Word' : 'Text'} Action
                </button>
            </form>

            <div className="flex gap-2 border-b mb-4">
                <button
                    onClick={() => setActiveType('word')}
                    className={`py-2 px-4 relative ${activeType === 'word' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                >
                    Word Actions ({actions.word.length})
                    {activeType === 'word' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                </button>
                <button
                    onClick={() => setActiveType('text')}
                    className={`py-2 px-4 relative ${activeType === 'text' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                >
                    Text Actions ({actions.text.length})
                    {activeType === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                </button>
            </div>

            <div className="space-y-2">
                {activeType === 'word' ? (
                    actions.word.length > 0 ? (
                        actions.word.map((action, index) => (
                            <ActionCard
                                key={action.id}
                                id={action.id}
                                icon={action.icon}
                                name={action.name}
                                content={action.url}
                                onDelete={handleDelete}
                                onMoveUp={() => handleMoveUp(index, 'word')}
                                onMoveDown={() => handleMoveDown(index, 'word')}
                                onEdit={(id, updates) => handleEdit(id, updates)}
                                isFirst={index === 0}
                                isLast={index === actions.word.length - 1}
                            />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">
                            No word actions yet
                        </p>
                    )
                ) : (
                    actions.text.length > 0 ? (
                        actions.text.map((action, index) => (
                            <ActionCard
                                key={action.id}
                                id={action.id}
                                icon={action.icon}
                                name={action.name}
                                content={action.url}
                                onDelete={handleDelete}
                                onMoveUp={() => handleMoveUp(index, 'text')}
                                onMoveDown={() => handleMoveDown(index, 'text')}
                                onEdit={(id, updates) => handleEdit(id, updates)}
                                isFirst={index === 0}
                                isLast={index === actions.text.length - 1}
                            />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">
                            No text actions yet
                        </p>
                    )
                )}
            </div>
        </section>
    );
} 