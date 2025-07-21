from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, bots, chat
import uvicorn
from dotenv import load_dotenv
from pymongo import MongoClient
import os

load_dotenv()


# Initialize Mongo connection
mongo = MongoClient(os.getenv("MONGODB_URI"))
db_name = os.getenv("MONGODB_DB_NAME", "ai_companion")  # fallback if not in .env
db = mongo[db_name]

app = FastAPI(title="AI Companion API", version="1.0.0")
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]  # Add this line
)

# Then import and include your routers
from routers import auth, bots, chat

# Routers
app.include_router(auth.router)
app.include_router(bots.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Companion API"}

# Test DB connection
try:
    db.users.find_one()
    print("✅ MongoDB Connected Successfully!")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
