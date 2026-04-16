'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function ExtensionAuthPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [extensionId, setExtensionId] = useState('');
    const [permissions, setPermissions] = useState<string[]>(['read:chat']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [isVSCodeExtension, setIsVSCodeExtension] = useState(false);
    const [callbackPort, setCallbackPort] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            // If coming from VS Code extension, redirect to login with return URL
            const isVSCodeExtension = searchParams.get('vscode') === 'true';
            if (isVSCodeExtension) {
                router.push(`/login?redirect=/extension-auth?vscode=true`);
            } else {
                router.push('/login');
            }
            return;
        }

        setUser(JSON.parse(userData));

        // Check if this is a VS Code extension authorization request
        const vscode = searchParams.get('vscode') === 'true';
        const port = searchParams.get('callbackPort') || '';
        setIsVSCodeExtension(vscode);
        setCallbackPort(port);

        if (vscode) {
            // Auto-fill extension ID for VS Code extension
            setExtensionId('gheremiah-ai-vscode-extension');
        }
    }, [router, searchParams]);

    const handleAuthorize = async (e?: React.MouseEvent | string) => {
        const actualExtensionId = typeof e === 'string' ? e : extensionId;
        if (!actualExtensionId.trim()) {
            setError('Extension ID is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (isVSCodeExtension && callbackPort) {
                // For VS Code extension, create a new extension access token via backend
                const data = await api.post('/api/extension-auth/create-token', {
                    extensionId: actualExtensionId,
                    permissions,
                });

                if (data.success) {
                    const extensionAccessToken = data.data.accessToken;

                    // Send extension access token to local server
                    const response = await fetch(`http://localhost:${callbackPort}/callback?token=${extensionAccessToken}`);
                    if (response.ok) {
                        // Redirect to callback page with success
                        window.location.href = `/extension-auth/callback?vscode=true&status=success`;
                    } else {
                        setError('Failed to send token to extension');
                    }
                } else {
                    setError(data.error?.message || 'Failed to create access token');
                }
            } else {
                // Regular OAuth flow for web extensions
                const data = await api.post('/api/extension-auth/authorize', {
                    extensionId: actualExtensionId,
                    permissions,
                    redirectUri: `${window.location.origin}/extension-auth/callback`,
                });

                if (data.success) {
                    // Redirect to the authorization URL
                    window.location.href = data.data.authUrl;
                } else {
                    setError(data.error?.message || 'Authorization failed');
                }
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (perm: string) => {
        setPermissions(prev =>
            prev.includes(perm)
                ? prev.filter(p => p !== perm)
                : [...prev, perm]
        );
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
            <div className="max-w-2xl w-full space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-center text-zinc-900 dark:text-zinc-50">
                        Authorize Extension
                    </h1>
                    <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        Grant permissions to allow the extension to access your account
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="extensionId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Extension ID
                        </label>
                        <input
                            id="extensionId"
                            type="text"
                            value={extensionId}
                            onChange={(e) => setExtensionId(e.target.value)}
                            className="block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="e.g., gheremiah-extension-v1"
                            disabled={isVSCodeExtension}
                        />
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            This is provided by the extension you want to authorize
                        </p>
                    </div>

                    {!isVSCodeExtension && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                                Permissions
                            </label>
                            <div className="space-y-2">
                                {[
                                    { id: 'read:chat', label: 'Read chat history', desc: 'Allow extension to read your chat messages' },
                                    { id: 'write:chat', label: 'Send chat messages', desc: 'Allow extension to send messages on your behalf' },
                                    { id: 'read:profile', label: 'Read profile information', desc: 'Allow extension to access your profile data' },
                                ].map((perm) => (
                                    <div key={perm.id} className="flex items-start">
                                        <input
                                            type="checkbox"
                                            id={perm.id}
                                            checked={permissions.includes(perm.id)}
                                            onChange={() => togglePermission(perm.id)}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
                                        />
                                        <div className="ml-3">
                                            <label htmlFor={perm.id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                {perm.label}
                                            </label>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {perm.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Warning:</strong> Only authorize extensions from trusted sources. 
                            Unauthorized extensions may access your personal data.
                        </p>
                    </div>

                    <button
                        onClick={handleAuthorize}
                        disabled={loading || !extensionId.trim() || permissions.length === 0}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Authorizing...' : 'Authorize Extension'}
                    </button>

                    <div className="text-center text-sm">
                        <Link href="/chat" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                            Cancel and return to chat
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
