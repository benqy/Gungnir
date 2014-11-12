(function () {
  'use strict';
  var util = require('./helpers/util');
  var fs = require('fs');
  var studio = adv.studio;
  studio.directive('codeTree', function () {
    return function ($scope, elem) {
      //选中文件,在编辑器中打开该文件
      var selectNode = function (node) {
        //记住最后一次打开的文件
        var ss = adv.system.get();
        ss.currentFile = node.path;
        if (!node.isDir && node.fileType != studio.FILE_TYPES.image) {
          adv.codeEditer.init(node.path);
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
          }
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
      var $el = $(elem[0]);

      //刷新文件目录
      studio.updateTree = function () {
        var treeNodes, ss = adv.system.get();
        if (ss.workspace) {
          //如果目录已被删除或者被变更为一个文件,则删除workspace
          if (fs.existsSync(ss.workspace) && util.isdir(ss.workspace)) {
            adv.msg('正在加载项目...');
            setTimeout(function () {
              treeNodes = studio.dirObjToTreeNode(ss.workspace);
              studio.tree = $.fn.zTree.init($el, setting, treeNodes);
              var node = studio.tree.getNodeByParam('path', ss.currentFile);
              if (node) {
                //setTimeout(function () {
                  studio.tree.selectNode(node);
                  selectNode(node);
                //}, 0);
              }
              adv.msg('项目加载完毕!');
            },500);
          }
          else {
            ss.workspace = '';
            adv.system.save(ss);
          }
        }
      };
      studio.updateTree();
    };
  });

  document.ondrop = function (e) {
    var path, $target = $(e.target), dir, system, ss = adv.system.get();
    e.preventDefault();
    if (!e.dataTransfer.files.length) return;
    //返回值
    path = e.dataTransfer.files[0].path;
    //if ($target.hasClass('drag-to-add-dir')) {
      ss = adv.system.get();
      ss.workspace = path;
      adv.system.save();
      studio.updateTree && studio.updateTree();
    //}
  };
})();