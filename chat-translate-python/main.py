from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslateRequest(BaseModel):
    q: str
    source: str
    target: str
    format: str = "text"

@app.post("/translate")
async def translate(req: TranslateRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://65.109.114.188:5000/translate"
                json=req.dict(),
                timeout=10
            )
            print("🔍 RAW API RESPONSE:", response.json())  # optional debug
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
