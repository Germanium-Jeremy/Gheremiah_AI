/** @type {import('tailwindcss').Config} */

export default {

  content: ["./src/**/*.{html,js}"],

  theme: {

    extend: {colors: {
      'vscode-bg': 'var(--vscode-editor-background)',
      'vscode-text': 'var(--vscode-editor-foreground)',
      'vscode-button': 'var(--vscode-button-background)',
      'vscode-button-hover': 'var(--vscode-button-hoverBackground)',
      'vscode-input': 'var(--vscode-input-background)',
      'vscode-border': 'var(--vscode-panel-border)',
    }},

  },

  plugins: [],

  safelist: [
    'bg-blue-500',
    'text-white',
  ],

}
