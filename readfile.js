const { log } = require("console");
const { resolve } = require("dns");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");

const readBlockAsyn = async () => {
  return new Promise((resolve, reject) => {
    let arr = [];

    fs.createReadStream(path.resolve(__dirname, "blocks.csv"))
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        console.error(error);
        reject(null);
      })
      .on("data", (row) => arr.push(JSON.parse(JSON.stringify(row))))
      .on("end", (rowCount) => {
        console.log(`Parsed ${rowCount} rows`);
        // console.log(arr[0]);
        resolve(arr);
      });
  });
};

const main = async () => {
  try {
    const data = await readBlockAsyn();
    log(`Total rows: ${data.length}`);
    const parsedBlocks = [];
    let i = 0;
    data.map((e, index) => {
      if (e["Primary Name UID"] === "Prm_1-Blk") {
        const parsed = {
          blockSeq: e["Primary UID"],
          t_start: Number(e["Start Seconds"]),
          t_end: Number(e["End Seconds"]),
          t_duration: Number(e["Seconds Duration"]),
          audioPath: `reverses/chunk_${i++}.mp3`,
        };
        parsedBlocks.push(parsed);
      }
    });
    fs.writeFile(
      "parsedBlocks.json",
      JSON.stringify(parsedBlocks),
      {
        encoding: "utf8",
      },
      (err) => console.log(err)
    );
  } catch (err) {
    log(`Error: ${err.message}`);
  }
};

main();
