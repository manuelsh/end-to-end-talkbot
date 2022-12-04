from fastapi import FastAPI, File
from fastapi.middleware.cors import CORSMiddleware
from utils import whisper, re_sample_file, blenderbot

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# class that receive data and returns a transcription

@app.post("/files/")
async def create_file(file: bytes = File()):

    # Save file
    input_file_name = "voice.flac"
    with open(input_file_name, "wb") as f:
        f.write(file)

    # Re sample file
    output_sample_file = 'output_voice.flac'
    re_sample_file(input_file_name, output_sample_file)
    transcription = whisper(output_sample_file)
    answer = blenderbot(transcription)
    
    return {
        "transcription": transcription,
        "answer": answer
        }