// @ts-check

const preview = /** @type {HTMLVideoElement} */ (
  document.querySelector("video")
);
const startShareScreenButton = /** @type {HTMLButtonElement} */ (
  document.querySelector("#startShareScreenButton")
);
const stopShareScreenButton = /** @type {HTMLButtonElement} */ (
  document.querySelector("#stopShareScreenButton")
);
const logs = /** @type {HTMLPreElement} */ (document.getElementById("logs"));

/**
 * @param {Blob[]} recordedData
 * @param {string} mimeType
 */
function downloadRecordedData(recordedData, mimeType) {
  const blob = new Blob(recordedData, { type: mimeType });
  const downloadelem = document.createElement("a");
  const url = URL.createObjectURL(blob);
  document.body.appendChild(downloadelem);
  downloadelem.href = url;
  downloadelem.download = "screenrecording.webm";
  downloadelem.click();
  downloadelem.remove();
  window.URL.revokeObjectURL(url);
}

startShareScreenButton.onclick = async () => {
  /** @type {Blob[]} */
  const recordedData = [];

  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
  });

  // to mix the audio from both the computer and the mic
  // we need to connect two audio nodes to one
  // without this only one audio track gets recorded
  const audioCtx = new AudioContext();
  const micSource = audioCtx.createMediaStreamSource(micStream);
  const screenSource = audioCtx.createMediaStreamSource(screenStream);
  const audioDestination = audioCtx.createMediaStreamDestination();

  //connect sources to destination
  micSource.connect(audioDestination);
  screenSource.connect(audioDestination);

  const stream = new MediaStream([
    audioDestination.stream.getAudioTracks()[0],
    screenStream.getVideoTracks()[0],
  ]);

  const recorder = new MediaRecorder(stream);

  preview.srcObject = stream;
  stopShareScreenButton.disabled = false;

  recorder.start();

  // stop all tracks when the native stop sharing button is clicked
  // this triggers the recorder.onstop
  stream.getVideoTracks()[0].onended = () => {
    micStream.getTracks().forEach((track) => track.stop());
    screenStream.getTracks().forEach((track) => track.stop());
    audioDestination.stream.getTracks().forEach((track) => track.stop());
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
    stopShareScreenButton.disabled = true;
    downloadRecordedData(recordedData, recorder.mimeType);
    log("Your screen recording has been downloaded.");
  };

  log("Your screen is being recorded.");
};

function log(text) {
  logs.innerText += `\n${text}`;
}
