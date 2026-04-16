'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function ExtensionAuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [isVSCodeExtension, setIsVSCodeExtension] = useState(false);
    const [callbackPort, setCallbackPort] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const vscode = searchParams.get('vscode') === 'true';
        const statusParam = searchParams.get('status');

        setIsVSCodeExtension(vscode);

        if (error) {
            setStatus('error');
            setMessage(decodeURIComponent(error));
            return;
        }

        // For VS Code extension, check status parameter instead of exchanging code
        if (vscode) {
            if (statusParam === 'success') {
                setStatus('success');
                setMessage('Extension successfully authorized! You can close this window and return to VS Code. You might need to click the refresh button.');
            } else {
                setStatus('error');
                setMessage('Authorization failed. Please try again.');
            }
            return;
        }

        if (!code) {
            setStatus('error');
            setMessage('No authorization code provided');
            return;
        }

        // Exchange code for access token (regular OAuth flow)
        const exchangeCode = async () => {
            try {
                const data = await api.post('/api/extension-auth/callback', { code });

                if (data.success) {
                    setStatus('success');
                    setMessage('Extension successfully authorized!');
                    setAccessToken(data.data.accessToken);
                } else {
                    setStatus('error');
                    setMessage(data.error?.message || 'Failed to exchange authorization code');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Failed to connect to server');
            }
        };

        exchangeCode();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
            <div className="max-w-md w-full">
                {status === 'loading' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                            Processing Authorization
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Please wait while we process your authorization...
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                            Authorization Successful!
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                            {message}
                        </p>

                        {accessToken && !isVSCodeExtension && (
                            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-6">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                                    Your Access Token (save this for the extension):
                                </p>
                                <code className="block text-xs bg-zinc-100 dark:bg-zinc-700 p-2 rounded break-all text-zinc-900 dark:text-zinc-100">
                                    {accessToken}
                                </code>
                            </div>
                        )}

                        <div className="space-y-3">
                            {!isVSCodeExtension && (
                                <>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(accessToken)}
                                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Copy Access Token
                                    </button>
                                    <Link
                                        href="/chat"
                                        className="block w-full py-2 px-4 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-center"
                                    >
                                        Return to Chat
                                    </Link>
                                </>
                            )}
                            {isVSCodeExtension && (
                                <button
                                    onClick={() => window.close()}
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Close Window
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                            Authorization Failed
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                            {message}
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/extension-auth"
                                className="block w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                            >
                                Try Again
                            </Link>
                            <Link
                                href="/chat"
                                className="block w-full py-2 px-4 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-center"
                            >
                                Return to Chat
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
