'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

interface LogEntry {
    timestamp: string;
    type: 'error' | 'access' | 'info';
    method?: string;
    path?: string;
    statusCode?: number;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
    userId?: string;
    ip?: string;
    userAgent?: string;
}

interface SystemConfig {
    activeProvider: 'gemini' | 'ollama';
    updatedAt: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<'all' | 'error' | 'access' | 'info'>('all');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
    const [configLoading, setConfigLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
            router.push('/chat');
            return;
        }

        setUser(parsedUser);
        fetchLogs();
        fetchConfig();
    }, [router]);

    const fetchLogs = async () => {
        try {
            const url = filter === 'all'
                ? '/api/admin/logs'
                : `/api/admin/logs?type=${filter}`;

            const data = await api.get(url);
            if (data.success) {
                setLogs(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const data = await api.get('/api/admin/config');
            if (data.success) {
                setSystemConfig(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch system config:', err);
        }
    };

    const handleUpdateProvider = async (provider: 'gemini' | 'ollama') => {
        setConfigLoading(true);
        try {
            const data = await api.patch('/api/admin/config', { activeProvider: provider });
            if (data.success) {
                setSystemConfig(data.data);
            }
        } catch (err) {
            console.error('Failed to update provider:', err);
            alert('Failed to update provider');
        } finally {
            setConfigLoading(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            // We can test connection by making a simple chat request
            const response = await api.post('/api/chat', {
                messages: [{ role: 'user', content: 'Ping' }],
                stream: false,
            });
            if (response.success) {
                alert('Connection successful!');
            }
        } catch (err) {
            console.error('Connection test failed:', err);
            alert('Connection test failed. Please check provider settings.');
        }
    };

    const handleClearLogs = async () => {
        if (!confirm('Are you sure you want to clear all logs?')) return;

        try {
            await api.delete('/api/admin/logs');
            setLogs([]);
        } catch (err) {
            console.error('Failed to clear logs:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    if (!user) {
        return null;
    }

    const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        Admin Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {user.email}
                        </span>
                        <Link
                            href="/chat"
                            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                            Go to Chat
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

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <section className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow border border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                                System Configuration
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-2">
                                        Active LLM Provider
                                    </label>
                                    <select
                                        value={systemConfig?.activeProvider || 'gemini'}
                                        onChange={(e) => handleUpdateProvider(e.target.value as 'gemini' | 'ollama')}
                                        disabled={configLoading}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="gemini">Google Gemini</option>
                                        <option value="ollama">Ollama (Local)</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleTestConnection}
                                    disabled={configLoading}
                                    className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors"
                                >
                                    Test Connection
                                </button>
                                {systemConfig?.updatedAt && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                        Last updated: {new Date(systemConfig.updatedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex gap-2">
                                {(['all', 'error', 'access', 'info'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilter(type)}
                                        className={`px-4 py-2 rounded-lg font-medium capitalize ${
                                            filter === type
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleClearLogs}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Clear Logs
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    Timestamp
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    Method
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    Path
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    User ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                    Details
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                                            {filteredLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                                                        No logs found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredLogs.map((log, index) => (
                                                    <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                log.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                                                log.type === 'access' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                                                'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                            }`}>
                                                                {log.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                                                            {log.method || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                                                            {log.path || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                                                            {log.statusCode !== undefined ? (
                                                                <span className={log.statusCode >= 400 ? 'text-red-600' : 'text-green-600'}>
                                                                    {log.statusCode}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-50">
                                                            {log.userId || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50 max-w-xs truncate">
                                                            {log.error?.message || log.ip || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
