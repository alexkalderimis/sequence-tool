module.exports = function (grunt) {

  grunt.initConfig({
    'pkg': grunt.file.readJSON('package.json'),
    'requirejs': {
      compile: {
        options: {
          optimize: 'none', // uglify for production
          baseUrl: './js',
          mainConfigFile: 'indices/tool.js',
          include: ['requireLib', 'child'],
          out: 'build/tool.js'
        }
      }
    },
    'watch': {
      scripts: {
        files: ['js/*.js', 'indices/*.js'],
        tasks: ['requirejs:compile']
      }
    },
    'http-server': {
      'dev': {
        root: '.',
        port: (process.env.PORT || 8282),
        host: "127.0.0.1",
        showDir: true,
        autoIndex: true,
        ext: 'html',
        runInBackground: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-http-server');

  grunt.registerTask('dev', ['http-server:dev', 'watch:scripts']);

};
