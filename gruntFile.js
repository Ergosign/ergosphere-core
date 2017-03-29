'use strict';
var path = require('path');
var packageJson = require('./package.json');
var gruntConnectWrapper = require('./src/node-server/grunt-connect-wrapper/gruntConnectWrapper.js');

module.exports = function (grunt) {
    require('jit-grunt')(grunt, {
        'notify_hooks': 'grunt-notify',
        'bower': 'grunt-bower-task'
    });

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    var SERVER_PORT = 2345;
    var SERVER_HOST = '0.0.0.0';

    var pathConfig = {
        src: path.resolve('src'),
        build: 'build',
        dist: 'www'
    };


    grunt.initConfig({
        pgk: grunt.file.readJSON("package.json"),
        yeoman: {
            city_data: "config/city-list.json",
            weather_images_src: "config/weather-images",
            html_src: "src/web-client/html",
            scss_src: "src/web-client/scss",
            js_src: "src/web-client/js",
            node_lib_src: "src/node-server",
            assets_src: "src/web-client/assets",
            resp_images_src: "src/web-client/resp-images",
            client_build_target: "www",
            client_assets_target: "client-assets",
            cache_directory: "www",
            project_short_name: "ergosphere"
        },
        paths: pathConfig,
        clean: {
            build: {
                src: ['<%= yeoman.client_build_target %>', 'cache']
            }
        },
        sass: {
            options: {
                style: "expanded",
                sourceMap: true
            },
            development: {
                files: {
                    "<%= yeoman.client_build_target %>/css/styles.css": "<%= yeoman.scss_src %>/styles.scss"
                }
            },
            production: {
                options: {
                    style: "compressed",
                    sourceComments: false,
                    sourceMap: false
                },
                files: {
                    "<%= yeoman.client_assets_target %>/css/styles.css": "<%= yeoman.scss_src %>/styles.scss"
                }
            }
        },

        copy: {
            for_www: {
                files: [
                    {
                        expand: true,
                        cwd: "<%= yeoman.js_src %>/",
                        src: ["**"],
                        dest: "<%= yeoman.client_build_target %>/js"
                    },
                    {
                        expand: true,
                        cwd: "<%= yeoman.assets_src %>/",
                        src: ["**"],
                        dest: "<%= yeoman.client_build_target %>/"
                    },
                    {
                        expand: true,
                        cwd: ".libs",
                        src: ["**"],
                        dest: "<%= yeoman.client_build_target %>/libs"
                    }
                ]
            },
            for_release: {
                files:[
                    {
                        expand: true,
                        cwd: "<%= yeoman.assets_src %>/",
                        src: ["**"],
                        dest: "<%= yeoman.client_assets_target %>"
                    },
                    {
                        expand: true,
                        cwd: ".libs",
                        src: ["**"],
                        dest: "<%= yeoman.client_assets_target %>/libs"
                    },
                    {
                        expand: true,
                        cwd: "<%= yeoman.js_src %>/",
                        src: ["**"],
                        dest: "<%= yeoman.client_assets_target %>/js"
                    },
                    {
                        expand: true,
                        cwd: "<%= yeoman.node_lib_src %>/",
                        src: ["**"],
                        dest: "lib"
                    },
                    {
                        expand: true,
                        cwd: "<%= yeoman.html_src %>/",
                        src: ["**"],
                        dest: "assemble-files"
                    }
                ]
            }
        },

        uglify: {
            options: {
                sourceMapIncludeSources: true
            },
            development: {
                options: {
                    mangle: false,
                    sourceMap: true,
                    compress: false
                },
                files: {
                    '<%= yeoman.client_build_target %>/js/ergosphere.min.js': ['<%= yeoman.js_src %>/**/*.js']
                }
            },
            production: {
                options: {
                    mangle: {
                        except: ['jQuery', 'Backbone']
                    },
                    compress: {
                        drop_console: true
                    }
                },
                files: {
                    '<%= yeoman.client_assets_target %>/js/ergosphere.min.js': ['<%= yeoman.js_src %>/**/*.js']
                }
            }
        },
        watch: {
            options: {
                spawn: false,
                livereload: false
            },
            scss: {
                files: [
                    '<%= yeoman.scss_src %>/**',
                    '!src/scss/*.map'
                ],
                tasks: ['sass:development']
            },
            script: {
                files: ['<%= yeoman.js_src %>/**'],
                tasks: ['copy:for_www']
            },
            html: {
                files: ['<%= yeoman.html_src %>/**'],
                tasks: ['assemble']
            }
        },
        connect: {
            server: {
                options: {
                    port: SERVER_PORT,
                    hostname: SERVER_HOST,
                    base: '<%= yeoman.client_build_target %>',
                    onCreateServer: gruntConnectWrapper.onServerCreate
                }
            }
        },


        assemble: {
            options: {
                layoutdir: '<%= yeoman.html_src %>/layouts',
                layout: "base-layout.hbs",
                assets: "<%= yeoman.assets_src %>",
                helpers: ['handlebars-helper-include'],
                data: ['<%= yeoman.html_src %>/data/*.json', "<%= yeoman.city_data %>"]
            },
            project: {
                options: {
                    partials: "<%= yeoman.html_src %>/partials/**/*.hbs"
                },
                files: [{
                    expand: true,
                    cwd: "<%= yeoman.html_src %>/pages/",
                    src: ["**/*.hbs"],
                    dest: "<%= yeoman.client_build_target %>/"
                }]
            }
        },
        responsive_images: {
            allSizes: {
                options: {
                    newFilesOnly: true,
                    sizes: [{
                        name: 'shrunk',
                        width: 370,
                        height: 640,
                        aspectRatio: false
                    }
                    ]
                },
                files: [{
                    expand: true,
                    src: ['**/*.{jpeg,jpg,gif,png}'],
                    cwd: '<%= yeoman.weather_images_src %>/',
                    dest: '<%= yeoman.client_build_target %>/img/resp-images/weather/city'
                }]
            }
        },
        bower: {
            dev: {
                options: {
                    dest: '<%= yeoman.client_build_target %>/libs',
                    install: true,
                    copy: false,
                    verbose: true,
                    layout: 'byComponent',
                    boweroptions: {
                        path: false
                    }
                }
            }
        }
    });

    grunt.registerTask("default", ["bower", "sass:development", "uglify:development"]);
    grunt.registerTask("run", ["default", "responsive_images", "assemble", "copy:for_www", "connect:server", "watch"]);
    grunt.registerTask("release", ["bower", "sass:production", "uglify:production", "copy:for_release"]);


};
