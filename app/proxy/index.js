var spider = require('./spider');

var proxyServer,
  localServer;
var httpProxy = require('http-proxy'),
  fs = require('fs'),
  util = require('../helpers/util'),
  http = require('http');

//根据后缀名判断content-type
var setHeader = function (urlOpt) {
  var dirReg = /(^.*)\/(.*\..*)$/,
    dirArr = dirReg.exec(urlOpt.pathname),
    filename,
    header = {};
  dirArr && (filename = dirArr[2]);
  if (!filename) {
    header['content-type'] = 'text/html';
  } else if (~filename.indexOf('.js')) {
    header['content-type'] = 'application/x-javascript';
  } else if (~filename.indexOf('.html') || ~filename.indexOf('.shtml') || ~filename.indexOf('.htm')) {
    header['content-type'] = 'text/html';
  } else if (~filename.indexOf('.css')) {
    header['content-type'] = 'text/css';
  } else if (~filename.indexOf('.xml')) {
    header['content-type'] = 'application/xml';
  } else if (~filename.indexOf('.json')) {
    header['content-type'] = 'application/json';
  } else if (~filename.indexOf('.jpg')) {
    header['content-type'] = 'image/jpeg';
  } else if (~filename.indexOf('.png')) {
    header['content-type'] = 'image/png';
  } else if (~filename.indexOf('.gif')) {
    header['content-type'] = 'image/gif';
  } else if (~filename.indexOf('.bmp')) {
    header['content-type'] = 'image/bmp';
  } else {
    header['content-type'] = 'application/x-msdownload';
  }
  return header;
};

/**
 * @name renderDir
 * @function
 *
 * @description 根据匹配的路由和http路径,计算出本地目录的真实路径
 * @param {Object} urlOpt http请求信息
 * @param {string} dir 对应的本地目录
 * @returns {string} 本地目录的文件列表的html表示
 */
var renderDir = function (urlOpt, dir) {
  if (!fs.existsSync(dir)) return '';
  var files = fs.readdirSync(dir), resData = '<h3>' + dir + '</h3>', href = '';
  files.forEach(function (file) {
    href = (urlOpt.href + '/' + file).replace(/((\:?)\/{1,})/g, function ($m, $1, $2) { return $2 ? $1 : '/'; });
    resData += '<a href="' + href + '">' + file + '</a></br>';
  });
  return resData;
};

var runServer = function (adv) {
  var ss = adv.system.get(),proItem;
  var configs = ss.localServer;
  module.exports.setProxy();
  var serverHandler = function (req, res) {
    var ss = adv.system.get();
    var path;
    var urlModule = require('url'),
      proItem,
      urlOpt = urlModule.parse(req.url, true),
      header,
      resData = '';
    if (urlOpt.query.proxyid) {
      proItem = adv.studio.getProItems()[urlOpt.query.proxyid];
    }
    //是代理项
    if (proItem && fs.existsSync(proItem.localFile)) {
      header = setHeader(urlModule.parse(urlOpt.query.oriurl, true));
      //代理整个目录
      if (util.isdir(proItem.localFile)) {
        resData = '文件夹';
        path = urlOpt.query.oriurl.replace(proItem.url, ''),
          localFile = require('path').resolve(proItem.localFile +'\\' + path);
        if (!fs.existsSync(localFile)) {
          resData = '文件不存在:' + localFile;
        }
        //如果是目录,则列出目录内容
        else if (util.isdir(localFile)) {
          resData = renderDir(urlModule.parse(urlOpt.query.oriurl), localFile);
        }
        else {
          resData = fs.readFileSync(localFile);
        }
      }
      //代理单个文件
      else {
        resData = fs.readFileSync(proItem.localFile);
      }
      res.writeHead(200, header);
    }
    //非代理
    else {
      header = setHeader(urlOpt);
      path = require('path').resolve(ss.workspace + urlOpt.path);
      if (!fs.existsSync(path)) {
        resData = '文件不存在:' + path;
      }
      else if (util.isdir(path)) {
        resData = renderDir(urlOpt, path);
      }
      else {
        resData = fs.readFileSync(path);
      }
      res.writeHead(404, header);
    }
    res.writeHead(200, header);
    res.end(resData);
  };
  localServer = http.createServer(serverHandler);
  localServer.listen(configs.port);
  localServer.timeout = 5000;
};

//判断url是否匹配某个代理项
var matchProxy = function (proItem, urlOpt) {
  var proItemUrlOpt = require('url').parse(proItem.url.toLowerCase().trim(), true),
    isMatch = false;
  //域名和端口匹配
  if (urlOpt.host == proItemUrlOpt.host && urlOpt.port == proItemUrlOpt.port) {    
    if (urlOpt.pathname.trim() == proItemUrlOpt.pathname.trim()) {
      isMatch = true;
    }
    else if (util.isdir(proItem.localFile) && ~urlOpt.pathname.trim().indexOf(proItemUrlOpt.pathname.trim())) {
      isMatch = true;
    }
  }
  return isMatch;
};

module.exports = {
  runProxyServer: function (adv) {
    var ss = adv.system.get(),
      localServerConfig = ss.localServer;
    proxyServer = httpProxy.createServer(function (req, res, proxy) {
      ss = adv.system.get();
      var buffer = httpProxy.buffer(req),
        url = req.url.toLowerCase(),
        urlOpt = require('url').parse(url, true),
        proItems = adv.studio.getProItems();
      host = urlOpt.hostname || 'localhost', port = urlOpt.port || 80;
      if (localServer && localServer.address()) {
        //判断url是否匹配某个代理项,如果是,则代理到本地文件.
        for (var key in proItems) {
          var proItem = proItems[key];
          if (matchProxy(proItem, urlOpt)) {
            host = localServerConfig.host;
            port = localServerConfig.port;
            req.url = 'http://' + ss.localServer.host + (ss.localServer.port == 80 ? '' : ':' + ss.localServer.port) + 
              '?proxyid=' + proItem.id + 
              '&oriurl=' + encodeURIComponent(url);
          }
        }
      }
      proxy.proxyRequest(req, res, {
        host: host,
        port: port,
        buffer: buffer
      });
    });
    proxyServer.listen(ss.proxyServer.port);
  },
  runServer: function (adv, fn) {
    if (localServer && localServer.address()) {
      localServer.close(function () {
        runServer();
        fn();
      });
    }
    else {
      runServer(adv);
      fn();
    }
  },
  stopServer: function (fn) {
    if (localServer && localServer.address()) {
      localServer.close(function () {
        module.exports.disProxy();
        localServer = null;
        fn();
      });
    }
    else {
      fn();
    }
  },
  setProxy: function () {
    var exec = require("child_process").exec;
    exec(__dirname + '\\runproxy.exe');
  },
  disProxy: function (fn) {
    var exec = require("child_process").exec;
    exec(__dirname + '\\stopproxy.exe', function () {
      fn && fn();
    });
  },
  downloadPage: spider.downloadPage
};