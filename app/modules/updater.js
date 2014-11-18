//var path = ;
//var execPath = path.dirname(process.execPath);
//console.log(execPath)
var serverPath = 'https://raw.githubusercontent.com/benqy/Gungnir/master/',
  execPath = require('path').dirname(process.execPath),
  fs = require('fs'),
  util = require('./helpers/util'),
  when = require('./node_modules/when');

var updater = {
  get: function (url) {
    var deferred = when.defer(),
     gzipDeferred = when.defer(),
     https = require('https'),
     BufferHelper = require('./node_modules/bufferhelper'),
     urlOpt = require('url').parse(url);
    var req = null;
    //超时
    var timer = setTimeout(function () {
      req.abort();
      console.log('Request Timeout.', urlOpt);
      deferred.resolve();
    }, 120000);
    req = https.get(urlOpt, function (res) {
      var isGzip = !!res.headers['content-encoding'] && !!~res.headers['content-encoding'].indexOf('gzip');
      var bufferHelper = new BufferHelper();
      res.on('data', function (chunk) {
        bufferHelper.concat(chunk);
      });

      res.on('end', function () {
        var text, buffer = bufferHelper.toBuffer();
        clearTimeout(timer);
        //判断是否需要gzip解压缩
        gzipDeferred.promise.then(function (buffer) {
          text = buffer.toString();
          deferred.resolve({
            text: text,
            urlOpt: urlOpt
          });
        });

        if (isGzip) {
          require('zlib').unzip(buffer, function (err, buffer) {
            gzipDeferred.resolve(buffer);
          });
        }
        else {
          gzipDeferred.resolve(buffer);
        }
      });
      res.on('error', function () {
        console.log(urlOpt);
      });
    });
    return deferred.promise;
  }
}
var locPackage = require('nw.gui').App.manifest;
if (locPackage.gungnir && locPackage.gungnir.autoupdate) {
  updater.get(serverPath + '/package.json')
    .then(function (data) {
      if (!data.text) return;
      var updaterPackage = JSON.parse(data.text);
      console.log(updaterPackage.gungnir.files, execPath);
    });
}