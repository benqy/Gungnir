
var fs = require('fs');
var readFile = function (filename, encoding, fn) {
  if (arguments.length < 3) {
    fn = arguments[1];
    encoding = 'utf-8';
  }
  fs.readFile(filename, encoding, fn);
};

var readFileSync = function (filename, encoding) {
  encoding = encoding || 'utf-8';
  return fs.readFileSync(filename, encoding);
};

var writeFile = function(filename, data, encoding, fn) {
  if (arguments.length < 4) {
    fn = arguments[2];
    encoding = 'utf-8';
  }
  fs.writeFile(filename, data, encoding, fn);
};

var writeFileSync = function(filename, data, encoding) {
  if (arguments.length < 3) {
    encoding = 'utf-8';
    data = arguments[1];
  }
  return fs.writeFileSync(filename, data, encoding);
};


var readJson = function(filename, fn) {
  readFile(filename, function(err, txt) {
    try {
      fn(undefined, JSON.parse(txt));
    } catch(e) {
      fn(e, undefined);
    }
  });
};

var readJsonSync = function(filename) {
  var txt = '{}', data = null;
  if (fs.existsSync(filename)) {
    txt = readFileSync(filename);
  }
  try {
    data = JSON.parse(txt);
  } catch(e) {
  }
  return data;
};

var renameSync = function (oldPath, newPath) {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
  return false;
};

var unlinkSync = function(path) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
  return false;
};

exports.readFile = readFile;
exports.readFileSync = readFileSync;
exports.writeFile = writeFile;
exports.readJson = readJson;
exports.readJsonSync = readJsonSync;
exports.writeFileSync = writeFileSync;
exports.renameSync = renameSync;
exports.unlinkSync = unlinkSync;
exports.generalId = function () {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};


