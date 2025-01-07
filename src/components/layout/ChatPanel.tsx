import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Trash2, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { useChatStore } from '../../store/useChatStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { generateGeminiResponse } from '../../services/geminiService';
import DiscordIcon from '../../icons/discord.svg';

export function ChatPanel() {
    const { messages, addMessage, clearMessages } = useChatStore();
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

    const handleClearChat = () => {
        clearMessages();
        addToast('Chat cleared', 'info');
    };

    return (
        <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <MessageSquare size={40} className="mb-2 opacity-50" />
                        <p className="text-center">No messages yet. Start a conversation!</p>
                        {!activeModel?.apiKey && (
                            <div className="text-center mt-2">
                                <p className="text-sm text-gray-400 mb-3">
                                    Note: Configure an AI model in settings to get started.
                                </p>
                                <a
                                    href="https://discord.gg/c3pxrhTCAB"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm"
                                >
                                    <img src={DiscordIcon} alt="Discord" width="16" height="16" />
                                    Join our Discord for help
                                </a>
                            </div>
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
                                {message.sender === 'user' ? (
                                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ inline, className, children, ...props }) {
                                                    return (
                                                        <code
                                                            className={cn(
                                                                'bg-gray-200 rounded px-1',
                                                                !inline && 'block bg-gray-800 text-gray-100 p-2 my-2',
                                                                className
                                                            )}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                a({ children, ...props }) {
                                                    return (
                                                        <a
                                                            className="text-blue-600 hover:underline"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            {...props}
                                                        >
                                                            {children}
                                                        </a>
                                                    );
                                                }
                                            }}
                                        >
                                            {message.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t">
                <div className="flex gap-2">
                    <textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder={isLoading ? 'AI is thinking...' : 'Type a message... (Shift + Enter for new line)'}
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                        style={{
                            minHeight: '42px',
                            maxHeight: '200px',
                            height: 'auto',
                            overflowY: 'auto'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearChat}
                            disabled={isLoading}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Clear chat"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
} 