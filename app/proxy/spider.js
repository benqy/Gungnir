var when = require('when'),
 fs = require('fs');

var isGbk = function (contentType, buffer) {
  contentType = contentType || '', contentStr = buffer.toString();
  if (~contentType.toLowerCase().indexOf('utf-8')) {
    return false;
  }
  var meta = contentStr.match(/<meta.*>/igm);
  meta = meta?meta.join(','):'';
  if (~contentType.toLowerCase().indexOf('gbk') || ~contentType.toLowerCase().indexOf('gb2312') || 
      ~meta.indexOf('charset=gb2312') || ~meta.indexOf('charset=gbk')|| 
      ~meta.indexOf('charset="gbk"') || ~meta.indexOf('charset="gb2312"')) {
    return true;
  }
  return false;
};


exports.downloadPage = function (url) {
  var deferred = when.defer(),
    gzipDeferred = when.defer(),
    http = require('http'),
    iconv = require('iconv-lite'),
    BufferHelper = require('bufferhelper'),
    urlOpt = require('url').parse(url);
  urlOpt.headers = {
    'Accept-Encoding': 'gzip',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36'
  };
  var req = null;
  //超时
  var timer = setTimeout(function () {
    req.abort();
    console.log('Request Timeout.', urlOpt);
    deferred.resolve();
  }, 120000);
  req = http.get(urlOpt, function (res) {
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
        var isgbk = isGbk(res.headers['content-type'], buffer);
        if (isgbk) {
          text = iconv.decode(buffer, 'GBK');
        }
        else {
          text = buffer.toString();
        }
        deferred.resolve({
          text: text,
          isgbk: isgbk,
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
};