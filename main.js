const path = require("path");

const IOhandler = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "filtered");

const main = async () => {
  try {
    await IOhandler.unzip(zipFilePath, pathUnzipped);
    const data = await IOhandler.readDir(pathUnzipped);
    const selected = await IOhandler.filterChoice();
    await IOhandler.rl.close();
    await Promise.all(
      data.map((img, i) =>
        IOhandler.applyFilter(img, pathProcessed, i, selected)
      )
    );
    console.log("program is done");
  } catch (error) {
    console.log(error);
  }
};

main();

// rl.question("What is your age? ", (age) => {
//   console.log("Your age is: " + age);
//   rl.close();
// });
