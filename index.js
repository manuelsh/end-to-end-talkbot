// Set up basic variables for app

const speechToTextModel = "http://127.0.0.1:8000/files/";
const LANGUAGE = "en"; // Currently it only accepts Spanish ('es') and English ('en')

const record = document.querySelector(".record");
const stop = document.querySelector(".stop");
const printDialog = document.querySelector(".print-dialog");
const canvas = document.querySelector(".visualizer");
const mainSection = document.querySelector(".main-controls");

let pastUserInputs = new Array();
let generatedResponses = new Array();

// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;
const canvasCtx = canvas.getContext("2d");

// Recording and processing the record

let recordingData;
if (navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function () {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    };

    stop.onclick = function () {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    };

    mediaRecorder.onstop = function (e) {
      console.log("data available after MediaRecorder.stop() called.");

      const blob = new Blob(chunks, { type: "audio/flac" });
      chunks = [];
      const audioFile = new File([blob], "recording.flac;type=audio/flac");

      // Speech to text
      // TODO: refactor promise hell
      send_file(speechToTextModel, audioFile)
        .then((response) => {
          // note that file sent is in 48,000
          console.log(JSON.stringify(response));
          addTextToDialog("YOU:   ", response.transcription);
          addTextToDialog("ALZI:   ", response.answer);
          return response;
        })
        .then((response) => {
          // call translatoin Google API
          if (LANGUAGE != "en") {
            return translateText(response.answer, LANGUAGE);
          } else {
            return response.answer;
          }
        })
        .then((response) => {
          // call text to speech Google API
          var text;
          if (LANGUAGE != "en") {
            text = response.data.translations[0].translatedText;
          } else {
            text = response;
          }
          console.log(text);
          return textToSpeech(text);
        })
        .then((response) => {
          // play audio
          const audio = new Audio(
            "data:audio/wav;base64," + response.audioContent
          );
          audio.play();
        });

      console.log("recorder stopped");
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  };

  let onError = function (err) {
    console.log("The following error occured: " + err);
  };

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
  console.log("getUserMedia not supported on your browser!");
}

// visualize function

function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  draw();

  function draw() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasCtx.beginPath();

    let sliceWidth = (WIDTH * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = (v * HEIGHT) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }
}

window.onresize = function () {
  canvas.width = mainSection.offsetWidth;
};

window.onresize();

// Auxiliar functions

// Add text to printed dialog
function addTextToDialog(whoSaid, text) {
  const textResponse = document.createElement("p");
  const content = document.createTextNode(whoSaid + text);
  textResponse.appendChild(content);
  printDialog.appendChild(textResponse);
}

// fetch general function
function fetchInit(form) {
  return {
    method: "POST",
    headers: {
      accept: "application/json",
      //"Content-Type": "multipart/form-data",
    },
    body: form,
  };
}

// To send files
async function send_file(URL, file_object) {
  const form = new FormData();
  form.append("file", file_object);

  const response = await fetch(URL, fetchInit(form));
  return response.json();
}

// Call Google translate API with API key
async function translateText(text, target) {
  const URL = `https://translation.googleapis.com/language/translate/v2?key=${GCPAPIKey}`;
  const form = new FormData();
  form.append("q", text);
  form.append("target", target);

  const response = await fetch(URL, fetchInit(form));
  return response.json();
}

//Call text to speech Google API with API key
async function textToSpeech(textInput) {
  var voice;
  if (LANGUAGE == "en") {
    voice = '{"languageCode":"en-GB","name":"en-GB-Neural2-B"}';
  } else if (LANGUAGE == "es") {
    voice = '{"languageCode":"es-ES","name":"es-ES-Neural2-F"}';
  }

  response = await fetch(
    "https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSyCU4-ygQ-ikr07UyF2FKescOn2sxbi3V_Y",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body:
        '{"input":{"text":"' +
        textInput +
        '"},"voice":' +
        voice +
        ',"audioConfig":{"audioEncoding":"LINEAR16", "pitch":0, "speakingRate":1.15}}',
    }
  );
  return response.json();
}
