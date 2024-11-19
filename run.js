const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

// List of files with their corresponding durations
const files = [
  { path: "list/demo.mp3", duration: 3 },
  { path: "list/demo.mp3", duration: 4 },
  { path: "list/demo.mp3", duration: 3 },
  { path: "list/demo.mp3", duration: 5 },
];

// Initialize an ffmpeg command
let command = ffmpeg();

// Add each file with the specified duration
files.forEach((file) => {
  command = command.input(file.path).inputOptions([`-t ${file.duration}`]);
});

// Set up filter to concatenate and output the result
command
  .complexFilter([`[0:a][1:a][2:a][3:a]concat=n=${files.length}:v=0:a=1[out]`])
  .outputOptions("-map [out]")
  .output("output_audio.mp3")
  .on("start", (cmd) => {
    console.log(`FFmpeg command: ${cmd}`);
  })
  .on("end", () => {
    console.log("Concatenation finished successfully!");
  })
  .on("error", (err) => {
    console.error("Error occurred:", err);
  })
  .run();
