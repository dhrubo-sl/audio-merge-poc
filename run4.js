const { rejects } = require("assert");
const { log } = require("console");
const { resolve } = require("dns");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

// Helper function to create a silent audio file
async function createSilentAudio(duration, index) {
  const silentPath = `silence/silence_${index}.mp3`;
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input("default_silence.mp3") // Use `anullsrc` as an audio source filter
      .inputOptions(["-t " + duration]) // Specify format as lavfi and set duration
      .outputOptions(["-c:a libmp3lame", "-q:a 4"]) // Specify audio codec and quality
      .save(silentPath)
      .on("end", () => resolve(silentPath))
      .on("error", (err) => {
        console.error("Error creating silent audio:", err);
        reject(null);
      });
  });
}

// Helper function to concatenate a batch of files
async function concatenateBatch(inputs, output) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    inputs.forEach((input) =>
      command.input(input.path).inputOptions([`-t ${input.duration}`])
    );

    // Create dynamic filter string for each batch
    const inputLabels = inputs.map((_, index) => `[${index}:a]`).join("");
    const filter = `${inputLabels}concat=n=${inputs.length}:v=0:a=1[out]`;

    command
      .complexFilter([filter])
      .outputOptions("-map [out]")
      .save(output)
      .on("progress", (progress) => {
        console.log(progress.percent / 100);
      })
      .on("end", () => resolve(output))
      .on("error", (err) => reject(err));
  });
}

async function concatenateLargeAudioSet(inputs, output) {
  let fileList = [];
  let t_duration = 0;
  let t_gap = 0;
  // Process in batches
  for (let i = 0; i < inputs.length; i++) {
    const curr = inputs[i];
    const next = inputs[i + 1];
    fileList.push({
      path: curr.audioPath,
      duration: curr.t_duration,
    });
    t_duration += curr.t_duration;
    if (next) {
      const gap = Number((next.t_start - curr.t_end).toFixed(3));
      if (gap) {
        t_gap += gap;
        const silenceAudioPath = await createSilentAudio(gap, i);
        fileList.push({ path: silenceAudioPath, duration: gap });
      }
    }
  }
  console.log("total duration", t_duration + t_gap);

  console.log("file len", fileList.length);
  await concatenateBatch(fileList, output);
}

// Example usage
// const inputFiles = Array.from({ length: 10 }, (_, i) => `list/audio3.mp3`);
const outputFile = "output_audio.mp3";

const input = fs.readFileSync("parsedBlocks.json", { encoding: "utf8" });
const inputFiles = JSON.parse(input.toString());

concatenateLargeAudioSet(inputFiles, outputFile)
  .then(() => console.log("Concatenation complete"))
  .catch((err) => console.error("Error:", err));

/**
 * parse block file
 * loop through block list
 * for each block seq
 * find start time, end time, duration
 * find doc by block uuid/seq that contains audio path
 * find silence duration between block seq and generate silence files
 * generate txt file command that contains audio and silence file
 * concat all files based on generated txt command
 */
