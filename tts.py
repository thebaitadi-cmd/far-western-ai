from gtts import gTTS
import sys

text = sys.argv[1]

# simple detection
lang = "en"
if any(x in text for x in ["hai", "kya", "kaise"]):
    lang = "hi"
elif any(x in text for x in ["cha", "ke", "kasari"]):
    lang = "ne"

tts = gTTS(text, lang=lang)
tts.save("public/output.mp3")