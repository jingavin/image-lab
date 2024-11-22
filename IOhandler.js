const PNG = require("pngjs").PNG;
const path = require("path");
const process = require("process");
const yauzl = require("yauzl-promise"),
  fs = require("fs"),
  { pipeline } = require("stream/promises");
const { Worker } = require("worker_threads");
const readline = require("readline");

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
const unzip = async (pathIn, pathOut) => {
  const zip = await yauzl.open(pathIn);
  try {
    await fs.promises.mkdir(`${pathOut}`, { recursive: true });

    for await (const entry of zip) {
      if (entry.filename.endsWith("/")) {
        await fs.promises.mkdir(path.join(pathOut, entry.filename));
      } else {
        const readStream = await entry.openReadStream();
        const writeStream = fs.createWriteStream(
          path.join(pathOut, entry.filename)
        );
        await pipeline(readStream, writeStream);
      }
    }
  } finally {
    await zip.close();
  }
};

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readDir = async (dir) => {
  try {
    const files = await fs.promises.readdir(dir);
    const photoPathFilter = files.filter((png) => {
      // swap includes for path.extname
      return path.extname(png) === ".png";
    });
    console.log(photoPathFilter);
    const photoPath = photoPathFilter.map((fullPath) => {
      return path.join(dir, fullPath);
    });
    console.log(photoPath);
    return photoPath;
  } catch (error) {
    console.log(error);
  }
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
const applyFilter = (pathIn, pathOut, i, filterType) => {
  //add error handling
  return new Promise(async (resolve, reject) => {
    await fs.promises.mkdir(`${pathOut}`, { recursive: true });
    fs.createReadStream(pathIn)
      .pipe(
        new PNG({
          filterType: 4,
        })
      )
      .on("parsed", function () {
        const worker = new Worker("./filters.js");

        const pixels = [];

        for (var y = 0; y < this.height; y++) {
          for (var x = 0; x < this.width; x++) {
            var idx = (this.width * y + x) << 2;

            pixels.push({
              idx,
              r: this.data[idx],
              g: this.data[idx + 1],
              b: this.data[idx + 2],
            });
          }
        }
        worker.postMessage({ pixels, filterType });
        // get rid of the loop and assign to this.data
        worker.once("message", (processedPixels) => {
          // console.log(this.data.toString());
          // let newVals;
          // [newVals] = processedPixels;
          // console.log(processedPixels);
          // const { idx, r, g, b } = newVals;

          // console.log(r, g, b);
          // this.data[idx] = r;
          // this.data[idx + 1] = g;
          // this.data[idx + 2] = b;

          processedPixels.forEach((pixel) => {
            const { idx, r, g, b } = pixel;
            this.data[idx] = r;
            this.data[idx + 1] = g;
            this.data[idx + 2] = b;
          });

          this.pack().pipe(
            fs
              .createWriteStream(path.join(pathOut, `out${i}.png`))
              .on("finish", () => {
                worker.terminate();
                resolve();
              })
          );
        });
      });
  });
};

let rl = readline.createInterface(process.stdin, process.stdout);

const filterChoice = () => {
  const question = "What filter would you like to apply?";
  const options = ["sepia", "grayscale", "invert"];

  console.log(question);
  options.forEach((option) => {
    console.log(option);
  });

  return new Promise((resolve, reject) => {
    rl.question("Choose an option: ", (answer) => {
      const choice = answer.toLowerCase();
      console.log(choice);
      if (options.includes(choice)) {
        resolve(choice);
      } else {
        console.error("invalid option, try again");
        resolve(filterChoice());
      }
    });
  });
};

module.exports = {
  unzip,
  readDir,
  applyFilter,
  filterChoice,
  rl,
};
