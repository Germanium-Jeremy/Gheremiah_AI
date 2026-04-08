# Gheremiah AI Third-Party API Documentation

Welcome to the Gheremiah AI API. This guide explains how to integrate your own application with the Gheremiah AI backend to leverage its AI capabilities.

## 1. Authentication

All API requests must be authenticated using an API Key.

### Obtaining an API Key
1. Log in to the Gheremiah AI Web Portal.
2. Navigate to the **Developer Settings** or **API Keys** section.
3. Create a new API key.
4. Copy and store your key securely.

### Using the API Key
Include your API key in the `x-api-key` header of every request:

```http
x-api-key: your_api_key_here
```

---

## 2. AI Chat API

The primary endpoint for interacting with the AI is the chat endpoint.

### Endpoint
`POST /api/chat`

### Request Headers
- `Content-Type: application/json`
- `x-api-key: <YOUR_API_KEY>`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `messages` | Array | Yes | A list of message objects containing `role` and `content`. |
| `model` | String | No | The model to use (e.g., `gemini-2.5-flash`). Defaults to the backend's current default. |
| `system` | String | No | An optional system prompt to guide the AI's behavior. |
| `temperature` | Number | No | Controls randomness (0.0 to 1.0). |

**Example Request Body:**
```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful coding assistant." },
    { "role": "user", "content": "How do I implement a binary search in TypeScript?" }
  ],
  "model": "gemini-2.5-flash",
  "temperature": 0.7
}
```

### Response Format
The API returns a JSON object containing the AI's response.

**Example Success Response:**
```json
{
  "success": true,
  "data": {
    "content": "To implement a binary search in TypeScript, you can use the following code...",
    "usage": {
      "promptTokens": 45,
      "completionTokens": 120,
      "totalTokens": 165
    }
  }
}
```

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid API Key",
    "code": "UNAUTHORIZED"
  }
}
```

---

## 3. Rate Limits and Quotas

Depending on your account tier, rate limits may apply. If you exceed your quota, the API will return a `429 Too Many Requests` status code. We recommend implementing exponential backoff in your client.

## 4. Best Practices
- **Secure Your Keys**: Never commit API keys to public repositories. Use environment variables.
- **Handle Streaming**: The API supports streaming responses via Server-Sent Events (SSE) for real-time UI updates.
- **Context Management**: To maintain conversation history, you must send the previous messages back to the API in the `messages` array.
