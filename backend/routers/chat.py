from fastapi import APIRouter, Body, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from utils.langchain_utils import chat_with_bot
from datetime import datetime, timezone
import uuid, os, json
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(prefix="/chat", tags=["Chat"])

client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
db = client["ai_companion"]

def get_current_timestamp():
    """Get current UTC timestamp as timezone-aware datetime object."""
    return datetime.now(timezone.utc)

def format_timestamp_for_response(timestamp):
    """Format timestamp for API response with proper timezone handling."""
    if not timestamp:
        return get_current_timestamp().isoformat()
    
    if isinstance(timestamp, datetime):
        # Ensure timezone awareness
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        return timestamp.isoformat()
    elif isinstance(timestamp, str):
        try:
            # Validate the timestamp string
            parsed = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return parsed.isoformat()
        except ValueError:
            # If invalid, return current time
            return get_current_timestamp().isoformat()
    else:
        return get_current_timestamp().isoformat()

@router.post("/ask")
async def ask(
    user_id: str = Body(...),
    bot_id: str = Body(...),
    message: str = Body(...),
    is_system_message: bool = Body(False),
    response: str = Body(None),
    message_id: str = Body(None)
):
    chat_id = f"{user_id}_{bot_id}"
    
    # Load bot data to get avatar_base64
    with open("bots_data.json", "r") as f:
        bots = json.load(f)
    bot = next((b for b in bots if b["bot_id"] == bot_id), None)
    if not bot:
        return {"status": "error", "message": "Bot not found"}

    # If it's a system message (like bot's first message), store it directly
    if is_system_message and response:
        await db.chats.insert_one({
            "chat_id": chat_id,
            "user_id": user_id,
            "bot_id": bot_id,
            "message": message,  # Empty for system messages
            "response": response,
            "is_system_message": True,
            "message_id": message_id or str(uuid.uuid4()),
            "timestamp": get_current_timestamp(),
            "bot_avatar_base64": bot.get("avatar_base64"),
            "previous_update": None,
            "updated": get_current_timestamp()
        })
        return {"status": "success", "message": "System message stored"}
    
    # Normal user message flow
    response = await chat_with_bot(bot, message, chat_id)

    await db.chats.insert_one({
        "chat_id": chat_id,
        "user_id": user_id,
        "bot_id": bot_id,
        "message": message,
        "response": response,
        "message_id": message_id or str(uuid.uuid4()),
        "timestamp": get_current_timestamp(),
        "bot_avatar_base64": bot.get("avatar_base64"),
        "previous_update": None,
        "updated": get_current_timestamp()
    })

    return {"status": "success", "response": response}

@router.get("/history")
async def get_chat_history(user_id: str, bot_id: str):
    try:
        chat_id = f"{user_id}_{bot_id}"
        # Convert MongoDB cursor to list of dicts and handle ObjectId serialization
        history = []
        async for doc in db.chats.find({"chat_id": chat_id}).sort("timestamp", 1):
            # Convert ObjectId to string
            doc["_id"] = str(doc["_id"])
            # Format timestamp properly
            doc["timestamp"] = format_timestamp_for_response(doc.get("timestamp"))
            history.append(doc)
        return {"status": "success", "data": history}
    except Exception as e:
        print(f"Error in get_chat_history: {str(e)}")  # Add logging
        return {"status": "error", "message": str(e)}

@router.delete("/restart")
async def restart_chat(user_id: str, bot_id: str):
    try:
        chat_id = f"{user_id}_{bot_id}"
        # Print debug info
        print(f"Attempting to delete chat history for chat_id: {chat_id}")
        
        # Delete all messages for this chat
        result = await db.chats.delete_many({"chat_id": chat_id})
        
        # Log the result
        print(f"Deleted {result.deleted_count} messages for chat_id: {chat_id}")
        
        # Return success response with count of deleted messages
        return {
            "status": "success",
            "message": "Chat history cleared successfully",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        print(f"Error in restart_chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear chat history: {str(e)}"
        )
