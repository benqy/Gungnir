(function () {
  'use strict';

  var gui = require('nw.gui'), win = gui.Window.get(), winMaximize = false;
  angular.module('adv.directives', [])
  .directive('avActive',function() {
    return function (scope, elem, attrs) {
      //var key = 'create-new';
      //if (scope.proSetting && scope.proSetting.id) {
      //  key = scope.proSetting.id;
      //};
      //adv.changeActiveByKey('prosetting', key);
      //var selector = attrs.avActive;
      ////$(elem[0]).find(selector).no('eq:last').addClass('active');
      //$(elem[0]).on('click', selector, function () {
      //  $(elem[0]).find(selector).addClass('active');
      //  $(this).removeClass('active');
      //});
    };
  })
  .directive('avMenu', function () {
    return function (scope, elem) {
      $(elem[0]).on('click', 'li', function () {
        $(elem[0]).find('li').removeClass('active');
        $(this).addClass('active');
      });
    };
  })
  //打开github链接
  .directive('avSite', [function () {
    return function (scope, elem) {
      $(elem[0]).on('click', function () {
        require('nw.gui').Shell.openExternal('https://github.com/benqy/Gungnir');
      });
    };
  }])
  .directive('avUpdate', [function () {
    return function (scope, elem) {
      $(elem[0]).on('click', function () {
        adv.updater.checkUpdate();
      });
    };
  }])
  //最小化窗口
  .directive('avMinisize', [function () {
    return function (scope, elem) {
      //var tray;
      //win.on('minimize', function () {
      //  this.hide();
      //  tray = new gui.Tray({ icon: 'img/logo.png' });
      //  tray.on('click', function () {
      //    win.show();
      //    this.remove();
      //    tray = null;
      //  });
      //});
      $(elem[0]).on('click', function () {
        win.minimize();
      });
    };
  }])
  //最大化&还原窗口
  .directive('avMaxToggle', [function () {
    return function (scope, elem) {
      win.on('maximize', function () {
        winMaximize = true;
        $(elem[0]).find('i').removeClass('glyphicon-fullscreen').addClass('glyphicon-resize-small');
      });
      win.on('unmaximize', function () {
        winMaximize = false;
        $(elem[0]).find('i').removeClass('glyphicon-resize-small').addClass('glyphicon-fullscreen');
      });

      $(elem[0]).on('click', function () {
        if (winMaximize) {
          win.unmaximize();
        }
        else {
          win.maximize();
        }
      });
    };
  }])
  //关闭应用程序
  .directive('avClose', [function () {
    return function (scope, elem) {
      $(elem[0]).on('click', function () {
        require('nw.gui').Window.get().close();
      });
    };
  }])
  .directive('avTabs',function () {
    return function ($scope, elem) {
      var $tabs = $(elem[0]);
      $tabs.find('li').on('click', function () {
        $tabs.find('li').removeClass('active');
        $(this).addClass('active');
        $('.nav-tabs-container').hide();
        $tabs.nextAll('.nav-tabs-container').eq($(this).data('index')).show();
      });
    }
  })
  //打开网络监控面板
  .directive('avNetwork', function () {
    return function ($scope, elem) {
      var proxy = require('./proxy');
      proxy.on('log', function (logObj) {
        logObj.content = logObj.content.toString();
        //console.log(JSON.stringify(logObj));
        //console.log(logObj)
        adv.networkWin && adv.networkWin.emit('httplog', logObj);
      });
      var networkWinUrl = ('file:///' + require('path').dirname(process.execPath) + '/app/network.html#/network').replace(/\\/g,'/');
      //console.log(networkWinUrl)
      $(elem[0]).on('click', function () {
        if (!adv.networkWin) {
          adv.networkWin = gui.Window.open(networkWinUrl, {
            position: 'center',
            "toolbar": false,
            "frame": false,
            "width": 1000,
            "height": 650,
            "min_width": 1000,
            "min_height": 650,
            "icon": "app/img/network.png"
          });
          adv.networkWin.mainWin = window;
          adv.networkWin.on('close', function () {
            adv.networkWin = null;
            this.close(true);
          });
        }
        else {
         // adv.networkWin.close();
        }
      });
    }
  });
})();