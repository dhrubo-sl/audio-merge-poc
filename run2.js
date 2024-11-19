const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const files = [
  { path: "list/audio1.mp3", duration: 3 },
  { silence: 2.5 }, // Insert 2 seconds of silence
  { path: "list/audio2.mp3", duration: 4.5 },
  { silence: 1.75 }, // Insert 1 second of silence
  { path: "list/audio3.mp3", duration: 3.75 },
  { silence: 3.234 }, // Insert 3 seconds of silence
  { path: "list/audio4.mp3", duration: 5.845 },
];

// Helper function to create a silent audio file
function createSilentAudio(duration, outputPath, callback) {
  ffmpeg()
    .input("silence/silence_0.mp3") // Use `anullsrc` as an audio source filter
    .inputOptions(["-t " + duration]) // Specify format as lavfi and set duration
    .outputOptions(["-c:a libmp3lame", "-q:a 4"]) // Specify audio codec and quality
    .save(outputPath)
    .on("end", callback)
    .on("error", (err) => {
      console.error("Error creating silent audio:", err);
    });
}
async function createSilenceFiles(files) {
  const promises = files.map((file, index) => {
    if (file.silence) {
      const silentPath = path.join(__dirname, `silence_${index}.mp3`);
      return new Promise((resolve) => {
        createSilentAudio(file.silence, silentPath, () => {
          file.path = silentPath;
          resolve();
        });
      });
    }
    return Promise.resolve();
  });
  await Promise.all(promises);
}

function concatenateAudio(files) {
  let command = ffmpeg();

  files.forEach((file) => {
    if (file.path) {
      command = command
        .input(file.path)
        .inputOptions([`-t ${file.duration || file.silence}`]);
    }
  });

  command
    .complexFilter(`[0:a][1:a][2:a][3:a][4:a][5:a][6:a]concat=n=7:v=0:a=1[out]`)
    .outputOptions("-map [out]")
    .output("output_audio_with_silence.mp3")
    .on("start", (cmd) => console.log(`FFmpeg command: ${cmd}`))
    .on("end", () => console.log("Concatenation finished successfully!"))
    .on("error", (err) => console.error("Error during concatenation:", err))
    .run();
}

// Main function
(async () => {
  await createSilenceFiles(files);
  concatenateAudio(files);
})();
