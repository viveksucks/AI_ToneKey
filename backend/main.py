from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ToneRequest(BaseModel):
    message: str
    tone: str


@app.get("/")
def home():
    return {
        "message": "AI Tone Key backend is running"
    }


# CHECK IF OLLAMA AI IS ONLINE
@app.get("/status")
def status():
    try:
        response = requests.get(
            "http://localhost:11434/api/tags",
            timeout=2
        )

        if response.status_code == 200:
            return {
                "backend": "online",
                "ollama": "online",
                "ai": "online"
            }

        return {
            "backend": "online",
            "ollama": "offline",
            "ai": "offline"
        }

    except requests.RequestException:
        return {
            "backend": "online",
            "ollama": "offline",
            "ai": "offline"
        }


@app.post("/rewrite")
def rewrite_message(request: ToneRequest):

    tone_instructions = {
        "Professional": """
Write in a polished, respectful, workplace-appropriate manner.
Be clear, confident, and concise.
Avoid slang and overly emotional language.
""",

        "Casual": """
Write naturally and conversationally.
Make it sound relaxed, friendly, and like everyday communication.
Avoid formal or corporate language.
""",

        "Direct": """
Write clearly and assertively.
Get straight to the point.
Remove unnecessary politeness, filler words, and vague language.
Keep it concise.
""",

        "Warm": """
Write in a kind, friendly, and empathetic manner.
Make the message feel personal and considerate.
Use polite and positive language without sounding overly formal.
""",

        "Balanced": """
Write naturally, clearly, and thoughtfully.
Balance friendliness with professionalism.
Avoid sounding too formal, too casual, too emotional, or too blunt.
"""
    }


    instruction = tone_instructions.get(
        request.tone,
        tone_instructions["Balanced"]
    )


    prompt = f"""
You are ToneKey, an AI communication assistant.

Your task is to rewrite the user's message.

IMPORTANT:
- Preserve the original meaning and intent.
- Change the wording so the selected tone is clearly noticeable.
- Do not simply repeat the original message.
- Do not explain your changes.
- Return ONLY the rewritten message.

SELECTED TONE: {request.tone}

TONE INSTRUCTIONS:
{instruction}

ORIGINAL MESSAGE:
{request.message}

REWRITTEN MESSAGE:
"""


    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "qwen2.5:3b-instruct",
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7
            }
        },
        timeout=60
    )


    result = response.json()["response"].strip()


    return {
        "original_message": request.message,
        "selected_tone": request.tone,
        "result": result
    }