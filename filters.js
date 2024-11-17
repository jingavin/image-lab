const { parentPort } = require("worker_threads");

parentPort.on("message", (data) => {
  const { pixels, filterType } = data;

  const processedPixels = pixels.map(({ idx, r, g, b }) => {
    if (filterType === "sepia") {
      const processedPixel = applySepiaFilter(r, g, b);
      return { idx, ...processedPixel };
    } else if (filterType === "grayscale") {
      const processedPixel = addGrayFilter(r, g, b);
      return { idx, ...processedPixel };
    } else {
      return { idx, r, g, b };
    }
  });

  parentPort.postMessage(processedPixels);
});

const applySepiaFilter = (r, g, b) => {
  const newR = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
  const newG = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
  const newB = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);

  return { r: newR, g: newG, b: newB };
};

const addGrayFilter = (red, green, blue) => {
  const gray = red * 0.3 + green * 0.59 + blue * 0.11;
  return { r: gray, g: gray, b: gray };
};
