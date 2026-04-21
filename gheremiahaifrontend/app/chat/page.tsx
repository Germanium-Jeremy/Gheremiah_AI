'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(userData));
    }, [router]);

    const handleSendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messages: [
                        ...messages,
                        { role: 'user', content: userMessage }
                    ],
                    model: 'gemini-2.5-flash',
                }),
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.data.content }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error?.message || 'Failed to get response'}` }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to connect to server' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col bg-zinc-50 dark:bg-black">
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        Gheremiah AI
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {user.email}
                        </span>
                        <Link
                            href="/extension-auth"
                            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                            Authorize Extension
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-600 hover:text-red-500 dark:text-red-400"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                Welcome to Gheremiah AI
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Start a conversation by typing a message below
                            </p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            rows={1}
                            className="flex-1 resize-none border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={loading || !input.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
