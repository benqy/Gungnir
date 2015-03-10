(function (global) {
  'use strict';
  var gui = require('nw.gui');
  gui.App.setCrashDumpDir(require('path').dirname(process.execPath) + '\\dump');

  var adv = global.adv = angular.module('adv', ['ui.router', 'adv.filters', 'adv.directives', 'adv.system', 'adv.studio','adv.network']),
      fs = require('fs'),
      baseModuleDir = './app/modules/';
  adv.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/studio");
  });

  adv.extend = function (obj) {
    Object.keys(obj).forEach(function (key) {
      adv[key] = obj[key];
    });
  };

  adv.regModule = function (name, reqModule) {
    adv[name] = angular.module('adv.' + name, reqModule || []);
    adv[name].moduleName = name;
    adv[name].dataPath = adv.storeDir + '\\' + adv[name].moduleName;
    fs.readdirSync(baseModuleDir + name)
      .forEach(function (file) {
        if (~file.indexOf('.js')) {
          document.write('<script src="modules/' + name + '/' + file + '"></script>');
        }
      });
  };

  adv.extend({      
    storeDir: require('nw.gui').App.dataPath
  });

  var msgTimer = null;
  adv.extend({
    MSG_LEVEL:{
      info: 'info',
      warnings: 'warnings',
      debug: 'debug',
      errors:'errors'
    },
    msg: function (txt, lv) {
      lv = lv || adv.MSG_LEVEL.info;
      $('#msg')
        .removeClass(adv.MSG_LEVEL.info)
        .removeClass(adv.MSG_LEVEL.warnings)
        .removeClass(adv.MSG_LEVEL.debug)
        .removeClass(adv.MSG_LEVEL.errors)
        .addClass(lv).text(txt);
      clearTimeout(msgTimer);
      msgTimer = setTimeout(function () {
        $('#msg')
        .removeClass(adv.MSG_LEVEL.info)
        .removeClass(adv.MSG_LEVEL.warnings)
        .removeClass(adv.MSG_LEVEL.debug)
        .removeClass(adv.MSG_LEVEL.errors);
      }, 5000);
    }
  });

  adv.extend({
    nav: {
      NAVLIST: {
        system: 'system',
        studio: 'studio'
      },
      changeStatus: function (state) {
        var $navList = $('#navlist');
        $navList.find('li').removeClass('active');
        $navList.find('.' + state).addClass('active');
      }
    },
    changeActiveByKey: function (pre, key) {
      $('.' + pre + '-nav-item').removeClass('active');
      $('.cls-' + key).addClass('active');
    }
  });


 // adv.regModule('network');
 

  window.ondragover = function (e) { e.preventDefault(); return false; };
  window.ondrop = function (e) { e.preventDefault(); return false; };

  
  //require('nw.gui').Shell.openItem('AdStudioFlush.exe');
  process.on('uncaughtException', function(err) {
    console.dir(err);
  });
})(this);