(function () {
  'use strict';

  var util = require('./helpers/util'),
    fs = require('fs'),
    proxy = require('./proxy'),
    ip = require('./node_modules/ip'),
    studio = adv.studio;

  studio.getItemByPath = function (localFile, proItems) {
    var data;
    proItems = proItems || studio.getProItems();
    for (var key in proItems) {
      if (proItems[key].localFile == localFile) {
        data = proItems[key];
      }
    }
    return data;
  };

  studio.getItemByUrl = function (url, proItems) {
    var data;
    proItems = proItems || studio.getProItems();
    for (var key in proItems) {
      if (proItems[key].url == url) {
        data = proItems[key];
      }
    }
    return data;
  };

  studio.getProItems = function () {
    var ss = adv.system.get();
    if (!ss.workspace) return;
    var proFilePath = ss.workspace + '\\zproject.json';
    if (!fs.existsSync(proFilePath)) {
      util.writeFileSync(proFilePath, JSON.stringify({}));
    }
    var pItems = util.readJsonSync(proFilePath);
    Object.keys(pItems).forEach(function (sKey) {
      var pro = pItems[sKey];
      Object.keys(pro).forEach(function (key) {
        if (~key.indexOf('$$')) {
          delete pro[key];
        }
      });
    });
    return pItems;
  };

  studio.proEach = function (fn) {
    var proItems = studio.getProItems();
    Object.keys(proItems).forEach(function (key) {
      fn(key, proItems[key]);
    });
  };

  studio.general = function () {
    return {
      path: ''
    };
  };

  studio.saveProItem = function (proItem) {
    if (!proItem) return;
    var ss = adv.system.get();
    if (!ss.workspace) return;
    var datas = studio.getProItems();
    var data = studio.getItemByUrl(proItem.url, datas);
    //如果已经有此url,则覆盖,优先保证url不重复
    if (data) {
      proItem.id = data.id;
      datas[data.id] = proItem;
    }
      //新增的则生成新的id
    else if (!proItem.id) {
      proItem.id = util.generalId();
    }
    datas[proItem.id] = proItem;
    var proFilePath = ss.workspace + '\\zproject.json';
    util.writeFileSync(proFilePath, JSON.stringify(datas));
    return { success: true, msg: '保存成功' };
  };

  studio.delProItem = function (proItem) {
    if (proItem) {
      var ss = adv.system.get();
      if (!ss.workspace) return;
      var datas = studio.getProItems();
      var proFilePath = ss.workspace + '\\zproject.json';
      delete datas[proItem.id];
      util.writeFileSync(proFilePath, JSON.stringify(datas));
      return { success: true, msg: '完成' };
    }
  };

  studio.downFile = function (proItem, fn) {
    proxy.downloadPage(proItem.url)
      .then(function (data) {
        var ss = adv.system.get();
        var filenames = util.url2FileName(data.urlOpt.href),
          path, file;
        if (!filenames.path || !filenames.fileName) {
          filenames = util.url2SiteDir(data.urlOpt.href);
        }
        //如果目标文件为空,则自动生成
        if (!proItem.localFile || !fs.existsSync(proItem.localFile)) {
          path = ss.workspace + filenames.path;
          file = ss.workspace + filenames.path + '\\' + filenames.fileName;
          if (proItem.localFile) {
            var lfArr = proItem.localFile.split('\\');
            path = lfArr.slice(0, lfArr.length - 1).join('\\'),
            file = path + '\\' + lfArr[lfArr.length - 1];
          }
          //递归创建文件所在目录
          util.mkdir(path, true);
          util.writeFileSync(file, data.text);
          proItem.localFile = file;
        }
        studio.saveProItem(proItem);
        //更新目录结构
        //记住最后一次打开的文件
        ss.currentFile = filenames.fileName;
        adv.system.save(ss);
        studio.updateTree();
        fn && fn(proItem);
      });
    return { success: true, msg: '创建成功' };
  };


  //Tree
  var getDirName = function (path) {
    var dirArr = path.split('\\');
    return dirArr[dirArr.length - 1];
  };

  studio.treeNodes = [];


  studio.dirObjToTreeNode = function (path) {
    return pathToTreeNode(path);
  };

  var pathToTreeNode = studio.pathToTreeNode = function (path, parentNode,outOfWorkspace) {
    //要从项目浏览器视图中排除的文件,TODO:改为可配置
    if (~path.indexOf('node_modules') || ~path.indexOf('.git')) return;
    if (!fs.existsSync(path)) return;
    var isDir = fs.statSync(path).isDirectory(),
        ipAddres = ip.address(),
        ss = adv.system.get(),
        localUrl = 'http://' + ipAddres + (ss.localServer.port == 80 ? '' : ':' + ss.localServer.port),
        node = {
          name: getDirName(path),
          path: path,
          title: path,
          isDir: isDir,
          dragAble:true,
          isProxy: false
        };
    //将title设置为访问地址
    node.title = localUrl + path.replace(ss.workspace, '').replace(/\\/ig,'/');
    //如果是设置的代理项,则title为代理的页面地址
    var proItems = studio.getProItems();
    for (var key in proItems) {
      if (proItems[key].localFile == node.path) {
        node.title = proItems[key].url;
        node.isProxy = true;
        node.proItemId = proItems[key].id;
      }
    }
    if (isDir) {
      if (!parentNode) {
        node.open = true;
      }
      if (node.isProxy) {
        node.icon = './img/proxy-file.png';
      }
      else {
        node.icon = './img/folder.png';
      }
      node.children = [];
      fs.readdirSync(path)
        .forEach(function (file) {
          pathToTreeNode(path + '\\' + file, node);
        });
    } else {
      node.fileType = getFileType(node.name);
      if (node.isProxy) {
        node.icon = './img/proxy-file.png';
      }
      else {
        node.icon = generalTypeIcon(node);
      }
    }
    if (node.name == 'zproject.json') {
      node.name = '代理列表';
      node.icon = './img/setting.png';
    }
    if (parentNode) {
      //如果已经是一个树节点,则直接添加到树中,否则添加到数据里
      if (parentNode.tId) {
        studio.tree && studio.tree.addNodes(parentNode, node);
      }
      else {
        parentNode.children.push(node);
      }
    } else {
      if (outOfWorkspace) {
        node.icon = './img/proxy-file.png';
      }
      else {
        node.icon = './img/out-of-workspace.png';
        node.isProject = true;
      }
      node.dragAble = false;
      return node;
    }
  };


  studio.FILE_TYPES = {
    html: 'html',
    javascript: 'javascript',
    json: 'json',
    css: 'css',
    image: 'image',
    unknow: 'unknow'
  };

  var getFileType = function (fileName) {
    if (~fileName.toLowerCase().indexOf(".html") || ~fileName.toLowerCase().indexOf(".shtml") || ~fileName.toLowerCase().indexOf(".php")) {
      return studio.FILE_TYPES.html;
    }
    else if (~fileName.toLowerCase().indexOf(".json")) {
      return studio.FILE_TYPES.json;
    }
    else if (~fileName.toLowerCase().indexOf(".js")) {
      return studio.FILE_TYPES.javascript;
    }
    else if (~fileName.toLowerCase().indexOf(".css")) {
      return studio.FILE_TYPES.css;
    }
    else if (~fileName.toLowerCase().indexOf(".png") || ~fileName.toLowerCase().indexOf(".jpg")
      || ~fileName.toLowerCase().indexOf(".gif") || ~fileName.toLowerCase().indexOf(".bmp") || ~fileName.toLowerCase().indexOf(".ico")) {
      return studio.FILE_TYPES.image;
    }
    else {
      return studio.FILE_TYPES.unknow;
    }
  };
  var generalTypeIcon = function (node) {
    if (node.fileType == studio.FILE_TYPES.html) {
      return './img/html.png';
    }
    else if (node.fileType == studio.FILE_TYPES.javascript) {
      return './img/js.png';
    }
    else if (node.fileType == studio.FILE_TYPES.image) {
      return './img/img.png';
    }
    else if (node.fileType == studio.FILE_TYPES.css) {
      return './img/css.png';
    } else {
      return './img/text.png';
    }
  };
})()