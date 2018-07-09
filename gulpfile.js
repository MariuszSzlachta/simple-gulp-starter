'use strict'

const fs = require('fs')
const del = require('del')
const gulp = require('gulp')
const sass = require('gulp-sass')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const uncss = require('postcss-uncss')
const replace = require('gulp-replace')
const htmlmin = require('gulp-htmlmin')
const changed = require('gulp-changed')
const webpack = require('gulp-webpack')
const postcss = require('gulp-postcss')
const imagemin = require('gulp-imagemin')
const fileExists = require('file-exists')
const minifyCss = require('gulp-clean-css')
const inject = require('gulp-inject-string')
const autoprefixer = require('gulp-autoprefixer')
const imageminZopfli = require('imagemin-zopfli')
const imageminMozjpeg = require('imagemin-mozjpeg')
const browserSync = require('browser-sync').create()
const imageminPngquant = require('imagemin-pngquant')
const imageminGiflossy = require('imagemin-giflossy')
const config = require('./config')

const paths = {
  src: {
    root: 'src/',
    js: 'src/js/',
    jsCore: 'src/js/core/',
    jsVendors: 'src/js/vendors/',
    css: 'src/styles/',
    cssCore: 'src/styles/core/',
    cssVendors: 'src/styles/vendors/',
    images: 'src/img/',
    views: 'src/views/',
    files: 'src/files/'
  },
  dist: {
    _root: 'dist',
    root: 'dist/',
    assets: 'dist/_assets/',
    js: 'dist/_assets/js/',
    css: 'dist/_assets/css/',
    images: 'dist/_assets/img/',
    files: 'dist/_files/'
  }
}

let production
let cors = false
let build = false
let jsVendorsExists = false
let cssVendorsExists = false
let includingDepthLevel = config.includingDepthLevel

const runServer = cb => {
  browserSync.init({
    server: paths.dist.root,
    files: [paths.dist.root + '**/*', paths.src.root + '**/*'],
    cors
  })
  cb()
}

// HTML TASKS
const html = cb => {
  const v = Date.now()
  const stream = gulp.src([paths.src.views + '**/*.html', '!' + paths.src.views + '_**/*.html'])
  for (let i = 0; i < includingDepthLevel; i++) {
    stream
      .pipe(replace(/<!-- include (.+\.html) -->/gi, (match, p1) => {
        if (fileExists.sync('src/views/' + p1)) {
          return fs.readFileSync('src/views/' + p1, 'utf8')
        } else {
          console.log(`Error: file 'src/views/${p1}' does not exist`)
        }
      }))
  }
  if (cssVendorsExists) {
    stream.pipe(inject.after('<!-- styles -->', '\n<link href="' + production + '_assets/css/vendors.css?' + v + '" rel="stylesheet">'))
  }
  stream
    .pipe(inject.after('<!-- styles -->', '\n<link href="' + production + '_assets/css/main.css?' + v + '" rel="stylesheet">'))
  stream
    .pipe(inject.after('<!-- scripts -->', '\n<script src="' + production + '_assets/js/main.js?' + v + '"></script>'))
  if (jsVendorsExists) {
    stream
      .pipe(inject.after('<!-- scripts -->', '\n<script src="' + production + '_assets/js/vendors.js?' + v + '"></script>'))
  }
  stream
    .pipe(replace('<!-- scripts -->\n', ''))
    .pipe(replace('<!-- styles -->\n', ''))
  if (build) {
    stream
      .pipe(replace(/((\.\.\/)+)/gi, production))
      .pipe(replace(`${production}files/`, `${production}_files/`))
      .pipe(replace(`${production}img/`, `${production}_assets/img/`))
  }
  else {
    stream
      .pipe(replace(/((\.\.\/)+)/gi, '/'))
      .pipe(replace(`/files/`, `/_files/`))
      .pipe(replace(`/img/`, `/_assets/img/`))
  }
  if (build) {
    stream
      .pipe(htmlmin({
        collapseWhitespace: true,
        collapseInlineTagWhitespace: false,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        useShortDoctype: true
      }))
  }
  stream
    .pipe(gulp.dest(paths.dist.root))
    .on('end', () => {
      cb()
    })
}

