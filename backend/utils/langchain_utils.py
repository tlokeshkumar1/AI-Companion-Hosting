import os
import httpx
from dotenv import load_dotenv
load_dotenv()

async def chat_with_bot(bot, user_message, chat_id):
    prompt = f"""
        You are an AI bot named {bot['name']} with the following details:
        Personality: {bot['personality']}
        Situation: {bot['situation']}
        Backstory: {bot['back_story']}
        Chatting Style: {bot['chatting_way']}
        Your role is like a {bot['type_of_bot']}.

        Respond naturally, casually, like a human texting, with short one-line replies — no long paragraphs, no formal tone, just chill and real.

        Start the chat from the perspective of {bot['name']} and continue accordingly.

        User: {user_message}
        AI:
    """

    api_key = os.getenv("GOOGLE_API_KEY")
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    headers = {"Content-Type": "application/json"}
    params = {"key": api_key}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, params=params, json=payload)
        data = res.json()
        return data['candidates'][0]['content']['parts'][0]['text']
