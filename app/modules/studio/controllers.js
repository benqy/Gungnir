(function () {
  'use strict';

  var studio = adv.studio;
  var util = require('./helpers/util');
  var proxy = require('./proxy'),
    fs = require('fs');
  proxy.runProxyServer(adv);
  studio
    .controller('studio', function ($scope, $state, $stateParams) {
      var system = adv.system.get();
	  $scope.hasWorkspace = !!system.workspace;
      //添加文件
      $scope.addProItem = function () {
        $scope.currentProItem = {
          url: '',
          localFile: ''
        };
      };

      $scope.saveProItem = function (currentProItem) {
        //http://www.17173cdn.com/a/b
        $scope.currentProItemErrorMsg = "正在下载页面...";
        if (currentProItem.localFile && util.isdir(currentProItem.localFile)) {
          studio.saveProItem(currentProItem);
          $scope.currentProItem = null;
          $scope.currentProItemErrorMsg = '完成';
          //更新目录结构
          studio.updateTree();

        }
        else {
          studio.downFile(currentProItem, function (item) {
            var msg = '失败';
            if (item) {
              msg = '完成';
              $scope.currentProItem = null;
            }
            $scope.currentProItemErrorMsg = msg;
            $scope.$digest();
          });
        }
      };

      $scope.delProItem = function (currentProItem) {
        studio.delProItem(currentProItem);
        $scope.currentProItem = null;
        //更新目录结构
        studio.updateTree();
      };

      $scope.closeProItemForm = function () {
        $scope.currentProItem = null;
      };
      //end添加文件

      //#region 代理服务器
      adv.studio.serverRuning = adv.studio.serverRuning || false;
      $scope.serverRuning = adv.studio.serverRuning;
      //启动服务器
      $scope.runServer = function () {
        proxy.runServer(adv, function () {
          adv.studio.serverRuning = true;
          $scope.serverRuning = adv.studio.serverRuning;
        });
      };
      $scope.runServer();
      //关闭服务器
      $scope.stopServer = function () {
        proxy.stopServer(function () {
          adv.studio.serverRuning = false;
          $scope.serverRuning = adv.studio.serverRuning;
          $scope.$digest();
        });
      };
      //#end代理服务器


      //刷新目录
      $scope.reload = function () {
        studio.updateTree && studio.updateTree();
      };

      //代码编辑器保存
      $scope.editorChange = adv.codeEditer.hasChange;
      adv.codeEditer.on('change', function (cm, change) {
        $('#editorSave').removeClass('disabled');
      });

      adv.codeEditer.on('save', function () {
        $('#editorSave').addClass('disabled');
      });

      $scope.save = function () {
        adv.codeEditer.save();
      };


      //右键菜单
      $scope.browseAble = false;
      $scope.editNodeAble = false;
      $scope.deleteNodeAble = true;

      $scope.browse = function ($event) {
        if ($($event.currentTarget).parent().hasClass('disabled')) {
          $event.stopPropagation();
          return;
        }
        else {
          require('nw.gui').Shell.openItem($scope.currentNode.title);
        }
      };

      $scope.explorer = function () {
        require('nw.gui').Shell.showItemInFolder($scope.currentNode.path);
      };

      $scope.editNode = function ($event) {
        if ($($event.currentTarget).parent().hasClass('disabled')) {
          $event.stopPropagation();
          return;
        }
        else {
          var proItems = studio.getProItems(),
            proItem = proItems[$scope.currentNode.proItemId];
          if (!proItem) {
            proItem = {
              url: '',
              localFile: $scope.currentNode.path
            };
          }
          $scope.currentProItem = proItem;
        }
      };

      $scope.deleteNode = function ($event) {
        var ss = adv.system.get();
        if ($($event.currentTarget).parent().hasClass('disabled')) {
          $event.stopPropagation();
          return;
        }
        else if (confirm('确认删除文件:' + $scope.currentNode.path)) {
          if (util.isdir($scope.currentNode.path)) {
            require("child_process").exec('rd /q /s ' + $scope.currentNode.path);
            if (ss.workspace == $scope.currentNode.path) {
              ss.workspace = '';
              $scope.hasWorkspace = false;
              adv.system.save(ss);
            }
          }
          else {
            fs.unlinkSync($scope.currentNode.path);
          }
          studio.tree.removeNode($scope.currentNode);
          $scope.currentNode = null;
        }
      };
    });

})();