const cleanHtml = cb => {
  del([paths.dist.root + '**', '!' + paths.dist._root, '!' + paths.dist.assets + '**', '!' + paths.dist.files + '**']).then(() => {
    cb()
  })
}

const watchHtml = cb => {
  gulp.watch([paths.src.views + '**/*'], gulp.series(cleanHtml, html))
  cb()
}

const buildHtml = gulp.series(cleanHtml, html)

const serveHtml = gulp.series(buildHtml, watchHtml)

// IMAGES TASKS
const images = cb => {
  const stream = gulp.src(paths.src.images + '**/*')
    .pipe(changed(paths.dist.images + '**/*'))
  if (build && config.imagesCompression.enabled) {
    stream
      .pipe(imagemin([
        // png
        imageminPngquant(config.imagesCompression.imageminPngquant),
        imageminZopfli(config.imagesCompression.imageminZopfli),
        // gif
        imageminGiflossy(config.imagesCompression.imageminGiflossy),
        // svg
        imagemin.svgo(config.imagesCompression.imageminSVGO),
        // jpg
        imagemin.jpegtran(config.imagesCompression.imageminJpegtran),
        imageminMozjpeg(config.imagesCompression.imageminMozjpeg)
      ]))
  }
  stream
    .pipe(gulp.dest(paths.dist.images))
    .on('end', () => {
      browserSync.reload()
      cb()
    })
}

const cleanImages = cb => {
  del(paths.dist.images + '**/*').then(() => {
    cb()
  })
}

const watchImages = cb => {
  const watcher = gulp.watch([paths.src.images + '**/*'])
  watcher.on('all', gulp.series(cleanImages, images))
  cb()
}

const buildImages = gulp.series(cleanImages, images)

const serveImages = gulp.series(buildImages, watchImages)

// OTHER FILES TASKS
const files = cb => {
  gulp
    .src(paths.src.files + '**/*')
    .pipe(changed(paths.src.files + '**/*'))
    .pipe(gulp.dest(paths.dist.files))
    .on('end', () => {
      browserSync.reload()
      cb()
    })
}

const cleanFiles = cb => {
  del([paths.dist.files + '**']).then(() => {
    cb()
  })
}

const watchFiles = cb => {
  const watcher = gulp.watch(paths.src.files + '**/*')
  watcher.on('all', gulp.series(cleanFiles, files))
  cb()
}

const buildFiles = gulp.series(cleanFiles, files)

const serveFiles = gulp.series(buildFiles, watchFiles)

// JAVASCRIPT TASKS
const core = cb => {
  gulp.src(paths.src.jsCore + 'main.js')
    .pipe(webpack({
      entry: {
        preload: './' + paths.src.jsCore + 'main.js'
      },
      output: {
        filename: 'main.js'
      },
      module: {
        loaders: [
          {
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
              presets: ['env', 'es2015', 'stage-0']
            }
          }
        ]
      }
    }))
    .on('error', function (e) {
      console.error(e.message)
      this.emit('end')
    })
    .pipe(concat('main.js'))
    .pipe(gulp.dest(paths.dist.js))
    .on('end', () => {
      cb()
    })
}

const minifyCore = cb => {
  gulp
    .src(paths.dist.js + 'main.js')
    .pipe(uglify())
    .pipe(gulp.dest(paths.dist.js))
    .on('end', () => {
      cb()
    })
}

const watchCore = cb => {
  const watcher = gulp.watch([paths.src.jsCore + '**/*.js'])
  watcher.on('all', gulp.series(core, html))
  cb()
}

const buildCore = gulp.series(core, html)

const serveCore = gulp.series(buildCore, watchCore)

