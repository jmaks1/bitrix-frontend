'use strict';

// init
var gulp        = require('gulp'),
    watch       = require('gulp-watch'),        // Наблюдение за изменениями файлов
    prefixer    = require('gulp-autoprefixer'), // Автоматически добавляет вендорные префиксы к CSS свойствам
    uglify      = require('gulp-uglify'),       // Сжимать наш JS
    rigger      = require('gulp-rigger'),       // Позволяет импортировать один файл в другой простой конструкцией
    sass        = require('gulp-sass'),         // для компиляции нашего SCSS кода
    sourcemaps  = require('gulp-sourcemaps'),   // Для генерации css sourscemaps, которые будут помогать нам при отладке кода
    cssmin      = require('gulp-minify-css'),   // Сжатие CSS кода
    imagemin    = require('gulp-imagemin'),     // Сжатие картинок
    pngquant    = require('imagemin-pngquant'), // Сжатие картинок | работа с PNG
    spritesmith = require('gulp.spritesmith');  // Создание png спрайтов

// write routs
var path = {
    build: {
        js:            'local/templates/main/',
        css:           'local/templates/main/',
        images:        'local/templates/main/images/',
        fonts:         'local/templates/main/fonts/',
        fontsBootstrap:'local/templates/main/fonts/bootstrap/'
    },
    src: {
        js:            'src/js/script.js',
        styles:        'src/styles/template_styles.scss',
        stylesPartials:'src/styles/partials/',
        spriteTemplate:'src/sass.template.mustache',
        images:        'src/images/**/*.*',
        sprite:        'src/sprite/*.*',
        fonts:         'src/fonts/**/*.*',
        fontsBootstrap:'bower_components/bootstrap-sass/assets/fonts/bootstrap/*.*'
    },
    watch: {
        js:    'src/js/**/*.js',
        styles:'src/styles/**/*.scss',
        images:'src/images/**/*.*',
        sprite:'src/sprite/*.*',
        fonts: 'src/fonts/**/*.*'
    }
};


gulp.task('js:build', function () {
    gulp.src(path.src.js)               // Найдем наш main файл
        .pipe(rigger())                 // Прогоним через rigger
        .pipe(sourcemaps.init())        // Инициализируем sourcemap
        .pipe(uglify())                 // Сожмем наш js
        .pipe(sourcemaps.write())       // Пропишем карты
        .pipe(gulp.dest(path.build.js)) // Выплюнем готовый файл в build
});

gulp.task('sprite:build', function() {
    var spriteData =
        gulp.src(path.src.sprite)
            .pipe(spritesmith({
                imgName: 'sprite.png',
                cssName: 'sprite.scss',
                cssFormat: 'scss',
                algorithm: 'binary-tree',
                padding: 20,
                cssTemplate: path.src.spriteTemplate,
                cssVarMap: function(sprite) {
                    sprite.name = 's-' + sprite.name
                }
            }));

    spriteData.img.pipe(gulp.dest(path.build.images));
    spriteData.css.pipe(gulp.dest(path.src.stylesPartials));
});

gulp.task('icons:build', function() {
    return gulp.src(path.src.fontsBootstrap)
        .pipe(gulp.dest(path.build.fontsBootstrap));
});

gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});

gulp.task('styles:build', function () {
    gulp.src(path.src.styles)            // Выберем наш main.scss
        .pipe(sourcemaps.init())         // То же самое что и с js
        .pipe(sass())                    // Скомпилируем
        .pipe(prefixer())                // Добавим вендорные префиксы
        .pipe(cssmin())                  // Сожмем
        .pipe(sourcemaps.write())        // Пропишем карты
        .pipe(gulp.dest(path.build.css)) // И в build
});

gulp.task('image:build', function () {
    gulp.src(path.src.images) //Выберем наши картинки
        .pipe(imagemin({   //Сожмем их
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.images))
});


gulp.task('build', [
    'js:build',
    'sprite:build',
    'icons:build',
    'fonts:build',
    'styles:build',
    'image:build',
]);

gulp.task('watch', function(){
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.sprite], function(event, cb) {
        gulp.start('sprite:build');
    });
    watch([path.watch.styles], function(event, cb) {
        gulp.start('styles:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
    watch([path.watch.images], function(event, cb) {
        gulp.start('image:build');
    });
});

gulp.task('default', ['build', 'watch']);