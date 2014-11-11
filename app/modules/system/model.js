(function () {
  'use strict';

  var util = require('./helpers/util'),
      fs = require('fs'),
      ss = adv.system,
      dataFile = ss.dataPath + '\\system.json',
      ip = require('./node_modules/ip').address();

  if (!fs.existsSync(ss.dataPath)) {
    fs.mkdirSync(ss.dataPath);
  }

  var ssData = {
    //编辑器当前选中的文件
    currentFile: null,
    //工作目录
    workspace:null
  };
  ss.get = function () {
    ssData = util.readJsonSync(dataFile);
    ssData.localServer = {
      host: ip,
      port: 80
    };
    ssData.proxyServer = {
      port: 17173
    };
    return ssData;
  };
  ss.save = function (data) {
    ssData = data || ssData;
    util.writeFileSync(dataFile, JSON.stringify(ssData));
  };
})();