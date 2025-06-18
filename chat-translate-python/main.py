# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

load_dotenv()  # load from .env
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OR restrict to Vercel/frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class TranslateRequest(BaseModel):
    q: str
    source: str
    target: str
    format: str = "text"

@app.post("/translate")
async def translate(req: TranslateRequest):
    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=req.dict(), timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
