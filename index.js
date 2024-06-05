// @ts-check

const preview = /** @type {HTMLVideoElement} */ (
  document.querySelector("video")
);
const startShareScreenButton = /** @type {HTMLButtonElement} */ (
  document.querySelector("#startShareScreenButton")
);
const logs = /** @type {HTMLPreElement} */ (document.getElementById("logs"));

startShareScreenButton.onclick = async () => {
  /** @type {Blob[]} */
  const recordedData = [];

  const micStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
    })
    .catch(() => {
      log("Mic permission was denied.");
    });
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
  });

  let audioStream = null;

  // to mix the audio from both the computer and the mic
  // we need to connect two audio nodes to one
  // without this only one audio track gets recorded
  if (
    micStream &&
    micStream.getAudioTracks().length > 0 &&
    screenStream.getAudioTracks().length > 0
  ) {
    log("mic + tab audio");
    const audioCtx = new AudioContext();
    const audioDestination = audioCtx.createMediaStreamDestination();

    const micSource = audioCtx.createMediaStreamSource(micStream);
    const screenSource = audioCtx.createMediaStreamSource(screenStream);
    micSource.connect(audioDestination);
    screenSource.connect(audioDestination);

    audioStream = audioDestination.stream;
  } else if (micStream && micStream.getAudioTracks().length > 0) {
    log("mic audio only");
    audioStream = micStream;
  } else {
    log("tab audio only");
    audioStream = screenStream;
  }

  const stream = new MediaStream([
    ...audioStream.getAudioTracks(),
    ...screenStream.getVideoTracks(),
  ]);

  const recorder = new MediaRecorder(stream);

  preview.srcObject = stream;

  recorder.start();

  // stop all tracks when the native stop sharing button is clicked
  // this triggers the recorder.onstop
  stream.getVideoTracks()[0].onended = () => {
    screenStream.getTracks().forEach((track) => track.stop());
    audioStream.getTracks().forEach((track) => track.stop());
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
    }
  };

  // put all the recorded data in an array
  // this triggers when the recorder stops
  // before recorder.onstop
  recorder.ondataavailable = (event) => {
    recordedData.push(event.data);
  };

  // download the recorded data
  recorder.onstop = () => {
    preview.srcObject = null;
    downloadRecordedData(recordedData, recorder.mimeType);
    log("Your screen recording has been downloaded.");
  };

  log("Your screen is being recorded.");
};

/**
 * @param {Blob[]} recordedData
 * @param {string} mimeType
 */
function downloadRecordedData(recordedData, mimeType) {
  const blob = new Blob(recordedData, { type: mimeType });
  const extension =
    mimeTypes.find((mt) => mimeType.startsWith(mt.mimeType))?.extension ?? "";
  const downloadelem = document.createElement("a");
  const url = URL.createObjectURL(blob);
  document.body.appendChild(downloadelem);
  downloadelem.href = url;
  console.log("mime", mimeType);
  downloadelem.download = "screenrecording" + extension;
  downloadelem.click();
  downloadelem.remove();
  window.URL.revokeObjectURL(url);
}

const mimeTypes = [
  {
    extension: ".mp4",
    mimeType: "video/mp4",
  },
  {
    extension: ".webm",
    mimeType: "video/webm",
  },
  {
    extension: ".ogg",
    mimeType: "video/ogg",
  },
  {
    extension: ".mov",
    mimeType: "video/quicktime",
  },
  {
    extension: ".avi",
    mimeType: "video/x-msvideo",
  },
  {
    extension: ".wmv",
    mimeType: "video/x-ms-wmv",
  },
  {
    extension: ".flv",
    mimeType: "video/x-flv",
  },
  {
    extension: ".mkv",
    mimeType: "video/x-matroska",
  },
  {
    extension: ".3gp",
    mimeType: "video/3gpp",
  },
  {
    extension: ".3g2",
    mimeType: "video/3gpp2",
  },
];

function log(text) {
  logs.innerText += `\n${text}`;
}
