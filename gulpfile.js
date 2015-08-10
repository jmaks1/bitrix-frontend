'use strict';

// init
var gulp        = require('gulp'),
    watch       = require('gulp-watch'),        // Наблюдение за изменениями файлов
    prefixer    = require('gulp-autoprefixer'), // Автоматически добавляет вендорные префиксы к CSS свойствам
    uglify      = require('gulp-uglify'),       // Сжимать наш JS
    rigger      = require('gulp-rigger'),       // Позволяет импортировать один файл в другой простой конструкцией
    sass        = require('gulp-sass'),         // для компиляции нашего SCSS кода
    sourcemaps  = require('gulp-sourcemaps'),   // Для генерации css sourscemaps, помогает нам при отладке кода
    cssmin      = require('gulp-minify-css'),   // Сжатие CSS кода
    imagemin    = require('gulp-imagemin'),     // Сжатие картинок
    pngquant    = require('imagemin-pngquant'), // Сжатие картинок | работа с PNG
    plumber     = require('gulp-plumber'),      // Ловим ошибки, чтобы не прервался watch
    svgSprite   = require('gulp-svg-sprite'),   // Создаем спрайт из svg
    svgmin      = require('gulp-svgmin'),       // оптимизируем наш svg
    svg2png     = require('gulp-svg2png'),      // Создадим альтернативный спрайт из svg в png
    spritesmith = require('gulp.spritesmith');  // Создание png спрайтов


// write routs
var path = {
    build: {
        js:            'local/templates/main/',
        styles:        'local/templates/main/',
        images:        'local/templates/main/images/',
        fonts:         'local/templates/main/fonts/',
        fontBootstrap: 'local/templates/main/fonts/bootstrap/'
    },
    src: {
        js:                'src/js/*.*',
        styles:            'src/styles/*.*',
        stylesPartials:    'src/styles/partials/',
        images:            'src/images/**/*.*',
        sprite:            'src/sprite/*.*',
        spriteTemplate:    'src/sprite-template.scss',
        spriteSvg:         'src/sprite-svg/*.*',
        spriteSvgTemplate: 'src/sprite-svg-template.scss',
        fonts:             'src/fonts/**/*.*',
        fontBootstrap:     'bower_components/bootstrap-sass/assets/fonts/bootstrap/*.*'
    },
    watch: {
        js:        'src/js/**/*.js',
        styles:    'src/styles/**/*.scss',
        images:    'src/images/**/*.*',
        sprite:    'src/sprite/*.*',
        spriteSvg: 'src/sprite-svg/*.*',
        fonts:     'src/fonts/**/*.*'
    }
};



// javascript
gulp.task('js:build', function () {
    gulp.src(path.src.js)               // Найдем наш main файл
        .pipe(plumber())
        .pipe(rigger())                 // Прогоним через rigger
        .pipe(sourcemaps.init())        // Инициализируем sourcemap
        .pipe(uglify())                 // Сожмем наш js
        .pipe(sourcemaps.write())       // Пропишем карты
        .pipe(plumber.stop())
        .pipe(gulp.dest(path.build.js)) // Выплюнем готовый файл в build
});
// png sprite
gulp.task('sprite:build', function() {
    var spriteData =
        gulp.src(path.src.sprite)
            .pipe(spritesmith({
                imgName: 'sprite.png',
                cssName: 'sprite.scss',
                cssFormat: 'scss',
                algorithm: 'binary-tree',
                padding: 5,
                cssTemplate: path.src.spriteTemplate,
                cssVarMap: function(sprite) {
                    sprite.name = 's-' + sprite.name
                }
            }));

    spriteData.img.pipe(gulp.dest(path.build.images));
    spriteData.css.pipe(gulp.dest(path.src.stylesPartials));
});
// svg sprite
gulp.task('spriteSvg:build', function () {
    gulp.src(path.src.spriteSvg)
        .pipe(plumber())
        .pipe(svgmin())
        .pipe(svgSprite({
            "shape": {
                "spacing": {
                    "padding": 5,
                },
            },
            "mode": {
                "css": {
                    "dest": "./",
                    "layout": "diagonal",
                    "sprite": path.build.images+"sprite-svg.svg",
                    "bust": false,
                    "render": {
                        "scss": {
                            "dest": path.src.stylesPartials+'sprite-svg.scss',
                            "template": path.src.spriteSvgTemplate
                        }
                    }
                }
            }
        }))
        .pipe(plumber.stop())
        .pipe(gulp.dest("./"));
});
// svg to png sprite | for ie
gulp.task('svg2png', function() {
    gulp.src(path.build.images+"sprite-svg.svg")
        .pipe(plumber())
        .pipe(svg2png())
        .pipe(plumber.stop())
        .pipe(gulp.dest(path.build.images));
});
// images
gulp.task('image:build', function () {
    gulp.src(path.src.images)
        .pipe(plumber())
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(plumber.stop())
        .pipe(gulp.dest(path.build.images))
});
// move bootstrap icons(font) to build
gulp.task('icons:build', function() {
    gulp.src(path.src.fontBootstrap)
        .pipe(gulp.dest(path.build.fontBootstrap));
});
// move custom fonts to build
gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});
// styles
gulp.task('styles:build', function () {
    gulp.src(path.src.styles)               // Выберем наш main.scss
        .pipe(plumber())
        .pipe(sourcemaps.init())            // То же самое что и с js
        .pipe(sass())                       // Скомпилируем
        .pipe(prefixer())                   // Добавим вендорные префиксы
        .pipe(cssmin())                     // Сожмем
        .pipe(sourcemaps.write())           // Пропишем карты
        .pipe(plumber.stop())
        .pipe(gulp.dest(path.build.styles)) // И в build
});


gulp.task('build', [
    'js:build',
    'sprite:build',
    'spriteSvg:build',
    'image:build',
    'icons:build',
    'fonts:build',
    'styles:build',
]);

gulp.task('watch', function(){
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.sprite], function(event, cb) {
        gulp.start('sprite:build');
    });
    watch([path.watch.spriteSvg], function(event, cb) {
        gulp.start('spriteSvg:build');
    });
    // watch for sprite-svg
    watch([path.build.images+"sprite-svg.svg"], function(event, cb) {
        gulp.start('svg2png');
    });
    watch([path.watch.images], function(event, cb) {
        gulp.start('image:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
    watch([path.watch.styles], function(event, cb) {
        gulp.start('styles:build');
    });
});

gulp.task('default', ['build', 'watch']);