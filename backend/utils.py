from transformers import WhisperProcessor, WhisperForConditionalGeneration
from transformers import BlenderbotTokenizer, BlenderbotForConditionalGeneration
import soundfile as sf
import torch
import re

from pydub import AudioSegment

# whisper utils

whisper_model = WhisperForConditionalGeneration.from_pretrained(
    "openai/whisper-large").to("cuda")
whisper_processor = WhisperProcessor.from_pretrained("openai/whisper-large")


def re_sample_file(input_file_name, output_file_name):
    # reduces the herz rate to 16k
    file = AudioSegment.from_file(input_file_name).set_frame_rate(16000)
    file.export(output_file_name, format='flac')


def whisper(file):
    input_file = sf.read(file)
    sample_rate = sf.info(file).samplerate

    input_features = whisper_processor(
        input_file[0], sampling_rate=sample_rate)
    input_features = torch.tensor(input_features['input_features']).to("cuda")

    with torch.no_grad():
        generated_ids = whisper_model.generate(inputs=input_features)

    transcription = whisper_processor.batch_decode(
        generated_ids, skip_special_tokens=True)[0]

    return transcription


# Blender utils

mname = "facebook/blenderbot-3B"  # 1B-distill"
model = BlenderbotForConditionalGeneration.from_pretrained(mname).to("cuda")
tokenizer = BlenderbotTokenizer.from_pretrained(mname)


def remove_html_tags(text):
    """Remove html tags from a string"""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)


def blenderbot(query):
    inputs = tokenizer([query], return_tensors="pt")
    inputs['input_ids'] = inputs['input_ids'].to('cuda')
    inputs['attention_mask'] = inputs['attention_mask'].to('cuda')
    reply_ids = model.generate(**inputs)
    answer = tokenizer.batch_decode(reply_ids)
    return remove_html_tags(answer[0])
