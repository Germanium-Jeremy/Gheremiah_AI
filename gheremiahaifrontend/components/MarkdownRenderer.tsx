'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
    content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (match) {
                        return (
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg my-3"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        );
                    }
                    return (
                        <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                        </code>
                    );
                },
                pre({ children }) {
                    return <>{children}</>;
                },
                a({ href, children, ...props }: any) {
                    return (
                        <a
                            href={href}
                            className="text-blue-600 hover:text-blue-500 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        >
                            {children}
                        </a>
                    );
                },
                blockquote({ children }: any) {
                    return (
                        <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic my-4">
                            {children}
                        </blockquote>
                    );
                },
                ul({ children }: any) {
                    return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
                },
                ol({ children }: any) {
                    return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
                },
                h1({ children }: any) {
                    return <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>;
                },
                h2({ children }: any) {
                    return <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>;
                },
                h3({ children }: any) {
                    return <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>;
                },
                p({ children }: any) {
                    return <p className="my-2">{children}</p>;
                },
                table({ children }: any) {
                    return (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-zinc-300 dark:border-zinc-700 rounded-lg">
                                {children}
                            </table>
                        </div>
                    );
                },
                thead({ children }: any) {
                    return <thead className="bg-zinc-100 dark:bg-zinc-800">{children}</thead>;
                },
                tbody({ children }: any) {
                    return <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">{children}</tbody>;
                },
                tr({ children }: any) {
                    return <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-750">{children}</tr>;
                },
                th({ children }: any) {
                    return <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-300 dark:border-zinc-700">{children}</th>;
                },
                td({ children }: any) {
                    return <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">{children}</td>;
                },
                hr() {
                    return <hr className="my-6 border-zinc-300 dark:border-zinc-700" />;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
