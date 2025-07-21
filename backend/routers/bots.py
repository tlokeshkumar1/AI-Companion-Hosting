from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Body
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os, uuid
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(prefix="/bots", tags=["Bots"])

client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
db = client["ai_companion"]

def get_current_timestamp():
    """Get current UTC timestamp as timezone-aware datetime object."""
    return datetime.now(timezone.utc)

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
    print("Received bot data:", bot_data.name, bot_data.type_of_bot, "Has avatar:", bool(bot_data.avatar_base64))

    try:
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
            "avatar_base64": bot_data.avatar_base64,
            "created_at": get_current_timestamp(),
            "updated_at": get_current_timestamp()
        }

        await db.bots.insert_one(bot)

        return {"message": "Bot created successfully", "bot_id": bot_id}
    
    except Exception as e:
        print("❌ Error in create_bot:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.get("/public")
async def list_public_bots():
    try:
        public_bots = []
        async for bot in db.bots.find({"privacy": "public"}):
            # Convert ObjectId to string for JSON serialization
            bot["_id"] = str(bot["_id"])
            public_bots.append(bot)
        return public_bots
    except Exception as e:
        print("❌ Error in list_public_bots:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.get("/my")
async def list_my_bots(user_id: str):
    try:
        my_bots = []
        async for bot in db.bots.find({"user_id": user_id}):
            # Convert ObjectId to string for JSON serialization
            bot["_id"] = str(bot["_id"])
            my_bots.append(bot)
        return my_bots
    except Exception as e:
        print("❌ Error in list_my_bots:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.put("/{bot_id}")
async def update_bot(bot_id: str, bot_data: BotUpdate):
    try:
        # Find the bot to update
        existing_bot = await db.bots.find_one({"bot_id": bot_id})
        
        if not existing_bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Check if the user owns this bot
        if existing_bot.get("user_id") != bot_data.user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to update this bot")
        
        # Update the bot data
        update_data = {
            "name": bot_data.name,
            "bio": bot_data.bio,
            "first_message": bot_data.first_message,
            "situation": bot_data.situation,
            "back_story": bot_data.back_story,
            "personality": bot_data.personality,
            "chatting_way": bot_data.chatting_way,
            "type_of_bot": bot_data.type_of_bot,
            "privacy": bot_data.privacy,
            "updated_at": get_current_timestamp()
        }
        
        # Only update avatar if provided
        if bot_data.avatar_base64:
            update_data["avatar_base64"] = bot_data.avatar_base64
        
        await db.bots.update_one(
            {"bot_id": bot_id},
            {"$set": update_data}
        )
        
        return {"message": "Bot updated successfully", "bot_id": bot_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error in update_bot:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.delete("/{bot_id}")
async def delete_bot(bot_id: str, user_id: str):
    try:
        # Find the bot to delete
        existing_bot = await db.bots.find_one({"bot_id": bot_id})
        
        if not existing_bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Check if the user owns this bot
        if existing_bot.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this bot")
        
        # Delete the bot
        await db.bots.delete_one({"bot_id": bot_id})
        
        return {"message": "Bot deleted successfully", "bot_id": bot_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error in delete_bot:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.get("/{bot_id}")
async def get_bot(bot_id: str):
    try:
        bot = await db.bots.find_one({"bot_id": bot_id})
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Convert ObjectId to string for JSON serialization
        bot["_id"] = str(bot["_id"])
        return bot
    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error in get_bot:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")
