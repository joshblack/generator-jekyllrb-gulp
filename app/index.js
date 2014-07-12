'use strict';
var util = require('util');
var path = require('path');
var spawn = require('child_process').spawn;
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var globule = require('globule');
var shelljs = require('shelljs');
var bundle = false;
var fs = require('fs');

var Generator = module.exports = function Generator(args, options) {
  var yoConsoleTag        = chalk.bgBlack.white('yo'),
      errConsoleTag       = chalk.bgBlack.red('ERR!'),
      subtreeConsoleTag   = '├──',
      dependencies        = ['bundle', 'ruby'];

  var dependenciesInstalled = dependencies.every(function (dependency) {
    console.log(yoConsoleTag + ' Checking for ' + chalk.white(dependency));

    return shelljs.which(dependency);
  });

  if (!dependenciesInstalled) {
    console.log(yoConsoleTag + ' ' + errConsoleTag + ' ' + 'Looks like you\'re missing some dependencies.');
    console.log('Make sure you have the following installed:');
    dependencies.forEach(function(dependency) {
      console.log(subtreeConsoleTag + ' ' + dependency);
    });

    shelljs.exit(1);
  } else {
    console.log(chalk.bgBlack.green('Dependencies installed ✓') + "\n");
  }

  yeoman.generators.Base.apply(this, arguments);

  // Get static info for templating
  this.jekyllTmp = path.join(process.cwd(), '.jekyll');
  this.appname = path.basename(process.cwd());
  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
  this.gitInfo = {
    name: this.user.git.username,
    email: this.user.git.email,
  };

  this.on('end', function () {
    // Clean up temp files
    spawn('rm', ['-r', '.jekyll'], { stdio: 'inherit' });

    // Install Grunt and Bower dependencies
    this.installDependencies({ skipInstall: options['skip-install'], bower: false });

    if (bundle === false) {
      console.log(chalk.yellow.bold('Bundle install failed. Try running the command yourself.'));
    }
  });
};

util.inherits(Generator, yeoman.generators.Base);

// Prompts
Generator.prototype.askForUser = function askForUser() {
  var cb = this.async();
  var prompts = [{
    name: 'author',
    message: 'Name',
    default: this.gitInfo.name
  },
  {
    name: 'email',
    message: 'Email',
    default: this.gitInfo.email
  }];

  console.log(this.yeoman);
  console.log(chalk.yellow.bold('This generator will scaffold and wire a Jekyll site. Yo, Jekyllrb!') +
    chalk.yellow('\n\nTell us a little about yourself.') + ' ☛');

  this.prompt(prompts, function (props) {

    this.author  = props.author;
    this.email   = props.email;

    cb();
  }.bind(this));
};

Generator.prototype.askForTools = function askForTools() {
  var cb = this.async();
  var prompts = [{
    name: 'cssPre',
    type: 'list',
    message: 'CSS Preprocessor',
    choices: ['Sass']
  },
  {
    name: 'autoPre',
    type: 'confirm',
    message: 'Use Autoprefixer?'
  },
  {
    name: 'jsPre',
    type: 'list',
    message: 'JS Preprocessor',
    choices: ['None']
  }];

  console.log(chalk.yellow('\nTools and preprocessors.') + ' ☛');

  this.prompt(prompts, function (props) {

    this.cssPre = "Sass";
    this.autoPre = true;
    this.jsPre = props.jsPre !== 'None';

    cb();
  }.bind(this))
};

