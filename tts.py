import sys
import asyncio
import edge_tts
import os

OUTPUT_FILE = "output.mp3"

# Get text
if len(sys.argv) < 2:
    print("No text provided")
    sys.exit(1)

text = " ".join(sys.argv[1:])

async def generate():
    try:
        communicate = edge_tts.Communicate(
            text=text,
            voice="en-IN-NeerjaNeural",  # 🔥 Best human voice
            rate="+5%",
            volume="+0%"
        )

        if os.path.exists(OUTPUT_FILE):
            os.remove(OUTPUT_FILE)

        await communicate.save(OUTPUT_FILE)

        print(OUTPUT_FILE)

    except Exception as e:
        print("Error:", str(e))
        sys.exit(1)

asyncio.run(generate())