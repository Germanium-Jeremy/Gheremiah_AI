# Gheremiah AI Third-Party API Documentation

Welcome to the Gheremiah AI API. This guide explains how to integrate your own application with the Gheremiah AI backend to leverage its AI capabilities.

## 1. Authentication

The Gheremiah AI API provides a flexible authentication system. For third-party applications, the **API Key** is the primary and sufficient method of authentication.

### No Session Token Required
Third-party applications **do not need** a user session token (JWT/Bearer token) to make requests. Providing a valid API key is sufficient to authenticate your application and identify the associated user account.

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

The primary endpoint for interacting with the AI is the chat endpoint. It supports both standard JSON responses and real-time streaming.

### Endpoint
`POST /api/chat`

### Request Headers
- `Content-Type: application/json`
- `x-api-key: <YOUR_API_KEY>`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `messages` | Array | Yes | A list of message objects containing `role` (`system`, `user`, `assistant`) and `content`. |
| `model` | String | No | The model to use (e.g., `gemini-2.5-flash`). Defaults to the backend's current default. |
| `systemPrompt` | String | No | An optional system prompt to guide the AI's behavior. |
| `temperature` | Number | No | Controls randomness (0.0 to 2.0). |
| `stream` | Boolean | No | Whether to stream the response using Server-Sent Events (SSE). Defaults to `false`. |
| `maxTokens` | Number | No | Maximum number of tokens to generate. |

### Example: Standard Request (Non-Streaming)
**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello! Who are you?" }
  ],
  "stream": false
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "content": "I am Gheremiah AI, your helpful assistant...",
    "model": "gemini-2.5-flash",
    "timestamp": "2026-08-18T...",
    "usage": {
      "promptTokens": 10,
      "completionTokens": 25,
      "totalTokens": 35
    }
  },
  "timestamp": "2026-08-18T..."
}
```

### Example: Streaming Request
To receive the response in real-time, set `"stream": true`. The server will respond with `text/event-stream`.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Write a short poem about coding." }
  ],
  "stream": true
}
```

**Streaming Response Format (SSE):**
The response consists of a series of data chunks. Each chunk is a JSON object prefixed with `data: `.

```text
data: {"type": "content", "content": "In "}

data: {"type": "content", "content": "the "}

data: {"type": "content", "content": "realm "}

...

data: {"type": "usage", "usage": {"promptTokens": 12, "completionTokens": 45, "totalTokens": 57}}
```

---

## 3. Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request.

| Code | Meaning | Description |
| :--- | :--- | :--- |
| `200` | OK | Request successful. |
| `400` | Bad Request | Validation error in the request body. |
| `401` | Unauthorized | Invalid or missing API key. |
| `429` | Too Many Requests | Rate limit exceeded. |
| `500` | Internal Server Error | An unexpected error occurred on the server. |

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  },
  "timestamp": "2026-08-18T..."
}
```

---

## 4. Rate Limits and Quotas

Rate limits are applied based on the subscription tier of the user associated with the API key. If you exceed your quota, the API will return a `429 Too Many Requests` status code. 

We recommend implementing exponential backoff in your client to handle rate limits gracefully.

## 5. Best Practices

- **Secure Your Keys**: Never commit API keys to public repositories. Use environment variables or a secure secret manager.
- **Context Management**: To maintain conversation history, you must send the previous messages back to the API in the `messages` array.
- **Stream Processing**: When using `stream: true`, ensure your client is capable of parsing SSE (Server-Sent Events) to provide a smooth user experience.
