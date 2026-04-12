import sys
import asyncio
import edge_tts

# =========================
# SETTINGS
# =========================
VOICE = "en-IN-NeerjaNeural"   # 🔥 best Indian female voice
# other options:
# "en-US-GuyNeural"
# "en-IN-PrabhatNeural"

# =========================
# TTS FUNCTION
# =========================
async def generate(text):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save("output.mp3")

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    text = " ".join(sys.argv[1:])

    if not text:
        print("No text provided")
        sys.exit()

    asyncio.run(generate(text))