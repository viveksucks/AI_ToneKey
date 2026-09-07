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
    strength: int


@app.get("/")
def home():
    return {
        "message": "AI Tone Key backend is running"
    }


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


def get_strength_instruction(strength):
    if strength < 20:
        return """
TONE STRENGTH: VERY SUBTLE.

Keep the message mostly natural and close to the original.
Only apply a very light influence from the selected tone.
Do not make the tone obvious or exaggerated.
"""

    if strength < 45:
        return """
TONE STRENGTH: LIGHT.

Apply the selected tone noticeably but naturally.
The message should still feel balanced and authentic.
Do not exaggerate the tone.
"""

    if strength < 70:
        return """
TONE STRENGTH: STRONG.

Make the selected tone clearly noticeable.
The wording, phrasing, and communication style should strongly
reflect the selected tone.
The result should be meaningfully different from a subtle version.
"""

    return """
TONE STRENGTH: INTENSE.

Make the selected tone dominant and immediately noticeable.
Push the communication style strongly in the selected direction
while still preserving the original meaning.

Do NOT make the result neutral.
Do NOT produce a subtle rewrite.
The difference between this version and a low-strength version
must be obvious.
"""


@app.post("/rewrite")
def rewrite_message(request: ToneRequest):

    tone_instructions = {
        "Professional": """
Write in a polished, respectful, workplace-appropriate manner.
Be clear, confident, structured, and concise.
Avoid slang, casual phrasing, and unnecessary emotional language.
""",

        "Casual": """
Write naturally and conversationally.
Make it sound relaxed, friendly, and like everyday communication.
Avoid corporate, stiff, or overly formal language.
""",

        "Direct": """
Write clearly and assertively.
Get straight to the point.
Remove unnecessary politeness, filler words, and vague language.
Prioritize clarity and brevity.
""",

        "Warm": """
Write in a kind, friendly, and empathetic manner.
Make the message feel personal, considerate, and emotionally aware.
Use positive and supportive language.
""",

        "Balanced": """
Write naturally, clearly, and thoughtfully.
Balance friendliness with professionalism.
Avoid sounding overly formal, overly casual, too emotional, or too blunt.
"""
    }

    instruction = tone_instructions.get(
        request.tone,
        tone_instructions["Balanced"]
    )

    strength_instruction = get_strength_instruction(
        request.strength
    )

    prompt = f"""
You are ToneKey, an AI communication assistant.

Your task is to rewrite the user's message.

IMPORTANT RULES:
- Preserve the original meaning and intent.
- Do not simply repeat the original message.
- Do not explain your changes.
- Return ONLY the rewritten message.
- Do not mention tone, style, strength, AI, or these instructions.
- The selected tone and strength must visibly influence the result.

SELECTED TONE:
{request.tone}

TONE STRENGTH:
{request.strength}/100

BASE TONE INSTRUCTIONS:
{instruction}

STRENGTH INSTRUCTIONS:
{strength_instruction}

CRITICAL COMPARISON RULE:
A rewrite generated with tone strength 90/100 should feel
significantly more {request.tone} than a rewrite generated
with tone strength 20/100.

ORIGINAL MESSAGE:
{request.message}

REWRITTEN MESSAGE:
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen2.5:3b-instruct",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.85
                }
            },
            timeout=60
        )

        response.raise_for_status()

        result = response.json()["response"].strip()

        return {
            "original_message": request.message,
            "selected_tone": request.tone,
            "tone_strength": request.strength,
            "result": result
        }

    except requests.RequestException as error:
        return {
            "error": "Unable to connect to Ollama",
            "details": str(error)
        }