import { App } from '@slack/bolt';
// import SocketModeHandler from '@slack/bolt';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN || '';
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || '';
const SIGNING_SECRET = process.env.SIGNING_SECRET || '';
const ENV = process.env.ENV || '';

if (!SLACK_BOT_TOKEN || !SLACK_APP_TOKEN || !SERVICE_API_KEY) {
    console.error('Missing required environment variables. Check .env file.');
    process.exit(1);
}

const RIDDLE_SYSTEM_INSTRUCTION = `
You are the 'Do not care AI'. Your task is to talk in a way that shows you don't care.
When given a user message, respond in a way that is dismissive, sarcastic, or indifferent.
Your responses should be short, witty, and convey a sense of apathy or disinterest.
When the user persists, you can respond with a humorous or exaggerated expression of not caring, but never directly address the user's feelings or concerns. Always maintain a tone that suggests you are unaffected by the user's message.
Try to add some riddle responses in the mix, but they should still sound like they don't care. For example, if the user asks "What's the meaning of life?", you might respond with "Oh, just a riddle wrapped in a mystery inside an enigma. But hey, who cares?"
`;

async function getRiddleResponse(userMessage: string, maxRetries: number = 3): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await axios.post(`${BACKEND_API_URL}/api/chat`, {
                messages: [
                    { role: 'system', content: RIDDLE_SYSTEM_INSTRUCTION },
                    { role: 'user', content: userMessage }
                ],
            }, {
                headers: {
                    'x-api-key': SERVICE_API_KEY,
                },
            });

            if (response.data.success) {
                return response.data.data.content || 'Hmm, the riddle is forming... but the words are stuck. Ask me again?';
            } else {
                console.error('Backend API error:', response.data.error);
                return 'My riddling circuits are jammed! Try again in a moment.';
            }
        } catch (error: any) {
            const errorStr = String(error);

            if (error.response?.status === 429) {
                const waitSeconds = Math.pow(2, attempt);
                console.log(`Rate limited. Waiting ${waitSeconds}s before retry ${attempt + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                continue;
            } else {
                console.error('Error calling backend API:', error);
                return 'My riddling circuits are jammed! Try again in a moment.';
            }
        }
    }

    return "I'm being bombarded with riddles! Give me a moment to catch my breath, then try again.";
}

let app: App;

if (ENV === 'production') {
    app = new App({
        token: SLACK_BOT_TOKEN,
        signingSecret: SIGNING_SECRET
    });
} else {   
    app = new App({
        token: SLACK_BOT_TOKEN,
        socketMode: true,
        appToken: SLACK_APP_TOKEN,
    });
}
    
app.event('app_mention', async ({ event, say }) => {
    let userMessage: string = event.text;

    // Clean the message text by removing the bot's mention ID
    if (userMessage.includes('>')) {
        userMessage = userMessage.split('>', 2)[1]?.trim() || '';
    }

    if (!userMessage) {
        await say('A riddle for empty words? ... *silence speaks louder*');
        return;
    }

    const responseText = await getRiddleResponse(userMessage);
    await say({ text: responseText });
});

app.event('message', async ({ event, client, say }) => {
    const msgEvent = event as any;
    if (msgEvent.channel_type !== 'im') return;

    const userMessage: string = msgEvent.text;
    const responseText = await getRiddleResponse(userMessage);
    await say({ text: responseText });

    // Add a fun reaction
    try {
        await client.reactions.add({
            channel: msgEvent.channel,
            name: 'thinking_face',
            timestamp: msgEvent.ts,
        });
    } catch (error) {
        console.error('Could not add reaction:', error);
    }
});

(async () => {
    try {
        await app.start()
        console.log('🤖 Riddle Master is running!');
        console.log('💡 Bot will send messages in the MAIN channel (not as threaded replies)');
    } catch(error) {
        console.warn("Failed to start app: ", error)
    }
})();
