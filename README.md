# ToneKey

ToneKey is an AI-powered communication assistant that helps users rewrite messages in different tones while preserving their original meaning.

## Features

- Interactive tone selection
- Professional, Casual, Direct, Warm, and Balanced tones
- AI-powered message rewriting
- Copy rewritten messages
- Tone history
- AI online/offline status

## Tech Stack

**Frontend:** React, Vite, CSS  
**Backend:** FastAPI, Python  
**AI:** Ollama, Qwen 2.5 3B Instruct

## Run Locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn requests
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Make sure Ollama is running with:

```bash
ollama run qwen2.5:3b-instruct
```
