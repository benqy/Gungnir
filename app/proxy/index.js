var zlib = require('zlib');
var spider = require('./spider');

//代理服务器
var proxyServer,
  //web服务器
  localServer;
var httpProxy = require('http-proxy'),
  fs = require('fs'),
  iconv = require('iconv-lite'),
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
  } else if (~filename.indexOf('.ico')) {
    header['content-type'] = 'image/x-icon';
  } else {
    //header['content-type'] = 'application/x-msdownload';
    header['content-type'] = 'text/plain';
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

//SSI命令
var DIRECTIVE_MATCHER = /<!--#([a-z]+)([ ]+([a-z]+)="(.+?)")*\s*-->/g;
//SSI命令中的属性
var ATTRIBUTE_MATCHER = /([a-z]+)="(.+?)"/g;
var INTERPOLATION_MATCHER = /\$\{(.+?)\}/g;
var parseAttributes =  function (directive) {
  var attributes = [];

  directive.replace(ATTRIBUTE_MATCHER, function (attribute, name, value) {
    attributes.push({ name: name, value: value });
  });

  return attributes;
};

//读取文件并返回,支持SSI
var resFile = function (path,root) {
  var content = fs.readFileSync(path);
  if (~path.indexOf('.shtml')) {
    content = content.toString();
    var directives = content.match(DIRECTIVE_MATCHER);
    directives && directives.forEach(function (directive) {
      var attributes = parseAttributes(directive);
      var attribute = attributes[0];
      if (attribute && attribute.name == 'virtual') {
        var filename = attribute.value;
        if (filename[0] == '/') {
          filename = require('path').resolve(root + filename);
        }
        else {
          filename = require('path').resolve(util.getFileDir(path) + '\\' + filename);
        }
        if (~filename.indexOf('.shtml')) {
          content = content.replace(directive, resFile(filename, root));
        }
        else {
          content = content.replace(directive, fs.readFileSync(filename).toString());
        }
      }
    });
  }
  return content;
};

//web服务器
var runServer = function (adv) {
  var ss = adv.system.get(),
      //配置好的代理规则项
      proItem;
  var configs = ss.localServer;
  //设置浏览器代理
  module.exports.setProxy();
  var serverHandler = function (req, res) {
    var ss = adv.system.get();
    var path;
    var urlModule = require('url'),
      proItem,
      urlOpt = urlModule.parse(req.url, true),
      header,
      resData = '';
    //是否设置了代理.
    if (urlOpt.query.proxyid) {
      proItem = adv.studio.getProItems()[urlOpt.query.proxyid];
    }
    if (proItem && fs.existsSync(proItem.localFile)) {
      header = setHeader(urlModule.parse(urlOpt.query.oriurl, true));
      //代理整个目录
      if (util.isdir(proItem.localFile)) {
        resData = '文件夹';
        path = urlOpt.query.oriurl.toLowerCase().replace(proItem.url, ''),
          localFile = require('path').resolve(proItem.localFile + '\\' + path);
        localFile = decodeURIComponent(localFile);
        if (!fs.existsSync(localFile)) {
          resData = '文件不存在:' + localFile;
        }
        //如果是目录,则列出目录内容
        else if (util.isdir(localFile)) {
          resData = renderDir(urlModule.parse(urlOpt.query.oriurl), localFile);
        }
        else {
          resData = resFile(localFile,ss.workspace);
        }
      }
      //代理单个文件
      else {
        var fileText = resFile(proItem.localFile, ss.workspace);
        if (proItem.serverSide) {
          try {
            var customFn = new Function('query', fileText);
            resData = customFn(urlModule.parse(urlOpt.query.oriurl, true).query).toString();
          } catch (e) {
            resData = JSON.stringify(e.message);
          }
        }
        else {
          resData = fileText;
        }
      }
      res.writeHead(200, header);
    }
    //非代理(即普通的本地web服务器)
    else {
      header = setHeader(urlOpt);
      path = require('path').resolve(ss.workspace + urlOpt.path.split('?')[0]);
      path = decodeURIComponent(path);
      if (!fs.existsSync(path)) {
        if (urlOpt.path == '/favicon.ico') {
          resData = fs.readFileSync(require('path').dirname(process.execPath) + '\\app\\img\\logo.ico');
        }
        else {
          resData = '文件不存在:' + path;
        }
      }
      else if (util.isdir(path)) {
        resData = renderDir(urlOpt, path);
      }
      else {
        resData = resFile(path, ss.workspace);
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

//判断url是否匹配某个代理项设置.
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

/**
 * @name noErrorDecodeUri
 * @function
 *
 * @description 尝试对url进行decodeURIComponent,如果失败,则还回原始url
 * @param {string} url 要decode的url
 * @returns {string} decode之后的url
 */
var noErrorDecodeUri = function (url) {
  try {
    return window.decodeURIComponent(url);
  } catch (e) {
    return url;
  }
};

var resDataType = {
  text: 'text',
  image: 'image',
  javascript: 'javascript',
  css: 'css',
  file: 'file'
};

/**
   * @name parseRes
   * @function
   *
   * @description 判断http返回的内容的类型以及是否经过gzip压缩
   * @param {object} resHeader http response header
   * @param {url} url http请求的地址
   * @returns {Object} dataType:返回内容的格式,gzip:是否经过gzip压缩
   */
var parseRes = function (resHeader, url) {
  var dataType = resDataType.file, ct = resHeader['content-type'] || '', gzip = false;
  if (~url.indexOf('.png') || ~url.indexOf('.jpg') || ~url.indexOf('.gif') || ~url.indexOf('.bmp') || ~url.indexOf('.ico') || ~ct.indexOf('image')) {
    dataType = resDataType.image;
  }
  else if (~ct.indexOf('css') || ~url.indexOf('.css')) {
    dataType = resDataType.css;
  }
  else if (~ct.indexOf('javascript') || ~ct.indexOf('json') || ~url.indexOf('.js') || ~url.indexOf('.json')) {
    dataType = resDataType.javascript;
  }
  else if (~ct.indexOf('html') || ~ct.indexOf('csv') || ~ct.indexOf('text') || ~ct.indexOf('xml') || ~url.indexOf('.txt')
     || ~url.indexOf('.html') || ~url.indexOf('.htm') || ~url.indexOf('.shtml') || ~url.indexOf('.xml') || ~url.indexOf('.asp') || ~url.indexOf('.php')) {
    dataType = resDataType.text;
  }

  if (!!resHeader['content-encoding'] && !!~resHeader['content-encoding'].indexOf('gzip')) {
    gzip = true;
  }
  return {
    dataType: dataType,
    gzip: gzip
  };
}
var events = [];
module.exports = {
  //运行代理服务器
  runProxyServer: function (adv) {
    
    var ss = adv.system.get(),
      localServerConfig = ss.localServer;
    proxyServer = httpProxy.createServer(function (req, res, proxy) {
      ss = adv.system.get();
      var buffer = httpProxy.buffer(req),
        url = req.url.toLowerCase(),
        urlOpt = require('url').parse(url, true),
        //代理配置列表
        proItems = adv.studio.getProItems();
      host = urlOpt.hostname || 'localhost', port = urlOpt.port || 80;
      if (localServer && localServer.address()) {
        //判断url是否匹配某个代理项,如果是,则交给本地web服务器处理.
        for (var key in proItems) {
          var proItem = proItems[key];
          if (matchProxy(proItem, urlOpt)) {
            host = localServerConfig.host;
            port = localServerConfig.port;
            req.url = 'http://' + ss.localServer.host + (ss.localServer.port == 80 ? '' : ':' + ss.localServer.port) +
              '?proxyid=' + proItem.id +
              '&oriurl=' + encodeURIComponent(req.url);
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
    //日记
    proxyServer.proxy.on('proxyResponse', function (req, res, response) {
      try{
        var logObj = {}, pathArr, buffer = [], resStr = '',
            urlOpt = require('url').parse(req.url.toLowerCase(), true),
            url = noErrorDecodeUri(req.url),
            filename;
        if (urlOpt.query.httpmocknolog) return;
        pathArr = url.split('/');
        filename = pathArr[pathArr.length - 1];
        filename = filename || url;
        logObj.url = url;
        logObj.filename = filename;
        logObj.method = req.method;
        logObj.contentType = response.headers['content-type'] || '';
        logObj.statusCode = response.statusCode;
        logObj.reqHeader = req.headers;
        logObj.queryObject = urlOpt.query || {};
        logObj.resHeader = response.headers;
        logObj.delay = new Date() - req.reqDate;
        logObj.id = util.generalId();
        response.on('data', function (trunk) {
          try{
            buffer.push(trunk);
            resStr += trunk;
          }
          catch (e) {
            console.log('index.js-325', e.toString());
          }
        });
        response.on('end', function () {
          buffer = Buffer.concat(buffer);
          var resObj = parseRes(response.headers, url, buffer);
          logObj.resObj = resObj;
          if (resObj.gzip) {
            zlib.unzip(buffer, function (err, buffer) {
              if (err) console.dir(err);
              try{
                if (spider.isGbk(logObj.contentType, buffer)) {
                  //将gbk转为utf8
                  buffer = iconv.decode(buffer, 'GBK');
                }
                logObj.content = buffer;
                logObj.size = buffer.length / 1000;
                logObj.date = new Date();
                module.exports.emit('log', logObj);
              }
              catch (e) {
                console.log('index.js-346', e.toString());
              }
            });
          }
          else {
            try{
              if (spider.isGbk(logObj.contentType, buffer)) {
                buffer = iconv.decode(buffer, 'GBK');
              }
              logObj.content = buffer;
              logObj.size = buffer.length / 1000;
              logObj.date = new Date();
              module.exports.emit('log', logObj);
            }
            catch (e) {
              console.log('index.js-361', e.toString());
            }
          }
        });
      }
      catch (e) {
        console.log('index.js-368', e.toString());
      }
    });
  },
  //runProxyServer: function (adv) {
  //  var ss = adv.system.get(),
  //    localServerConfig = ss.localServer;
  //  var proxy = httpProxy.createProxyServer({ prependPath: false });

  //  proxyServer = http.createServer(function (req, res) {
  //    ss = adv.system.get();
  //    var url = req.url.toLowerCase(),
  //      target = req.url,
  //      urlOpt = require('url').parse(url, true),
  //      proItems = adv.studio.getProItems();
  //    if (localServer && localServer.address()) {
  //      //判断url是否匹配某个代理项,如果是,则代理到本地文件.
  //      for (var key in proItems) {
  //        var proItem = proItems[key];
  //        if (matchProxy(proItem, urlOpt)) {
  //          target = 'http://' + ss.localServer.host + (ss.localServer.port == 80 ? '' : ':' + ss.localServer.port) +
  //            '?proxyid=' + proItem.id + 
  //            '&oriurl=' + encodeURIComponent(req.url);
  //        }
  //      }
  //    }
  //    req.url = target
  //    req.reqDate = new Date();
  //    proxy.web(req, res, { target: target });
  //  });
  //  proxyServer.listen(ss.proxyServer.port);

  //  proxy.on('proxyRes', function (proxyRes, req, res) {
  //    var logObj = {}, pathArr, buffer = [], resStr = '',
  //        urlOpt = require('url').parse(req.url, true),
  //        url = noErrorDecodeUri(req.url),
  //        filename;
  //    if (urlOpt.query.httpmocknolog) return;
  //    pathArr = url.split('/');
  //    filename = pathArr[pathArr.length - 1];
  //    filename = filename || url;
  //    logObj.url = url;
  //    logObj.filename = filename;
  //    logObj.method = req.method;
  //    logObj.contentType = proxyRes.headers['content-type'] || '';
  //    logObj.statusCode = proxyRes.statusCode;
  //    logObj.reqHeader = req.headers;
  //    logObj.queryObject = urlOpt.query || {};
  //    logObj.resHeader = proxyRes.headers;
  //    logObj.delay = new Date() - req.reqDate;
  //    logObj.id = util.generalId();
  //    proxyRes.on('data', function (trunk) {
  //      buffer.push(trunk);
  //      resStr += trunk;
  //    });
  //    proxyRes.on('end', function () {
  //      try {
  //        buffer = Buffer.concat(buffer);
  //        var resObj = parseRes(proxyRes.headers, url, buffer);
  //        logObj.resObj = resObj;
  //        if (resObj.gzip) {
  //          zlib.unzip(buffer, function (err, buffer) {
  //            if(err)console.dir(err);
  //            if (spider.isGbk(logObj.contentType, buffer)) {
  //              //将gbk转为utf8
  //              buffer = iconv.decode(buffer, 'GBK');
  //            }
  //            logObj.content = buffer;
  //            logObj.size = buffer.length / 1000;
  //            logObj.date = new Date();
  //            module.exports.emit('log', logObj);
  //          });
  //        }
  //        else {
  //          if (spider.isGbk(logObj.contentType, buffer)) {
  //            buffer = iconv.decode(buffer, 'GBK');
  //          }
  //          logObj.content = buffer;
  //          logObj.size = buffer.length / 1000;
  //          logObj.date = new Date();
  //          module.exports.emit('log', logObj);
  //        }
  //      }
  //      catch (e) {
  //        console.dir(e)
  //      }
  //    });

  //  });

  //  proxy.on('error', function (err, req, res) {
  //    console.log(err)
  //    res.writeHead(500, {
  //      'Content-Type': 'text/plain'
  //    });

  //    res.end('服务异常.');
  //  });
  //},
  runServer: function (adv, fn) {
    if (localServer && localServer.address()) {
      localServer.close(function () {
        runServer(adv);
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
    exec('"' + __dirname + '\\runproxy.exe"');
  },
  disProxy: function (fn) {
    var exec = require("child_process").exec;
    exec('"' + __dirname + '\\stopproxy.exe"', function () {
      fn && fn();
    });
  },
  downloadPage: spider.downloadPage,
  on: function (name, fn) {
    events[name] = events[name] || [];
    events[name].push(fn);
  },
  emit: function (name, data) {
    var fns = events[name];
    if (fns) {
      fns.forEach(function (fn) {
        fn(data);
      });
    }
  }
};