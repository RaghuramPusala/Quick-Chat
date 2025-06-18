from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

# ✅ Load API key from .env file
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

app = FastAPI()

# ✅ CORS settings (you can restrict to your frontend domains later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace * with specific frontend URLs in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/translate")
async def translate(request: Request):
    try:
        # ✅ Extract data from frontend request
        body = await request.json()
        q = body.get("q")
        source = body.get("source")
        target = body.get("target")
        format_ = body.get("format", "text")

        # ✅ Google Translate API URL
        url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
        payload = {
            "q": q,
            "source": source,
            "target": target,
            "format": format_,
        }

        # ✅ Send request to Google Translate
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)

            # ✅ Check for Google-side errors
            if response.status_code != 200:
                return {
                    "error": "Google Translate API error",
                    "status_code": response.status_code,
                    "detail": response.text,
                }

            data = response.json()

        # ✅ Extract translated text
        return {
            "translatedText": data["data"]["translations"][0]["translatedText"]
        }

    except Exception as e:
        # ✅ Return server-side error
        return {"error": "Server error", "detail": str(e)}
