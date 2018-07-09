# Simple gulp starter
A simple project starter based on gulp and webpack.

### Features:
 - Support for ES6 syntax (with babel `stage-0`)
 - Simple template engine for including HTML, CSS and JS files using HTML comments only
 - Conversion from `scss` to `css`
 - Minification of `css` and `html` files
 - Uglifying of `js` files
 - Cache busting for `css` and `js` files
 - Removing unused `css` code
 - Optimization of images
 - Error handling

### Installation
First, download or copy repository to your project directory
```
git clone git@github.com:mkurczewski/simple-gulp-starter.git .
```

Then install dependencies
```
npm install
```

### Usage
Run localhost server with browserSync ([localhost:3000](localhost:3000))
```
npm start
```

Rebuild project, minify and optimize all files, rewrite paths 
```
npm build
```

### Configuration
The are several options in `config.js` file that you can adjust to your needs.
```
const config = {
  productionPath: '/',
  includingDepthLevel: 3,
  unCssIgnore: [],
  imagesCompression: {
    enabled: true,
    imageminPngquant: {...},
    imageminZopfli: {...},
    imageminGiflossy: {...},
    imageminSVGO: {...},
    imageminJpegtran: {...},
    imageminMozjpeg: {...}
  }
}
...
```
- `productionPath` is an **absolute** path matching destination's directory URL. So if you are sending all files from `dist` folder to `example.com/my-project/` directory, the production path should be `'/my-project/'`. This will ensure that after running `gulp build` all assets and routes will be mapped properly. Please note that production path must be absolute, so it needs to begin and end with `/`.

- `includingDepthLevel` defines max level of nesting for including html files (for value `3`, it means you can "include file in included file of included file"). Default value is 3 which is enough for most projects. Please note that bigger level can 

- `unCssIgnore` is an array that provide a list of selectors that should not be removed by UnCSS. For example, styles added by user interaction with the page (hover, click), since those are not detectable by UnCSS yet. Both literal names and regex patterns are recognized. [See more about UnCSS](https://github.com/uncss/uncss#options).

- `imagesCompression.enabled` is a boolean value that determines if images should be compressed during build process for production, based on gulp config. If you want to compress images manually, just set it to `false`. Otherwise, you can use default settings or apply your own. Objects like `imageminPngquant`, `imageminZopfli` etc. are basically _options_ arguments passed to imagemin functions and plugins. [See more about gulp-imagemin configuration](https://www.npmjs.com/package/gulp-imagemin).

### Rules and possibilities
 - You can create any structure in `src/views/` directory. It will be fully reproduced in the `dist/` folder.
 
 - You can import styles or scripts in very simple way, by placing `<!-- styles -->` or `<!-- scripts -->` comments in any place of any `html` file.
 
 - While using assets in `html` files or styles, always use paths relative to `src/` directory. They will be automatically mapped to proper path according to current environment (dev or prod).

### Directories and files
```
src/                # Project development files
├ img/              # Images (may contain subdirectories)
├ js/               # JavaScript files
│ ├ core/           # Custom JS code
│ │ ├ modules/      # JS modules (optional)
│ │ └ main.js       # Main JS file that imports all needed modules (required)
│ └ vendors/        # 3rd-party JS plugins (optional)
├ styles/           # Styles directory
│ └ main.scss       # Main SCSS file that imports all needed CSS/SCSS files (required)
└ views/            # HTML pages directory
  └ index.html      # Main HTML file (there can be more html files and even subdirectories)
│
dist/               # Final project files (served on localhost and after build)
├ _assets/          # Assets directory
│ ├ css/
│ │ └ main.css      # Compiled version of src/styles/main.scss file
│ ├ img/            # Optimized images from src/img/ directory
│ ├ js/
│ │ ├ core.js       # Compiled version of src/js/core/main.js file
│ │ └ vendors.js    # Joined files from src/js/vendors/ directory (in alphabetical order)
└ index.html        # Builded HTML file(s) mapped from src directory
```