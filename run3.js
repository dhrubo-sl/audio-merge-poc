const { log } = require("console");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

// Helper function to create a silent audio file
function createSilentAudio(duration) {
  const outputPath = "silence/silence_output_0.mp3";
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

// Helper function to concatenate a batch of files
function concatenateBatch(inputs, output) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    inputs.forEach((input) => command.input(input));

    log(inputs);
    // Create dynamic filter string for each batch
    const inputLabels = inputs.map((_, index) => `[${index}:a]`).join("");

    console.log(inputLabels);

    const filter = `${inputLabels}concat=n=${inputs.length}:v=0:a=1[out]`;

    command
      .complexFilter([filter])
      .outputOptions("-map [out]")
      .save(output)
      .on("end", () => resolve(output))
      .on("error", (err) => reject(err));
  });
}

async function concatenateLargeAudioSet(inputs, output, batchSize = 50) {
  let tempFiles = [];

  // Process in batches
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const batchOutput = `temp_batch_${i / batchSize}.mp3`;
    await concatenateBatch(batch, batchOutput);
    tempFiles.push(batchOutput);
  }

  // Final concatenation of all batch outputs
  const finalOutput = ffmpeg();
  tempFiles.forEach((tempFile) => finalOutput.input(tempFile));

  const finalLabels = tempFiles.map((_, index) => `[${index}:a]`).join("");
  const finalFilter = `${finalLabels}concat=n=${tempFiles.length}:v=0:a=1[out]`;

  return new Promise((resolve, reject) => {
    finalOutput
      .complexFilter([finalFilter])
      .outputOptions("-map [out]")
      .save(output)
      .on("end", () => {
        // Cleanup temporary files
        tempFiles.forEach((file) => fs.unlinkSync(file));
        resolve(output);
      })
      .on("error", (err) => reject(err));
  });
}

// Example usage
const inputFiles = Array.from({ length: 10 }, (_, i) => `list/audio3.mp3`);
const outputFile = "concatenated_audio.mp3";

concatenateLargeAudioSet(inputFiles, outputFile, 50)
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
