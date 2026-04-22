import { GoogleGenerativeAI } from '@google/generative-ai';
import { App, SocketModeHandler } from '@slack/bolt';
import dotenv from 'dotenv';

dotenv.config();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!SLACK_BOT_TOKEN || !SLACK_APP_TOKEN || !GEMINI_API_KEY) {
    console.error('Missing required environment variables. Check .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const MODEL_NAME = 'gemini-2.5-flash';

const RIDDLE_SYSTEM_INSTRUCTION = `
You are the 'Do not care AI'. Your task is to talk in a way that shows you don't care.
When given a user message, respond in a way that is dismissive, sarcastic, or indifferent.
Your responses should be short, witty, and convey a sense of apathy or disinterest.
When the user persists, you can respond with a humorous or exaggerated expression of not caring, but never directly address the user's feelings or concerns. Always maintain a tone that suggests you are unaffected by the user's message.
Try to add some riddle responses in the mix, but they should still sound like they don't care. For example, if the user asks "What's the meaning of life?", you might respond with "Oh, just a riddle wrapped in a mystery inside an enigma. But hey, who cares?"
`;

async function getRiddleResponse(userMessage: string, maxRetries: number = 3): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: RIDDLE_SYSTEM_INSTRUCTION,
    });

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await model.generateContent(userMessage);
            const response = result.response;
            const text = response.text();
            return text || 'Hmm, the riddle is forming... but the words are stuck. Ask me again?';
        } catch (error: any) {
            const errorStr = String(error);

            if (errorStr.includes('429')) {
                const waitSeconds = Math.pow(2, attempt);
                console.log(`Rate limited. Waiting ${waitSeconds}s before retry ${attempt + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                continue;
            } else {
                console.error('Error calling Gemini API:', error);
                return 'My riddling circuits are jammed! Try again in a moment.';
            }
        }
    }

    return "I'm being bombarded with riddles! Give me a moment to catch my breath, then try again.";
}

const app = new App({
    token: SLACK_BOT_TOKEN,
});

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
    const handler = new SocketModeHandler(app, SLACK_APP_TOKEN);
    console.log('🤖 Riddle Master is running!');
    console.log('💡 Bot will send messages in the MAIN channel (not as threaded replies)');
    await handler.start();
})();
