# Alzi Talkbot, a bot that listens to your voice and talks back to you. Proof of Concept.

## Introduction

This code tries to demonstrate the feasibility of a fully end to end voice interface chatbot in different languages, using current (as of November 2022) state of the art machine learning models publicly available.

It is able to understand human speech (directly talking to a microphone) and articulate answers, also with human voice, through the computer speakers.

It can hold conversation in several languages tested, such as English, Spanish, Italian, French and is able to understand Catalan.

Current implementation uses the following models:

- [Whisper model](https://openai.com/blog/whisper/), from OpenAI, to understand speech in any language, and translate it to English. Sourced from [HuggingFace](https://huggingface.co/openai/whisper-large).
- [Blenderbot 3](https://ai.facebook.com/blog/blenderbot-3-a-175b-parameter-publicly-available-chatbot-that-improves-its-skills-and-safety-over-time/), from Meta AI, that provides the conversational bot, able to answer in English. The 3B parameters was used, sourced from [HugginFace](https://huggingface.co/facebook/blenderbot-3B).
- [Google Translate API](https://cloud.google.com/translate) to translate the bot answers from English to the original language, sourced from [Google Cloud](https://cloud.google.com/translate/docs/basic/setup-basic).
- [Google Text to Speech API](https://cloud.google.com/text-to-speech) to convert the bot answers to human voice in the original language, sourced from [Google Cloud](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries).

## Implementation

The code is composed by two parts, the frontend and the backend.

### Frontend

The frontend is a simple web page, implemented in `index.html` and `index.js` that takes care of the following:

- Captures audio from the microphone.
- Sends the audio to the backend.
- Receives the bot answer from the backend, as a sting.
- Translates the bot answer to English if needed, using the Google Translate API.
- Plays the human voice answer through the computer speakers, using the Google Text to Speech API.

In future versions the translation and the text to speech should be done in the backend, to reduce the load on the frontend, and because obviously one cannot have the API keys in the frontend code.

### Backend

The backend is a simple API in FastApi framework, which takes care of the following:

- Receives the audio from the frontend.
- Translates the audio to English using the Whisper model.
- Sends the translated audio to the Blenderbot 3 model and receives the answer.
- Sends the answer to the frontend as a string.

You will find the code in the folder `backend`.
To execute it, you first need to install the requirements in `requirements.txt` and run the following command:

`uvicorn main:app --reload`

There is a notebook in the folder `notebooks` that shows how to use the models and the APIs.

Note that you would need a GPU with a large amount of memory to run the models. I used a `g5.2xlarge` AWS instance, which has a NVIDIA A10G Tensor Core GPU with 24GB of memory.

## Usage

To use the chatbot, you need to run the frontend and the backend, and then open the `index.html` file in a browser.
You can use any browser, but I recommend Chrome, as it is the only one that I tested. You will need to allow the browser to access the microphone and the speakers. Once you have done that, you can start talking to the chatbot.

## Learnings

I was impressed with the results of the Whisper model, which is able to understand almost flawlessly speech in any language, and translate it to English. It is even able to understand Catalan, which is usually not supported by machine learning models.

However, the Blenderbot 3 model, in its 3 billion parameter version, is not able to sustain a long conversations, as it is not able to remember the context. However sometimes has some lucid moments.

## Future work

Possibly if one can access the 125 billion parameter version of Blenderbot the results would be better. Also, the translation and the text to speech should be done in the backend, to reduce the load on the frontend.

## References

- [Whisper model](https://openai.com/blog/whisper/)
- [Blenderbot 3](https://ai.facebook.com/blog/blenderbot-3-a-175b-parameter-publicly-available-chatbot-that-improves-its-skills-and-safety-over-time/)
- [Google Translate API](https://cloud.google.com/translate)
- [Google Text to Speech API](https://cloud.google.com/text-to-speech)

## License

This project is licensed under the terms of the GNU General Public License v3.0.
