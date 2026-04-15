import sys
import asyncio
import edge_tts

TEXT = sys.argv[1]

async def main():
    communicate = edge_tts.Communicate(TEXT, "en-US-AriaNeural")
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            sys.stdout.buffer.write(chunk["data"])
            sys.stdout.flush()

asyncio.run(main())