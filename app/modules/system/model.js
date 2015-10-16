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

  var defaultSystemData = {
    //编辑器当前选中的文件
    currentFile: null,
    //编辑器样式
    theme: 'ambiance',
    //工作目录
    workspace:null
  };

  ss.get = function () {
    var ssData = $.extend(defaultSystemData,util.readJsonSync(dataFile));
    ssData.localServer = {
      host: ip,
      port: 10086
    };
    ssData.proxyServer = {
      port: 17173
    };
    
    return ssData;
  };

  ss.setCurrentFile = function (fullName) {
    var system  = adv.system.get();
    system.currentFile = fullName;
    adv.system.save(system);
  };

  ss.save = function (data) {
    var ssData = data || defaultSystemData;
    util.writeFileSync(dataFile, JSON.stringify(ssData));
  };

  //读取theme目录,生成样式列表
  ss.readCssList = function (path) {
    var files = fs.readdirSync(path), themes = {};
    files.forEach(function (file) {
      if (~file.indexOf('.css')) {
        file = file.replace('.css', '');
        themes[file] = file;
      }
    });
    return themes;
  };
})();