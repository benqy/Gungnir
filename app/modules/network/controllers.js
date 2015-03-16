(function () {
  'use strict';

  var network = adv.network;
  var gui = require('nw.gui'), win = gui.Window.get();
  var logs = [];
  win.on('httplog', function (logObj) {
    try {
      logs.push(logObj);
      var scope = $('#logWrap').scope();
      if (scope && !scope.$$phase && !scope.$root.$$phase) {
        scope.$digest();
      }
    }catch(e){}
  });
  network
    .controller('network', function ($scope) {
      $scope.logs = logs;
      $scope.query = '';
      $scope.order = 'date';
      $scope.clear = function () {
        logs.splice(0, logs.length);
        $scope.currentLog = null;
      };
      $scope.show = function (log) {
        log.queryObject = log.queryObject || {};
        var imgC = $('.nav-tabs-container:eq(1)');
        if (!log.resContent) {
          imgC.text('');
          var dataType = log.resObj.dataType;
          if (dataType == 'text' || dataType == 'javascript' || dataType == 'css') {
            log.resContent = log.content;
          }
          else if (dataType == 'image') {
            var img = $('<img src="' + log.url + (~log.url.indexOf('?') ? '&' : '?') + 'httpmocknolog=true" />');
            imgC.append(img);
          }
          else {
            log.resContent = '非文本内容'
          }
        }
        if(log.resContent){
          imgC.text(log.resContent);
        }
        if (!log.cookies) {
          log.cookies = [];
          if (log.reqHeader.cookie) {
            var cookieArr = log.reqHeader.cookie.split(';');
            cookieArr.forEach(function (n) {
              var cookieKV = n.split('=');
              log.cookies.push({
                Name: cookieKV[0],
                Value: cookieKV[1]
              })
            });
          }
        }
        $scope.currentLog = log;
      }

      $scope.addProItem = function (log) {
        try{
          var studioScope = win.mainWin.$('#studioContent').scope();
          studioScope.currentProItemErrorMsg = "";
          studioScope.currentProItem = {
            url: log.url,
            localFile: '',
            serverSide: false,
            isReg: false
          };
          if (studioScope && !studioScope.$$phase && !studioScope.$root.$$phase) {
            studioScope.$digest();
          }
          win.mainWin.focus();
        }
        catch(e){}
      };
      $scope.hide = function () {
        $scope.currentLog = null;
      }
    })
})();
