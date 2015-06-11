'use strict';

// TODO: check this DIRTY FILTHY hack
require('events').EventEmitter.prototype._maxListeners = 200;

var gulp = require('gulp'),
    _ = require('underscore'),
    merge = require('merge-stream'),
    multipipe = require('multipipe'),
    mark = require('gulp-mark'),
    marker = require('./marker'),
    rename = require('./rename2'),
    watch = require('gulp-watch'),
    globule = require('globule'),
    clean = require('gulp-clean'),
    config = require('./symfony-task')('werkint:frontendmapper:config');

// Task-helpers
var symfonyMapper = require('./symfony-mapper')(config.bower.target),
    bower = require('./bower')(config.bower),
    normalizer = require('./normalizer')(config),
    minify = require('./minify')(config);

// Список источников
var streams = {
    bower:   function () {
        return gulp
            .src(bower(), {
                base: config.bower.target,
            });
    },
    bundles: function () {
        var files = symfonyMapper();

        var list = _.map(files, function (resource) {
            return gulp.src(resource.path)
                .pipe(marker(function (file) {
                    file.resource = resource;
                }));
        });

        return merge.apply(undefined, list);
    },
};

// Меняет dest в зависимости от бандла
var bundleRename = function (path, file) {
    path.dirname = config.path + '/' + file.resource.dest + '/' + path.dirname;
};

module.exports = function () {
    var getPipe = function (pipeName) {
        var list = streams;
        if (pipeName) {
            list = _.object(_.filter(_.pairs(streams), function (row) {
                return row[0] === pipeName;
            }));
        }

        var src = merge.apply(undefined, _.map(list, function (source, name) {
            return source().pipe(mark.set(name));
        }));

        return src
            .pipe(mark.if('bower', multipipe(
                normalizer(),
                rename(function (path) {
                    path.dirname = config.path + '/' + path.dirname;
                })
            )))
            .pipe(mark.if('bundles', rename(bundleRename)));
    };

    gulp.task('clean', function () {
        return gulp.src(config.root + config.path, {read: false})
            .pipe(clean());
    });

    gulp.task('default', ['clean', 'bower'], function () {
        return getPipe()
            .pipe(minify())
            .pipe(gulp.dest(config.root));
    });

    gulp.task('watch', function () {
        var list = symfonyMapper(),
            files = _.pluck(list, 'path');

        return watch(files, function (event) {
            var path = event.path,
                dest = _.find(list, function (row) {
                    return globule.isMatch(row.path, path);
                });

            var prefix = path.substr(dest.prefix.length);
            prefix = prefix.replace(/(\/[^\/]+)$/, '');

            dest = config.root + '/' + config.path + dest.dest + prefix;
            dest = dest.replace(/\/\//, '/');

            gulp.src(path)
                .pipe(minify())
                .pipe(gulp.dest(dest));

            console.log('File %s => %s', path, dest);
        });
    });
};