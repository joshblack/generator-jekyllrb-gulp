// Generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>
'use strict';

// Directory reference:
//   css: <%= cssDir %>
//   javascript: <%= jsDir %>

var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var rename      = require('gulp-rename');
var clean       = require('gulp-clean');
var minifyCSS   = require('gulp-minify-css');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');
var imagemin    = require('gulp-imagemin');

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], { stdio: 'inherit' })
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['build', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

gulp.task('build', ['sass', 'js']);

/**
 * Compile files from src into both _site/dist/css (for live injecting) and dist/css (for future jekyll builds)
 */
gulp.task('sass', function () {
    gulp.src('<%= cssDir %>/**/*.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(minifyCSS())
        .pipe(rename('build.min.css'))
        .pipe(gulp.dest('_site/dist/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('js', function() {
    gulp.src('<%= jsDir %>/**/*.js')
        .pipe(concat('build.js'))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('_site/dist/js'))
        .pipe(browserSync.reload({ stream: true }))
        .pipe(gulp.dest('dist/js'));
});

// gulp.task('images', function() {
//     gulp.src('src/images/**/*.+(png|jpeg|jpg|gif|svg)')
//         .pipe(imagemin())
//         .pipe(gulp.dest('_site/dist/img'))
//         .pipe(browserSync.reload({ stream: true }))
//         .pipe(gulp.dest('dist/img'));
// })

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('<%= cssDir %>/*.scss', ['sass']);
    gulp.watch(['index.html', '_layouts/*.html', '_posts/*', '_config.yml'], ['jekyll-rebuild']);
    gulp.watch('<%= jsDir %>/*.js', ['js']);
    // gulp.watch('src/images/**/*.+(png|jpeg|jpg|gif|svg)', ['images']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
