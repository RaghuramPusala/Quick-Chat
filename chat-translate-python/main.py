from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_API_KEY = os.getenv("VITE_GOOGLE_TRANSLATE_API_KEY")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use ["*"] for development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    q: str
    source: str
    target: str
    format: str = "text"

@app.post("/translate")
async def translate(req: TranslationRequest):
    url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"

    payload = {
        "q": req.q,
        "source": req.source,
        "target": req.target,
        "format": req.format
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        result = response.json()

    # ✅ Extract translated text
    try:
        translated = result["data"]["translations"][0]["translatedText"]
        return {"translatedText": translated}
    except Exception as e:
        return {"error": "Translation failed", "details": result}
