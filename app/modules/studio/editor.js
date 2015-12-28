(function () {
  var util = require('./helpers/util');



  var defaultConfig = {
    theme: 'monokai',
     blastCode: { effect: 1},
    tabSize: 2,
    //关闭自带的拖动显示
    dragDrop: false,
    autofocus: true,
    lineNumbers: true,
    lineWrapping: true,
    foldGutter: true,
    gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    styleActiveLine: true,
    matchBrackets: true,
    lint: false,
    autoCloseBrackets: true,
    highlightSelectionMatches: { showToken: /\w/ },
    matchTags: { bothTags: true },
    //显示行末尾多余的空白
    showTrailingSpace: true,
    profile: 'xhtml',
    //自动编译Babel文件为js文件 http://babeljs.io/
    autoCompileBabel: true,
    scrollbarStyle: "overlay"
  };

  var htmlmixed = {
    name: "htmlmixed",
    scriptTypes: [{
      matches: /\/x-handlebars-template|\/x-mustache/i,
      mode: null
    }, {
      matches: /(text|application)\/(x-)?vb(a|script)/i,
      mode: "vbscript"
    }]
  };

  var execPath = require('path').dirname(process.execPath);

  //初始化Tern组件 http://ternjs.net/
  var initTern = function (editor) {
    var ecma5Code = util.readJsonSync(execPath + '\\app\\lib\\codemirror\\addon\\tern\\ecma5.json');
    var jqueryCode = util.readJsonSync(execPath + '\\app\\lib\\codemirror\\addon\\tern\\jquery.json');
    var browserCode = util.readJsonSync(execPath + '\\app\\lib\\codemirror\\addon\\tern\\browser.json');
    var advCode = util.readJsonSync(execPath + '\\app\\lib\\codemirror\\addon\\tern\\adv.json');
    var server = new CodeMirror.TernServer({
      defs: [ecma5Code, jqueryCode, browserCode, advCode],
      useWorker: false,
      workerScript: execPath + '\\app\\lib\\codemirror\\addon\\tern\\worker.js',
      workerDeps: [
        execPath + '\\app\\lib\\acorn\\acorn.js',
        execPath + '\\app\\lib\\acorn\\acorn_loose.js',
        execPath + '\\app\\lib\\acorn\\util\\walk.js',
        execPath + '\\app\\lib\\tern\\polyfill.js',
        execPath + '\\app\\lib\\tern\\lib\\signal.js',
        execPath + '\\app\\lib\\tern\\lib\\tern.js',
        execPath + '\\app\\lib\\tern\\lib\\def.js',
        execPath + '\\app\\lib\\tern\\lib\\comment.js',
        execPath + '\\app\\lib\\tern\\lib\\infer.js',
        execPath + '\\app\\lib\\tern\\plugin\\doc_comment.js'
      ]
    });
    editor.setOption("extraKeys", {
      "'.'": function (cm) {
        setTimeout(function () { server.complete(cm); }, 100);
        throw CodeMirror.Pass; // tell CodeMirror we didn't handle the key 
      },
      "Ctrl-.": function (cm) { server.complete(cm); },
      "Ctrl-I": function (cm) { server.showType(cm); },
      "Alt-.": function (cm) { server.jumpToDef(cm); },
      //"Alt-,": function (cm) { server.jumpBack(cm); },
      //"Ctrl-Q": function (cm) { server.rename(cm); },
      "Ctrl-R": function (cm) { server.selectName(cm); },
      "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); }, 
      "Ctrl-J": "toMatchingTag"
    })
    editor.on("cursorActivity", function (cm) { server.updateArgHints(cm); });
  };

  adv.codeEditer = {
    MODES: {
      html: htmlmixed,
      shtml: htmlmixed,
      php: 'application/x-httpd-php',
      aspx: htmlmixed,
      js: 'javascript',
      bb: 'javascript',
      coffee: 'coffeescript',
      md: 'markdown',
      css: 'css',
      scss:'sass',
      txt: 'javascript',
      json: 'json',
      'null': 'null',
      ts:'text/typescript',
      adv: 'javascript'
    },
    editors: {

    },
    toggleToTab: function (index) {
      this.currrentTabIndex = index;
      var tab = $('.editor-tab-btn[data-index="' + index + '"]');
      var filepath = tab.data('filepath');
      var editor = this.editors[filepath];
      this.cm = editor;
      this.filepath = filepath;
      $('.editor-tab-btn').addClass('editor-tab-blur');
      tab.removeClass('editor-tab-blur');
      //删除语法提示弹出框
      $('.CodeMirror-Tern-tooltip').remove();
      $('.logContentWrap').hide();
      $('.logContentWrap[data-index="' + index + '"]').show();
      this.cm && this.cm.focus();
    },
    nextTab: function () {
      if (!this.currrentTabIndex) return;
      var tab = $('.editor-tab-btn[data-index="' + this.currrentTabIndex + '"]').next();
      if (!tab[0]) tab = $('.editor-tab-btn:eq(0)');
      var index = tab.attr('data-index');
      if (index != this.currrentTabIndex) {
        this.toggleToTab(index);
      }
    },
    closeTab: function (index) {
      //未指定索引则关闭当前标签页
      index = index || this.currrentTabIndex;
      var tab = $('.editor-tab-btn[data-index="' + index + '"]');
      var filepath = tab.data('filepath');
      delete this.editors[filepath];
      tab.remove();
      //删除语法提示弹出框
      $('.CodeMirror-Tern-tooltip').remove();

      $('.logContentWrap[data-index="' + index + '"]').remove();
      if (!tab.hasClass('editor-tab-blur')) {
        $('.editor-tab-btn:eq(0)').trigger('click');
      }
    },
    //关闭匹配指定本地路径的文件,如果为文件夹,则关闭所有该文件夹下的文件.
    closeByFilePath: function (filepath) {
      if (util.isdir(filepath)) {
        $('.editor-tab-btn').each(function (i, n) {
          var $n = $(n),index;
          if (~$n.data('filepath').indexOf(filepath)) {
            index = $n.data('index');
            index && this.closeTab(index);
          }
        }.bind(this));
      }
      else {
        var tab = $('.editor-tab-btn[data-filepath="' + filepath.replace(/\\/ig, '\\\\') + '"]'),
          index = tab.data('index');
        index && this.closeTab(index);
      }
    },
    setTheme: function (theme) {
      //if(theme != 'default'){
      $('#editorThemeStyleSheet').remove();
      var styleSheet = $('<link id="editorThemeStyleSheet" href="lib/codemirror/theme/' + theme + '.css" rel="stylesheet" />');
      $('head').append(styleSheet);
      // }
    },
    init: function (filepath, options) {
      var editor = this.editors[filepath];
      if (editor) {
        var tab = $('.editor-tab-btn[data-filepath="' + filepath.replace(/\\/ig, '\\\\') + '"]');
        this.toggleToTab(tab.data('index'));
        return;
      };
      var index = util.generalId();
      var me = this, txt = '', wrap = $('<div class="logContentWrap" data-index="' + index + '" data-filepath="' + filepath + '">'), el;
      //生成编辑器
      el = $('<textarea name="" class="logContent"></textarea>');
      wrap.append(el);
      wrap.show();
      $('#editorRightContent').append(wrap);
      //生成tab按钮
      var tab = $('<a href="javascript://" title="' + filepath + '" data-index="' + index + '" data-filepath="' + filepath + '"  class="btn btn-primary editor-tab-btn editor-tab-blur" style="border-radius:0;">' + (options.filename || filepath) + '<i class="mdfi-icon mdfi_navigation_close"></i></a>');
      $('#editorTabs .btn-group').append(tab);
      this.options = options = $.extend({}, defaultConfig, options);
      this.setTheme(options.theme);
      if (filepath) {
        txt = util.readFileSync(filepath);
        this.filepath = filepath;
        //如果没指定编辑器模式,则根据文件扩展名判断
        var fileSuff = filepath.match(/\.([^\.]+$)/);
        var mode = fileSuff ? fileSuff[1] : 'null';
        
        if (!options.mode) options.mode = this.MODES[mode] || 'null';
        if (mode == 'js' || mode == 'bb') {
          options.lint = true;
        }
      }
      else {
        this.filepath = null;
      }
      el.text(txt.trim());
      el = el[0];
      this.cm = CodeMirror.fromTextArea(el, options);
      this.cm.on('change', function (em, changeObj) {
        me.hasChange = true;
        me.fire('change', {
          em: em,
          changeObj: changeObj
        });
      });
      this.cm.fileSuffix = mode;

      //绑定按键
      this.cm.addKeyMap({
        "Ctrl-S": function () {
          me.save();
        },
        "Ctrl-M": function () {
          me.format();
        },
        "Ctrl-L": function () {
          CodeMirror.commands.gotoLine(me.cm);
        },
        "Ctrl-K": function () {
          me.commentSelection(true);
        },
        "Ctrl-N": function () {
          me.commentSelection();
        },
        "Ctrl-Tab": function () {
          //adv.studio.nextFile && adv.studio.nextFile();
          me.nextTab();
        },
        //"Ctrl-W": function () {
        //  adv.studio.prevFile && adv.studio.prevFile();
        //}
        //关闭当前标签页
        "Ctrl-W": function (cm) {
          me.closeTab();
        }
      });
      this.editors[filepath] = this.cm;
      this.toggleToTab(index);
      initTern(this.cm);
    },

    events: {},
    getSelectedRange: function () {
      return { from: this.cm.getCursor(true), to: this.cm.getCursor(false) };
    },
    goToLine: function (line) {
      var cm = this.cm;
      line = line - 1;
      cm.setCursor({ line: line, ch: 0 });
      var myHeight = cm.getScrollInfo().clientHeight;
      var coords = cm.charCoords({ line: line, ch: 0 }, "local");
      cm.scrollTo(null, (coords.top + coords.bottom - myHeight) / 2);
    },
    format: function () {
      var range = this.getSelectedRange();
      if (range.from.line === range.to.line && range.from.ch === range.to.ch) {
        var line = this.cm.lastLine(),
          ch = this.cm.getLine(line).length;
        range.from = {
          line: 0,
          ch: 0
        };
        range.to = {
          line: line,
          ch: ch
        };
      }
      this.cm.autoFormatRange(range.from, range.to);
    },
    commentSelection: function (isComment) {
      var range = this.getSelectedRange();
      if (range.from.line === range.to.line && range.from.ch === range.to.ch) {
        var line = range.from.line,
          ch = this.cm.getLine(line).length;
        range.from = {
          line: line,
          ch: 0
        };

        range.to = {
          line: line,
          ch: ch
        };
      }
      this.cm.commentRange(isComment, range.from, range.to);
    },
    save: function () {
      //if (!this.hasChange) return;
      if (!this.filepath) {
        adv.msg('暂不支持保存新文件');
      }
      else {
        var txt = adv.codeEditer.cm.getValue();
        util.writeFileSync(adv.codeEditer.filepath, txt);
        if (this.options.autoCompileBabel && this.editors[this.filepath].fileSuffix == 'bb') {
          this.transformBabel();
        }
        this.hasChange = false;
        var fileNameArr = this.filepath.split('\\');
        adv.msg('文件:' + fileNameArr[fileNameArr.length - 1] + '保存成功!');
        this.fire('save');
      }
    },
    transformBabel:function(){
      var babel = require('./node_modules/babel');
      var txt = this.cm.getValue();
      util.writeFileSync(this.filepath.replace('.bb','.js'), babel.transform(txt).code);
    },
    fire: function (eventName, obj) {
      this.events[eventName] && this.events[eventName].forEach(function (fn) {
        fn(obj);
      });
    },
    on: function (eventName, fn) {
      this.events[eventName] = this.events[eventName] || [];
      this.events[eventName].push(fn);
    }
  };

})();