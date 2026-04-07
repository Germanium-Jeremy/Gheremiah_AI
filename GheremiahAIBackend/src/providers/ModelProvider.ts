import { LanguageModel } from 'ai';

export interface ProviderOptions {
    messages: any[];
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
}

export interface ModelProvider {
    readonly name: string;
    getModel(modelName?: string): LanguageModel;
}
