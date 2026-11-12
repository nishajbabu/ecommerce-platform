from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import asyncio
from dotenv import load_dotenv

from app.db.session import get_db
from app.models.product import Product

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["AI Shopping Assistant"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    
# Cache the working model name so we don't look it up on every single message
ACTIVE_GROQ_MODEL = None

def call_groq_ai(system_prompt: str, user_prompt: str, api_key: str) -> str:
    """Ultra-fast inference via Groq, auto-discovering your active model."""
    global ACTIVE_GROQ_MODEL
    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        # 1. If we haven't found the active model yet, pick allam-2-7b or the first valid chat model
        if not ACTIVE_GROQ_MODEL:
            available = [m.id for m in client.models.list().data]
            print("Active models on your Groq key:", available)
            
            if "allam-2-7b" in available:
                ACTIVE_GROQ_MODEL = "allam-2-7b"
            elif any("qwen" in m for m in available):
                ACTIVE_GROQ_MODEL = [m for m in available if "qwen" in m][0]
            else:
                ACTIVE_GROQ_MODEL = [m for m in available if "orpheus" not in m and "whisper" not in m][0]

            print(f"--> Using Groq Model: {ACTIVE_GROQ_MODEL}")

        # 2. Call the active model
        completion = client.chat.completions.create(
            model=ACTIVE_GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=150,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print("Groq API error:", e)
        return ""

def call_gemini_ai(prompt: str, api_key: str) -> str:
    """Direct Gemini 3.8 Flash interaction."""
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        interaction = client.interactions.create(
            model="gemini-3.8-flash",
            input=prompt
        )
        if interaction.output_text:
            return interaction.output_text.strip()
    except Exception as e:
        print("Gemini API error:", e)
        return ""

@router.post("/chat", response_model=ChatResponse)
async def ai_shopping_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    # 1. Fetch live products from DB
    products = db.query(Product).filter(Product.is_active == True, Product.stock_quantity > 0).all()
    
    catalog_summary = "\n".join([
        f"- {p.title} | Price: ₹{p.price} | Stock: {p.stock_quantity} left | {p.description}"
        for p in products
    ])

    user_prompt = req.message.strip()

    system_prompt = f"""You are NeuraShop AI, a fast, helpful shopping assistant.
Current Live Store Inventory:
{catalog_summary if catalog_summary else 'No products currently in stock.'}

Rules:
1. Always suggest products from the live inventory above. Mention exact prices in INR (₹).
2. Keep responses brief, friendly, and under 2 sentences.
"""

    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

    # Priority 1: Groq (Ultra-fast, under 0.5s)
    if groq_key:
        reply = await asyncio.to_thread(call_groq_ai, system_prompt, user_prompt, groq_key)
        if reply:
            return {"reply": reply}

    # Priority 2: Gemini
    if gemini_key:
        reply = await asyncio.to_thread(call_gemini_ai, f"{system_prompt}\nCustomer: {user_prompt}", gemini_key)
        if reply:
            return {"reply": reply}

    # Priority 3: Instant Keyword Fallback
    keywords = [k.lower() for k in user_prompt.replace("?", "").split() if len(k) > 2]
    matched = [p for p in products if any(k in p.title.lower() or k in p.description.lower() for k in keywords)]
    if matched:
        top = matched[0]
        return {
            "reply": f"I recommend the **{top.title}** for ₹{top.price:,.2f} ({top.stock_quantity} left in stock)! {top.description}"
        }

    if products:
        first = products[0]
        return {
            "reply": f"Check out our trending **{first.title}** for ₹{first.price:,.2f}! What features or budget do you have in mind?"
        }

    return {"reply": "Welcome to NeuraShop! Ask me about any gadgets or accessories in our store!"}