Generator.prototype.askForStructure = function askForStructure() {
  var cb = this.async();
  var cssPre = this.cssPre;
  var jsPre  = this.jsPre;

  var slashFilter = function (input) {
    return input.replace(/^\/*|\/*$/g, '');
  };

  var prompts = [{
    name: 'cssDir',
    message: 'CSS directory',
    default: 'src/css',
    filter: slashFilter
  },
  {
    name: 'jsDir',
    message: 'JavasSript directory',
    default: 'src/js',
    filter: slashFilter
  }];

  console.log(chalk.yellow('\nSet up some directories.') + ' ☛' +
    '\nSee note about nested directories in the README.');

  this.prompt(prompts, function (props) {

    this.cssDir    = props.cssDir;
    this.jsDir     = props.jsDir

    // Split asset directories on slashes
    this.cssExDir   = props.cssDir.split('/').pop();
    this.jsExDir    = props.jsDir.split('/').pop();

    cb();
  }.bind(this));
};

Generator.prototype.askForTemplates = function askForTemplates() {
  var cb = this.async();
  var prompts = [{
    name: 'templateType',
    type: 'list',
    message: 'Site template',
    // choices: ['Default Jekyll', 'HTML5 ★ Boilerplate'],
    choices: ['Default Jekyll'],
  }];

  console.log(chalk.yellow('\nChoose a template.') + ' ☛');

  this.prompt(prompts, function (props) {

    if (props.templateType === 'Default Jekyll') {
      this.templateType = 'default';
    }
      console.log(this.templateType);
    cb();
  }.bind(this));
};

// Generate App
Generator.prototype.git = function git() {
  this.template('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
};

Generator.prototype.gulpfile = function gulpfile() {
  this.template('gulpfile.js');
};

Generator.prototype.packageJSON = function packageJSON() {
  this.template('_package.json', 'package.json');
};

Generator.prototype.gemfile = function gemfile() {
  this.template('Gemfile');
};

Generator.prototype.editor = function editor() {
  this.copy('editorconfig', '.editorconfig');
};

Generator.prototype.rubyDependencies = function rubyDependencies() {
  var execComplete;

  console.log('\nRunning ' + chalk.yellow.bold('bundle install') + ' to install the required gems.');

  this.conflicter.resolve(function (err) {
    if (err) {
      return this.emit('error', err);
    }

    execComplete = shelljs.exec('bundle install');

    if (execComplete.code === 0) {
      bundle = true;
    }
  });
};

Generator.prototype.jekyllInit = function jekyllInit() {
  // Remove any previously installed .jekyll folder
  shelljs.exec('rm -rf .jekyll');

  // Create the default Jekyll site in a temp folder
  shelljs.exec('bundle exec jekyll new ' + this.jekyllTmp);
};

Generator.prototype.templates = function templates() {
  // Format date for posts
  var date = new Date();
  var formattedDate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);

  // Scaffold Jekyll dirs
  this.mkdir('_layouts');
  this.mkdir('_posts');
  this.mkdir('_includes');
  this.mkdir(this.cssDir);
  this.mkdir(this.jsDir);

  // Jekyll config files
  this.template('_config.yml');

  // Project posts
  this.copy(path.join(this.jekyllTmp, '_posts', formattedDate + '-welcome-to-jekyll.markdown'), path.join('_posts', formattedDate + '-welcome-to-jekyll.md'));

  // Jekyll default template
  if (this.templateType === 'default') {
    // Default Jekyll files
    this.copy(path.join(this.jekyllTmp, 'index.html'), 'index.html');
    this.copy(path.join(this.jekyllTmp, '_layouts/post.html'), '_layouts/post.html');
    this.copy(path.join(this.jekyllTmp, 'css/main.css'), path.join(this.cssDir, 'main.css'));

    // Jekyll files tailored for Yeoman
    this.template('conditional/template-default/_layouts/default.html', '_layouts/default.html');

    // Empty file for Usemin defaults
    this.write(path.join(this.jsDir, 'main.js'), '');
  }
};

Generator.prototype.cssPreprocessor = function cssPreprocessor() {
  var files = globule.find('**/*.css', { srcBase: this.cssDir } );
  var cssDir = this.cssDir;

  // Copy CSS files to preprocessor files
  files.forEach(function (file) {

    // Rename files to scss syntax
    fs.rename(path.join(cssDir, file), path.join(cssDir, file.replace(/\.css$/, '.scss')));

  }, this);
};