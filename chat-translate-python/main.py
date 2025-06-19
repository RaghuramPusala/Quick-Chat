from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()

# Load the correct key name (match your Render key exactly)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # ⚠️ FIXED: Use correct env var name

if not GOOGLE_API_KEY:
    raise RuntimeError("❌ GOOGLE_API_KEY not found in environment!")

app = FastAPI()

# CORS (Open for development only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 Replace with ["https://your-app.vercel.app"] in prod
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
        "format": req.format,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            data = response.json()

        print("🔄 Google response:", data)  # ✅ Debug print

        if "data" in data and "translations" in data["data"]:
            return {"translatedText": data["data"]["translations"][0]["translatedText"]}
        else:
            return {"error": "Google API returned unexpected structure", "details": data}

    except Exception as e:
        print("❌ Exception during translation:", str(e))
        return {"error": "Translation failed", "details": str(e)}
