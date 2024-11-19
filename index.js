const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

// Load JSON data
const audioData = JSON.parse(fs.readFileSync("work.json", "utf8"));

// Generate the audio segments with silence in between
const generateAudioSegments = async () => {
  const commands = [];

  for (let i = 0; i < audioData.length; i++) {
    const segment = audioData[i];
    const nextSegment = audioData[i + 1];
    const duration = segment.endTime - segment.startTime;

    // Specify the duration for the current audio segment
    // commands.push(`duration ${duration}`);
    commands.push(`file '${segment.audioPath}'`);

    // If there's a gap, add a silent segment
    if (nextSegment) {
      const silenceDuration = nextSegment.startTime - segment.endTime;
      if (silenceDuration > 0) {
        const silencePath = `silence/silence_${i}.mp3`;
        console.log(silencePath, silenceDuration);

        await createSilence(silencePath, silenceDuration);
        // commands.push(`duration ${silenceDuration}`);
        commands.push(`file '${silencePath}'`);
      }
    }
  }

  // Save the list to a temporary file
  const fileListPath = path.join(__dirname, "filelist.txt");
  fs.writeFileSync(fileListPath, commands.join("\n"));

  // Concatenate all segments
  const outputFilePath = path.join(__dirname, "output.mp3");
  await concatAudio(fileListPath, outputFilePath);
  console.log(`Audio concatenation complete. Output file: ${outputFilePath}`);
};

// Function to create a silent audio file of specified duration
const createSilence = (outputPath, duration) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input("list/silence.mp3") // Use the pre-made silent audio file
      .inputOptions(["-stream_loop", Math.ceil(duration)]) // Repeat as needed
      .outputOptions(["-t", duration.toString()]) // Set total duration
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

// Function to concatenate all audio files listed in fileListPath
const concatAudio = (fileListPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(fileListPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c copy"])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

generateAudioSegments().catch(console.error);
