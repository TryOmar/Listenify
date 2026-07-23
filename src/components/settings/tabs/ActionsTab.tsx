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
        <section className="space-y-4 text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Actions</h3>

            <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Available placeholders:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono">
                    {activeType === 'word' ? (
                        <li><code>{'{word}'}</code> - Selected single word</li>
                    ) : (
                        <li><code>{'{text}'}</code> - Selected text</li>
                    )}
                    <li><code>{'{speech_language}'}</code> - Speech language (e.g., "English")</li>
                    <li><code>{'{translation_language}'}</code> - Translation language (e.g., "Arabic")</li>
                </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-[auto,1fr] gap-3">
                    <EmojiPicker
                        value={newAction.icon}
                        onChange={(emoji) => setNewAction({ ...newAction, icon: emoji })}
                    />
                    <input
                        type="text"
                        placeholder={activeType === 'word'
                            ? "Enter action name (e.g., 'Google Translate')"
                            : "Enter action name (e.g., 'Search Text')"}
                        value={newAction.name}
                        onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <input
                    type="text"
                    placeholder={`Enter URL template using variables like {${activeType}}. Example: 'https://translate.google.com/?text={${activeType}}'`}
                    value={newAction.url}
                    onChange={(e) => setNewAction({ ...newAction, url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-xs"
                >
                    <Plus className="inline mr-1.5" size={18} />
                    Add {activeType === 'word' ? 'Word' : 'Text'} Action
                </button>
            </form>

            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-4 pt-2">
                <button
                    onClick={() => setActiveType('word')}
                    className={`py-2 px-4 text-xs sm:text-sm font-bold relative transition-colors ${activeType === 'word' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                    Word Actions ({actions.word.length})
                    {activeType === 'word' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>}
                </button>
                <button
                    onClick={() => setActiveType('text')}
                    className={`py-2 px-4 text-xs sm:text-sm font-bold relative transition-colors ${activeType === 'text' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                >
                    Text Actions ({actions.text.length})
                    {activeType === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>}
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
                        <p className="text-center text-slate-400 dark:text-slate-500 py-4 text-xs sm:text-sm">
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
                        <p className="text-center text-slate-400 dark:text-slate-500 py-4 text-xs sm:text-sm">
                            No text actions yet
                        </p>
                    )
                )}
            </div>
        </section>
    );
} 