const vendors = cb => {
  gulp
    .src(paths.src.jsVendors + '**/*.js')
    .pipe(uglify())
    .pipe(concat('vendors.js'))
    .pipe(gulp.dest(paths.dist.js))
    .on('end', () => {
      jsVendorsExists = fileExists.sync(paths.dist.js + 'vendors.js')
      cb()
    })
}

const watchVendors = cb => {
  const watcher = gulp.watch([paths.src.jsVendors + '**/*.js'])
  watcher.on('all', gulp.series(cleanVendors, vendors, html))
  cb()
}

const cleanVendors = cb => {
  del([paths.dist.js + 'vendors.js']).then(() => {
    cb()
  })
}

const buildVendors = gulp.series(cleanVendors, vendors, html)

const serveVendors = gulp.series(buildVendors, watchVendors)

// CSS/SCSS TASKS
const scss = cb => {
  const stream = gulp.src(paths.src.cssCore + 'main.scss')
    .pipe(sass({
      outputStyle: build ? 'compressed' : 'expanded'
    }).on('error', sass.logError))
    .pipe(concat('main.css'))
    .pipe(autoprefixer({
      browsers: [
        '> 1%',
        'last 10 versions',
        'not ie < 10'
      ],
      cascade: false
    }))
  if (build) {
    stream
      .pipe(replace(/((\.\.\/)+)/gi, production))
      .pipe(replace(`${production}files/`, `${production}_files/`))
      .pipe(replace(`${production}img/`, `${production}_assets/img/`))
  }
  else {
    stream
      .pipe(replace(/((\.\.\/)+)/gi, '/'))
      .pipe(replace(`/files/`, `/_files/`))
      .pipe(replace(`/img/`, `/_assets/img/`))
  }
  stream
    .pipe(gulp.dest(paths.dist.css))
    .on('end', () => {
      cb()
    })
}

const watchScss = cb => {
  gulp.watch([paths.src.cssCore + '**/*'], scss)
  cb()
}

const buildScss = scss

const serveScss = gulp.series(buildScss, watchScss)

const cssVendors = cb => {
  gulp
    .src(paths.src.cssVendors + '**/*.css')
    .pipe(minifyCss())
    .pipe(concat('vendors.css'))
    .pipe(gulp.dest(paths.dist.css))
    .on('end', () => {
      cssVendorsExists = fileExists.sync(paths.dist.css + 'vendors.css')
      cb()
    })
}

const cleanCssVendors = cb => {
  del([paths.dist.css + 'vendors.css']).then(() => {
    cb()
  })
}

const watchCssVendors = cb => {
  const watcher = gulp.watch([paths.src.cssVendors + '**/*.css'])
  watcher.on('all', gulp.series(cleanCssVendors, cssVendors, html))
  cb()
}

const buildCssVendors = gulp.series(cleanCssVendors, cssVendors, html)

const serveCssVendors = gulp.series(buildCssVendors, watchCssVendors)

const unCss = cb => {
  gulp.src(paths.dist.css + 'main.css')
    .pipe(postcss([
      uncss({
        ignore: config.unCssIgnore,
        html: [paths.dist.root + '**/*.html']
      })
    ]))
    .pipe(concat('main.css'))
    .pipe(gulp.dest(paths.dist.css))
    .on('end', () => {
      cb()
    })
}

// MAIN TASKS
const serveTask = gulp.series(cb => {
  cors = true
  build = false
  production = '/'
  cb()
}, serveFiles, serveImages, serveCore, serveVendors, serveScss, serveCssVendors, serveHtml, runServer)

const buildTask = gulp.series(cb => {
  cors = false
  build = true
  production = config.productionPath || '/'
  cb()
}, buildFiles, buildImages, buildCore, minifyCore, buildVendors, buildScss, buildCssVendors, buildHtml, unCss)

gulp.task('default', cb => {
  serveTask()
  cb()
})

gulp.task('build', cb => {
  buildTask()
  cb()
})