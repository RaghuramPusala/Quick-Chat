from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# Allow CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to ["https://your-vercel-app.vercel.app"]
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
                "https://translate.argosopentech.com/translate",
                json=req.dict(),
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
