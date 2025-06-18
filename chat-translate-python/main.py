from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

# ✅ Allow all origins (you can restrict this later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ LibreTranslate public endpoint or self-hosted if needed
TRANSLATE_API = os.getenv("TRANSLATE_API_URL", "https://libretranslate.de/translate")

@app.post("/translate")
async def translate_text(request: Request):
    try:
        data = await request.json()
        async with httpx.AsyncClient() as client:
            response = await client.post(TRANSLATE_API, json=data)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        return {
            "error": "Translation failed",
            "details": str(e)
        }
