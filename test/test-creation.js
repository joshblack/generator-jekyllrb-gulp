/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;

describe('jekyllrb-gulp generator', function () {
  this.timeout(100000);

  beforeEach(function (done) {
    helpers.testDirectory(path.join(__dirname, 'temp'), function (err) {
      if (err) {
        return done(err);
      }

      this.app = helpers.createGenerator('jekyllrb-gulp:app', [
        '../../app'
      ]);
      done();
    }.bind(this));
  });

  it('creates expected files', function (done) {

    setTimeout(done, 100000);

    var expected = [
      // add files you expect to exist here.
      '.editorconfig'
    ];

    helpers.mockPrompt(this.app, {
      'someOption': true,
      'cssDir': 'src/css',
      'jsDir': 'src/js',
      'templateType': 'Default Jekyll'
    });
    this.app.options['skip-install'] = true;
    this.app.run({}, function () {
      helpers.assertFile(expected);
      done();
    });
  });
});
