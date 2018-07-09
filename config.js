const config = {
  productionPath: './',
  includingDepthLevel: 3,
  unCssIgnore: [
    /active/
  ],
  imagesCompression: {
    enabled: true,
    imageminPngquant: {
      speed: 8,
      quality: 90
    },
    imageminZopfli: {
      more: true
    },
    imageminGiflossy: {
      optimizationLevel: 3,
      optimize: 3,
      lossy: 2
    },
    imageminSVGO: {
      plugins: [{
        removeViewBox: false
      }]
    },
    imageminJpegtran: {
      progressive: true
    },
    imageminMozjpeg: {
      quality: 85
    }
  }
}

module.exports = config