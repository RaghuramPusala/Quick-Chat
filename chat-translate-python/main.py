from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow Vercel frontend + local dev
origins = [
    "http://localhost:5173",
    "https://your-vercel-domain.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

LIBRETRANSLATE_URL = "https://libretranslate.de/translate"


@app.post("/translate")
async def translate(request: Request):
    body = await request.json()
    q = body.get("q")
    source = body.get("source")
    target = body.get("target")

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(TRANSLATE_URL, json={
                "q": q,
                "source": source,
                "target": target,
                "format": "text"
            })
            translated = res.json().get("translatedText")
            return {"translatedText": translated}
        except Exception as e:
            return {"error": "Translation failed", "details": str(e)}
