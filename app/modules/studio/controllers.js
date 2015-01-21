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

      //添加代理设置
      $scope.addProItem = function () {
        $scope.currentProItemErrorMsg = "";
        $scope.currentProItem = {
          url: '',
          localFile: '',
          serverSide:false,
          isReg:false
        };
      };

      $scope.saveProItem = function (currentProItem) {
        //http://www.17173cdn.com/a/b
        $scope.currentProItemErrorMsg = "保存...";
        if (currentProItem.localFile) {
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
      //end添加代理设置

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
          try{
            $scope.$digest();
          }catch(e){}
        });
      };
      //#end代理服务器

      //打开程序控制台
      $scope.openTerminal = function () {
        require('nw.gui').Window.get().showDevTools('', false);

      };


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
          studio.delProItem(studio.getItemByPath($scope.currentNode.path));
          studio.tree.removeNode($scope.currentNode);
          $scope.currentNode = null;
        }
      };


      var generalFileName = function (baseDir, name, index) {
        index = index || 1;
        var nameSpt = name.split('.'), length = nameSpt.length;
        var itemName = length > 1 ? (nameSpt.slice(0, length - 1).join('.') + index + '.' + nameSpt[length - 1]) : (name + index);
        var path = require('path').resolve(baseDir + '\\' + itemName);
        if (fs.existsSync(path)) {
          index++;
          return generalFileName(baseDir, name, index);
        }
        else {
          return itemName;
        }
      };

      //文件管理器操作
      $scope.closeExplorerItemForm = function () {
        $scope.currentExplorerItem = null;
      };
      $scope.createFile = function ($event) {
        if ($($event.currentTarget).parent().hasClass('disabled')) {
          $event.stopPropagation();
          return;
        }
        else {
          $scope.currentExplorerItem = {
            isDir: false,
            path: $scope.currentNode.path,
            oldName: null,
            name: ''
          };
        }
      };

      $scope.createDir = function ($event) {
        if ($($event.currentTarget).parent().hasClass('disabled')) {
          $event.stopPropagation();
          return;
        }
        else {
          $scope.currentExplorerItem = {
            isDir: true,
            path: $scope.currentNode.path,
            oldName: null,
            name: ''
          };
        }
      };

      $scope.explorerRename = function ($event) {
        var filename, path, fullName;
        $scope.currentExplorerItem = {
          isDir: true,
          path: $scope.currentNode.path,
          oldName: $scope.currentNode.name,
          name: $scope.currentNode.name
        };
      };

      $scope.saveExplorerItem = function (currentExplorerItem) {
        var cei = currentExplorerItem, path, fullName, fileExists,parentNode;
        cei.name = cei.name.trim();
        var succes = false;
        //新建
        if (!cei.oldName) {
          path = $scope.currentNode.path;
          fullName = path + '\\' + cei.name;
          fileExists = fs.existsSync(fullName);
          //是目录
          if (cei.isDir) {
            //已存在的目录则只提示
            if (!fileExists) {
              fs.mkdirSync(fullName);
              succes = true;
            }
            else {
              adv.msg('目录已存在!', adv.MSG_LEVEL.warnings);
            }
          }
          else {
            //如果文件已存在,则提示是否覆盖
            if (!fileExists || confirm('文件' + cei.name + '已存在,是否覆盖?')) {
              fs.writeFileSync(fullName, '');
              succes = true;
            }
          }
          //改名
          parentNode = $scope.currentNode;
        }
        //改名
        else if (cei.oldName != cei.name) {
          var basePath = '';
          if (cei.isDir) {
            var pathSpt = cei.path.split('\\');
            basePath = pathSpt.slice(0, pathSpt.length - 1).join('\\');
            //更新该目录下所有代理设置
            studio.proEach(function (key,proItem) {
              proItem.localFile = proItem.localFile.replace(cei.path,basePath + '\\' + cei.name);
              studio.saveProItem(proItem);
            });
          }
          else {
            basePath = cei.path;
          }
          fullName = basePath + '\\' + cei.name;
          if (fs.existsSync(fullName)) {
            adv.msg('目录已存在!', adv.MSG_LEVEL.warnings);
          }
          else {
            //如果对应的代理配置,则更新
            var proItem = studio.getItemByPath($scope.currentNode.path);
            proItem && (proItem.localFile = fullName);
            studio.saveProItem(proItem);
            //关闭已打开的编辑器
            adv.codeEditer.closeByFilePath(basePath + '\\' + cei.oldName);

            fs.renameSync(basePath + '\\' + cei.oldName, fullName);
            adv.system.setCurrentFile(cei.path + '\\' + cei.name);
            succes = true;
            parentNode = $scope.currentNode.getParentNode();
            studio.tree.removeNode($scope.currentNode);
            $scope.currentNode = null;
          }
        }
        if (succes) {
          studio.pathToTreeNode(fullName, parentNode);
          adv.system.setCurrentFile(fullName);
          //studio.updateTree();
          $scope.closeExplorerItemForm();
        }
      };
    });

})();