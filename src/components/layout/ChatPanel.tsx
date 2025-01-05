import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useChatStore } from '../../store/useChatStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { generateGeminiResponse } from '../../services/geminiService';

export function ChatPanel() {
    const { messages, addMessage } = useChatStore();
    const { aiModels, activeModelId } = useSettingsStore();
    const { addToast } = useToastStore();
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeModel = aiModels.find(model => model.id === activeModelId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isLoading) return;

        // Add user message
        addMessage(newMessage, 'user');
        setNewMessage('');
        setIsLoading(true);

        try {
            if (activeModel?.model === 'gemini' && activeModel.apiKey) {
                // Use Gemini
                const response = await generateGeminiResponse(newMessage, activeModel.apiKey);
                addMessage(response, 'ai');
            } else {
                // Fallback to simulation
                setTimeout(() => {
                    addMessage('Please configure an AI model in settings.', 'ai');
                }, 1000);
            }
        } catch (error) {
            console.error('Error generating response:', error);
            addToast('Error generating AI response', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <MessageSquare size={40} className="mb-2 opacity-50" />
                        <p className="text-center">No messages yet. Start a conversation!</p>
                        {!activeModel?.apiKey && (
                            <p className="text-sm mt-2 text-gray-400">
                                Note: Configure an AI model in settings to get started.
                            </p>
                        )}
                    </div>
                ) : (
                    messages.map(message => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={cn(
                                    'max-w-[80%] p-3 rounded-lg',
                                    message.sender === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-none'
                                        : 'bg-gray-100 text-gray-700 rounded-bl-none'
                                )}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={isLoading ? 'AI is thinking...' : 'Type a message...'}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
} 