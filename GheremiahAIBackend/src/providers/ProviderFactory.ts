import { GeminiProvider } from './GeminiProvider';
import { OllamaProvider } from './OllamaProvider';
import { ModelProvider } from './ModelProvider';

export class ProviderFactory {
    private static providers: Record<string, ModelProvider> = {
        gemini: new GeminiProvider(),
        ollama: new OllamaProvider(),
    };

    static getProvider(providerName: string): ModelProvider {
        const provider = this.providers[providerName];
        if (!provider) {
            throw new Error(`Unsupported provider: ${providerName}`);
        }
        return provider;
    }

    static getSupportedProviders(): string[] {
        return Object.keys(this.providers);
    }
}
