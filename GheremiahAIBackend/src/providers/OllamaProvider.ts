import { ollama } from 'ai-sdk-ollama';
import { LanguageModel } from 'ai';
import { ModelProvider } from './ModelProvider';

export class OllamaProvider implements ModelProvider {
    readonly name = 'ollama';

    getModel(modelName?: string): LanguageModel {
        // Default model if none provided
        const model = modelName || 'llama3';
        return ollama(model);
    }
}
