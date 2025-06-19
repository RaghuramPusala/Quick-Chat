from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can lock this to your frontend later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/translate")
async def translate(request: Request):
    try:
        body = await request.json()
        q = body.get("q")
        source = body.get("source")
        target = body.get("target")
        format_ = body.get("format", "text")

        url = f"https://translation.googleapis.com/language/translate/v2?key={GOOGLE_API_KEY}"
        payload = {
            "q": q,
            "source": source,
            "target": target,
            "format": format_,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            data = response.json()
            print("🔁 Google API raw response:", data)

        # Check if valid response
        translated = (
            data.get("data", {})
                .get("translations", [{}])[0]
                .get("translatedText")
        )

        if translated:
            return {"translatedText": translated}
        else:
            return {"error": "Translation missing in response", "raw": data}

    except Exception as e:
        return {"error": str(e)}
