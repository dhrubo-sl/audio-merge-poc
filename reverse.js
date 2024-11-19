const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

// Function to split audio into chunks
const splitAudio = async (sourcePath, inputFiles, outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < inputFiles.length; i++) {
    const startTime = inputFiles[i].t_start;
    const duration = inputFiles[i].t_duration;
    const outputFilePath = `${outputDir}/chunk_${i}.mp3`;

    await new Promise((resolve, reject) => {
      ffmpeg(sourcePath)
        .setStartTime(startTime) // Start time in seconds
        .setDuration(duration) // Duration in seconds
        .output(outputFilePath)
        .on("end", () => {
          console.log(`Chunk ${i + 1} created: ${outputFilePath}`);
          resolve();
        })
        .on("error", (err) => {
          console.error(`Error creating chunk ${i + 1}: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }
};

// Example Usage
(async () => {
  const input = fs.readFileSync("parsedBlocks.json", { encoding: "utf8" });
  const inputFiles = JSON.parse(input.toString());
  const sourcePath = "source_audio.m4a";
  const outputDir = "reverses";

  try {
    await splitAudio(sourcePath, inputFiles, outputDir);
    console.log("Audio splitting completed.");
  } catch (err) {
    console.error("Error splitting audio:", err);
  }
})();
