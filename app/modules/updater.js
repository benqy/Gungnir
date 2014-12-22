(function () {
  var serverPath = 'https://raw.githubusercontent.com/benqy/Gungnir/master/',
  execPath = require('path').dirname(process.execPath),
  //补丁文件临时目录
  updatePath = execPath + '\\update',
  fs = require('fs'),
  util = require('./helpers/util'),
  when = require('./node_modules/when');
  adv.extend({
    updater: {
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
          alert('请求失败,可能github被墙了,' + url);
          deferred.resolve();
        }, 120000);
        req = https.get(urlOpt, function (res) {
          var isGzip = !!res.headers['content-encoding'] && !!~res.headers['content-encoding'].indexOf('gzip');
          var bufferHelper = new BufferHelper();
          res.on('data', function (chunk) {
            bufferHelper.concat(chunk);
          });

          res.on('end', function () {
            var buffer = bufferHelper.toBuffer();
            clearTimeout(timer);
            //判断是否需要gzip解压缩
            gzipDeferred.promise.then(function (buffer) {
              deferred.resolve({
                buffer: buffer,
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
            alert('更新出错!');
          });
        });
        return deferred.promise;
      },
      updateInfo: function (total, curr) {
        adv.msg('===正在更新:' + curr + '/' + total + '===', adv.MSG_LEVEL.warnings);
      },
      install: function (version) {
        //移动下载下来的update目录里的内容到
        var cmd1 = 'xcopy "' + updatePath + '\\app\\*" "' + execPath + '\\app" /s /e /y';
        //移动配置文件
        var cmd2 = 'xcopy "' + updatePath + '\\package.json" "' + execPath + '\\package.json" /s /e /y';
        require("child_process").exec(cmd1);
        require("child_process").exec(cmd2);
        setTimeout(function () {
          require("child_process").exec('rd /q /s "' + updatePath + '"');
        }, 5000);
        adv.msg('===版本:' + version + '更新完成,请重启===')
      },
      checkUpdate: function () {
        var locPackage = require('nw.gui').App.manifest;
        //获取版本信息和更新文件列表
        adv.updater.get(serverPath + '/package.json?' + new Date() * 1)
          .then(function (packageData) {
            packageData.text = packageData.buffer.toString();
            if (!packageData.text) return;
            var remotePackage = JSON.parse(packageData.text);
            if (remotePackage.version != locPackage.version){
              if (confirm('是否更新到最新版本:' + remotePackage.version)) {
                var totalFile = remotePackage.gungnir.files.length,
                  updateCount = 0;
                adv.updater.updateInfo(totalFile, updateCount);
                //下载更新文件
                remotePackage.gungnir.files.forEach(function (file) {
                  adv.updater.get(serverPath + '/' + file + '?' + new Date() * 1)
                    .then(function (data) {
                      //补丁文件要存放的临时目录
                      var fullFilename = require('path').resolve(updatePath + '\\' + file);

                      //创建补丁文件目录
                      var lfArr = fullFilename.split('\\');
                      var dirName = lfArr.slice(0, lfArr.length - 1).join('\\');
                      if (!fs.existsSync(dirName)) {
                        util.mkdir(dirName, true);
                      }

                      //存放文件
                      fs.writeFileSync(fullFilename, data.buffer);

                      fs.writeFileSync(updatePath + '\\package.json', packageData.buffer);
                      updateCount++;
                      adv.updater.updateInfo(totalFile, updateCount);

                      //补丁下载完毕则安装更新
                      if (updateCount == totalFile) {
                        adv.updater.install(remotePackage.version);
                      }
                    });
                });
              }
            }
            else {
              adv.msg('当前版本:' + remotePackage.version + ',已经是最新版');
            }
          });
      }
    }
  });
})()