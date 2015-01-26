(function () {
  'use strict';
  var util = require('./helpers/util');
  var fs = require('fs');
  var studio = adv.studio;

  var openProject = function (path, $scope) {
    var ss = adv.system.get();
    ss.workspace = path;
    adv.system.save();
    studio.updateTree && studio.updateTree();
    $scope.hasWorkspace = true;
    $scope.$digest();
  };

  //打开项目文件
  studio.directive('codeOpenproject', function () {
    return function ($scope, elem) {
      document.getElementById('openProjectDialog').addEventListener("change", function (evt) {
        openProject(this.value, $scope);
      }, false);
      $(elem[0]).on('click', function () {
        $('#openProjectDialog').trigger('click');
      });
    }
  });

  studio.directive('codeTree', function () {
    return function ($scope, elem) {
      //选中文件,在编辑器中打开该文件
      var selectNode = studio.selectNode = function (node) {
        //记住最后一次打开的文件
        var ss = adv.system.get();
        ss.currentFile = node.path;
        if (!node.isDir) {
          if (node.fileType == studio.FILE_TYPES.image) {
            //$('.CodeMirror').hide();
            //$('.logContentWrap').text('').append('<img class="content-img" src="' + node.path + '" alt="">');
          } else {
            adv.codeEditer.init(node.path, { filename: node.name });
            $('.CodeMirror').show();
          }
          //如果正在添加代理设置,则自动填入点击的文件
          if ($scope.currentProItem) {
            $scope.currentProItem.localFile = node.path;
            $scope.$digest();
          }
        }
        adv.system.save();
        $scope.currentNode = node;
      };
      $(document).on('click', function (e) {
        $('#studioContext').hide();
      });

      var setting = {
        callback: {
          onClick: function (event, id, node) {
            selectNode(node);
          },
          onRightClick: function (event, treeId, treeNode) {
            if (treeNode) {
              studio.tree.selectNode(treeNode);
              selectNode(treeNode);
              $scope.currentProItem = null;
              var x = event.clientX, y = event.clientY;
              $('#studioContext').css({
                left: x,
                top: y
              }).show();
              $scope.$digest();
            }
            event.stopPropagation();
          },
          //根节点不可拖动
          beforeDrag: function (treeId, treeNodes) {
            for (var i = 0, l = treeNodes.length; i < l; i++) {
              if (treeNodes[i].dragAble === false) {
                return false;
              }
            }
            return true;
          },
          //文件夹才可接受拖动节点
          beforeDrop: function (treeId, treeNodes, targetNode, moveType) {
            var node = treeNodes[0], targetFile;
            if (node && targetNode && targetNode.isDir && confirm('确认移动文件:' + node.name)) {
              targetFile = require('path').resolve(targetNode.path + '\\' + node.name);
              if (node.isDir) {
                //更新该目录下所有代理设置
                studio.proEach(function (key, proItem) {
                  proItem.localFile = proItem.localFile.replace(node.path, targetFile);
                  studio.saveProItem(proItem);
                });
              }
              //如果对应的代理配置,则更新
              var proItem = studio.getItemByPath(node.path);
              proItem && (proItem.localFile = targetFile);
              studio.saveProItem(proItem);
              //关闭编辑器
              adv.codeEditer.closeByFilePath(node.path);
              fs.renameSync(node.path, targetFile);
              adv.system.setCurrentFile(targetFile);
              studio.updateTree();
            }
            else {
              return false;
            }
          }

        },
        edit: {
          enable: true,
          showRemoveBtn: false,
          showRenameBtn: false
        },
        data: {
          key: {
            title: 'title'
          }
        },
        view: {
          selectedMulti: false
        }
      };

      //刷新文件目录
      studio.updateTree = function () {
        var treeNodes, ss = adv.system.get();
        if (ss.workspace) {
          //如果目录已被删除或者被变更为一个文件,则删除workspace
          if (fs.existsSync(ss.workspace) && util.isdir(ss.workspace)) {
            adv.msg('正在加载项目...');
            //防卡
            setTimeout(function () {
              treeNodes = studio.dirObjToTreeNode(ss.workspace);
              var proItems = studio.getProItems(),proItem;
              studio.tree = $.fn.zTree.init($('#fileTree'), setting, treeNodes);
              //加载不在工作目录内的项
              for (var key in proItems) {
                proItem = proItems[key];
                if (!studio.tree.getNodeByParam('path', proItem.localFile)) {
                  var pNode = studio.pathToTreeNode(proItem.localFile, null, true);
                  studio.tree.addNodes(null,pNode);
                }
              };
              //选中上一次选中的文件
              var node = studio.tree.getNodeByParam('path', ss.currentFile);
              if (node) {
                studio.tree.selectNode(node);
                selectNode(node);
              }
              adv.msg('项目加载完毕!');
            }, 500);
          }
          else {
            ss.workspace = '';
            adv.system.save(ss);
          }
        }
      };
      studio.updateTree();

      document.ondrop = function (e) {
        var path, $target = $(e.target), dir, system;
        e.preventDefault();
        if (!e.dataTransfer.files.length) return;
        //返回值
        path = e.dataTransfer.files[0].path;
        if (!fs.statSync(path).isDirectory()) {
          //console.log(fs.statSync(path));
          adv.codeEditer.init(path, { filename: util.getFilename(path) });
        }
        else {
          //if ($target.hasClass('drag-to-add-dir')) {
          openProject(path, $scope);
        }
      };
    };
  });

  studio.directive('codeTabs', function () {
    return function ($scope, elem) {
      var $tool = $(elem[0]);
      //$tool.find('.editor-tab-btn');
      //tab按钮
      $tool.on('click', '.editor-tab-btn', function () {
        var index = $(this).attr('data-index');
        adv.codeEditer.toggleToTab(index);
      });

      //关闭按钮
      $tool.on('click', '.editor-tab-btn i', function (e) {
        var index = $(this).parent().attr('data-index');
        adv.codeEditer.closeTab(index);
        e.stopPropagation();
      });
    }
  });
})();