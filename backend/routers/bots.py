from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Body
import json, os, uuid, base64

router = APIRouter(prefix="/bots", tags=["Bots"])

BOTS_FILE = "bots_data.json"

def load_bots():
    if not os.path.exists(BOTS_FILE):
        return []
    try:
        with open(BOTS_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print("⚠️ Warning: bots_data.json is empty or corrupted. Replacing with empty list.")
        return []

def save_bots(bots):
    with open(BOTS_FILE, "w") as f:
        json.dump(bots, f, indent=2)

class BotCreate(BaseModel):
    user_id: str
    name: str
    bio: str
    first_message: str
    situation: str
    back_story: str
    personality: str
    chatting_way: str
    type_of_bot: str
    privacy: str
    avatar_base64: str = None

class BotUpdate(BaseModel):
    user_id: str
    name: str
    bio: str
    first_message: str
    situation: str
    back_story: str
    personality: str
    chatting_way: str
    type_of_bot: str
    privacy: str
    avatar_base64: str = None

@router.post("/createbot")
async def create_bot(bot_data: BotCreate):
    # 🔽 DEBUG PRINT HERE
    print("Received bot data:", bot_data.name, bot_data.type_of_bot, "Has avatar:", bool(bot_data.avatar_base64))

    try:
        bots = load_bots()
        bot_id = str(uuid.uuid4())

        bot = {
            "bot_id": bot_id,
            "user_id": bot_data.user_id,
            "name": bot_data.name,
            "bio": bot_data.bio,
            "first_message": bot_data.first_message,
            "situation": bot_data.situation,
            "back_story": bot_data.back_story,
            "personality": bot_data.personality,
            "chatting_way": bot_data.chatting_way,
            "type_of_bot": bot_data.type_of_bot,
            "privacy": bot_data.privacy,
            "avatar_base64": bot_data.avatar_base64
        }

        bots.append(bot)
        save_bots(bots)

        return {"message": "Bot created successfully", "bot_id": bot_id}
    
    except Exception as e:
        print("❌ Error in create_bot:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.get("/public")
async def list_public_bots():
    bots = load_bots()
    public_bots = []
    for bot in bots:
        if bot.get("privacy") == "public":
            public_bots.append(bot)
    return public_bots

@router.get("/my")
async def list_my_bots(user_id: str):
    bots = load_bots()
    my_bots = []
    for bot in bots:
        if bot.get("user_id") == user_id:
            my_bots.append(bot)
    return my_bots

@router.put("/{bot_id}")
async def update_bot(bot_id: str, bot_data: BotUpdate):
    try:
        bots = load_bots()
        bot_index = -1
        
        # Find the bot to update
        for i, bot in enumerate(bots):
            if bot.get("bot_id") == bot_id:
                bot_index = i
                break
        
        if bot_index == -1:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Check if the user owns this bot
        if bots[bot_index].get("user_id") != bot_data.user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to update this bot")
        
        # Update the bot data
        bots[bot_index].update({
            "name": bot_data.name,
            "bio": bot_data.bio,
            "first_message": bot_data.first_message,
            "situation": bot_data.situation,
            "back_story": bot_data.back_story,
            "personality": bot_data.personality,
            "chatting_way": bot_data.chatting_way,
            "type_of_bot": bot_data.type_of_bot,
            "privacy": bot_data.privacy,
            "avatar_base64": bot_data.avatar_base64 if bot_data.avatar_base64 else bots[bot_index].get("avatar_base64")
        })
        
        save_bots(bots)
        
        return {"message": "Bot updated successfully", "bot_id": bot_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error in update_bot:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.delete("/{bot_id}")
async def delete_bot(bot_id: str, user_id: str):
    try:
        bots = load_bots()
        bot_index = -1
        
        # Find the bot to delete
        for i, bot in enumerate(bots):
            if bot.get("bot_id") == bot_id:
                bot_index = i
                break
        
        if bot_index == -1:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Check if the user owns this bot
        if bots[bot_index].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this bot")
        
        # Remove the bot from the list (no file deletion needed for base64)
        bots.pop(bot_index)
        save_bots(bots)
        
        return {"message": "Bot deleted successfully", "bot_id": bot_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error in delete_bot:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.get("/{bot_id}")
async def get_bot(bot_id: str):
    bots = load_bots()
    for bot in bots:
        if bot.get("bot_id") == bot_id:
            return bot
    raise HTTPException(status_code=404, detail="Bot not found")
