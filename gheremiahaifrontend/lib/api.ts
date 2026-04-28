const API_BASE_URL = 'http://localhost:8000';

interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
}

export async function apiRequest<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const {
        method = 'GET',
        body,
        headers = {},
        credentials = 'include',
    } = options;

    const token = localStorage.getItem('accessToken');

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers: requestHeaders,
        credentials,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
}

export const api = {
    get: <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
    post: <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method'>) =>
        apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
    
    put: <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method'>) =>
        apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
    
    delete: <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
    
    patch: <T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method'>) =>
        apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
};
