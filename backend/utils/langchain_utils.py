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

    api_key = os.getenv("NVIDIA_API_KEY")
    url = os.getenv("NVIDIA_LLM_URL", "https://integrate.api.nvidia.com/v1/chat/completions")
    model = os.getenv("NVIDIA_LLM_MODEL", "meta/llama-3.1-8b-instruct")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1024
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, json=payload, timeout=30.0)
        res.raise_for_status()
        data = res.json()
        return data['choices'][0]['message']['content']
