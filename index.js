const video = document.querySelector("video");
const startShareScreenButton = document.querySelector(
  "#startShareScreenButton"
);
const stopShareScreenButton = document.querySelector("#stopShareScreenButton");
const logs = document.getElementById("logs");

let stream;
let recorder;

startShareScreenButton.addEventListener("click", async () => {
  // Prompt the user to choose where to save the recording file.
  const suggestedName = "screen-recording.webm";
  const handle = await window.showSaveFilePicker({ suggestedName });
  const writable = await handle.createWritable();

  let audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  let screenStream = await navigator.mediaDevices.getDisplayMedia();
  screenStream.addEventListener("inactive", stopSharingAndRecording);

  stream = new MediaStream([
    ...screenStream.getTracks(),
    ...audioStream.getTracks(),
  ]);
  recorder = new MediaRecorder(stream);

  // Preview the screen locally.
  video.srcObject = stream;

  stopShareScreenButton.disabled = false;
  log("Your screen is being shared.");

  // Start recording.
  recorder.start();
  recorder.addEventListener("dataavailable", async (event) => {
    // Write chunks to the file.
    await writable.write(event.data);
    if (recorder.state === "inactive") {
      // Close the file when the recording stops.
      await writable.close();
    }
  });

  log("Your screen is being recorded locally.");
});

function stopSharingAndRecording() {
  // Stop the stream.
  stream.getTracks().forEach((track) => track.stop());
  video.srcObject = null;

  stopShareScreenButton.disabled = true;
  log("Your screen is not shared anymore.");

  // Stop the recording.
  recorder.stop();

  log("Your screen has been successfully recorded locally.");
}
stopShareScreenButton.addEventListener("click", stopSharingAndRecording);

function log(text) {
  logs.innerText += `\n${text}`;
}
