from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, Form, File, HTTPException
import json, os, uuid

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

@router.post("/createbot")
async def create_bot(
    user_id: str = Form(...),
    name: str = Form(...),
    bio: str = Form(...),
    first_message: str = Form(...),
    situation: str = Form(...),
    back_story: str = Form(...),
    personality: str = Form(...),
    chatting_way: str = Form(...),
    type_of_bot: str = Form(...),
    privacy: str = Form(...),
    avatar: UploadFile = File(None)  # ✅ FIXED HERE
):
    # 🔽 DEBUG PRINT HERE
    print("Received form data:", name, type_of_bot, avatar.filename if avatar else "No avatar")

    try:
        bots = load_bots()
        bot_id = str(uuid.uuid4())
        avatar_path = None

        if avatar:
            os.makedirs("uploads", exist_ok=True)
            filename = f"{bot_id}_{avatar.filename}"
            avatar_path = filename  # Store just the filename, not the full path
            with open(f"uploads/{filename}", "wb") as f:
                f.write(await avatar.read())

        bot = {
            "bot_id": bot_id,
            "user_id": user_id,
            "name": name,
            "bio": bio,
            "first_message": first_message,
            "situation": situation,
            "back_story": back_story,
            "personality": personality,
            "chatting_way": chatting_way,
            "type_of_bot": type_of_bot,
            "privacy": privacy,
            "avatar": avatar_path
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
            if bot.get("avatar"):
                # Ensure the avatar path is just the filename
                bot["avatar"] = bot["avatar"].replace("uploads/", "").replace("avatars/", "")
            public_bots.append(bot)
    return public_bots

@router.get("/my")
async def list_my_bots(user_id: str):
    bots = load_bots()
    my_bots = []
    for bot in bots:
        if bot.get("user_id") == user_id:
            if bot.get("avatar"):
                # Ensure the avatar path is just the filename
                bot["avatar"] = bot["avatar"].replace("uploads/", "").replace("avatars/", "")
            my_bots.append(bot)
    return my_bots

@router.put("/{bot_id}")
async def update_bot(
    bot_id: str,
    user_id: str = Form(...),
    name: str = Form(...),
    bio: str = Form(...),
    first_message: str = Form(...),
    situation: str = Form(...),
    back_story: str = Form(...),
    personality: str = Form(...),
    chatting_way: str = Form(...),
    type_of_bot: str = Form(...),
    privacy: str = Form(...),
    avatar: UploadFile = File(None)
):
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
        if bots[bot_index].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to update this bot")
        
        # Handle avatar upload if provided
        avatar_path = bots[bot_index].get("avatar")  # Keep existing avatar by default
        
        if avatar:
            os.makedirs("uploads", exist_ok=True)
            filename = f"{bot_id}_{avatar.filename}"
            avatar_path = filename
            
            # Save the new avatar file
            with open(f"uploads/{filename}", "wb") as f:
                f.write(await avatar.read())
        
        # Update the bot data
        bots[bot_index].update({
            "name": name,
            "bio": bio,
            "first_message": first_message,
            "situation": situation,
            "back_story": back_story,
            "personality": personality,
            "chatting_way": chatting_way,
            "type_of_bot": type_of_bot,
            "privacy": privacy,
            "avatar": avatar_path
        })
        
        save_bots(bots)
        
        return {"message": "Bot updated successfully", "bot_id": bot_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error in update_bot:", str(e))
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

@router.get("/{bot_id}")
async def get_bot(bot_id: str):
    bots = load_bots()
    for bot in bots:
        if bot.get("bot_id") == bot_id:
            # Fix avatar path if it starts with avatars/
            if bot.get("avatar"):
                # Ensure the avatar path is just the filename
                bot["avatar"] = bot["avatar"].replace("uploads/", "").replace("avatars/", "")
            return bot
    raise HTTPException(status_code=404, detail="Bot not found")