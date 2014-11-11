(function () {
  var util = require('./helpers/util');

  var defaultConfig = {
    theme: 'ambiance',
    autofocus:true,
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: { "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); }, "Ctrl-J": "toMatchingTag" },
    foldGutter: true,
    gutters: ["CodeMirror-lint-markers","CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    styleActiveLine: true,
    matchBrackets: true,
    lint: false,
    autoCloseBrackets: true,
    highlightSelectionMatches: { showToken: /\w/ },
    matchTags: { bothTags: true },
    profile: 'xhtml'
  };

  var isTxt = function (file) {
    return ~file.indexOf('.js')
      || ~file.indexOf('.css')
      || ~file.indexOf('.txt')
      || ~file.indexOf('.html')
      || ~file.indexOf('.json')
      || ~file.indexOf('.adv')
      || ~file.indexOf('.md');
  };

  var htmlmixed = {
    name: "htmlmixed",
    scriptTypes: [{
      matches: /\/x-handlebars-template|\/x-mustache/i,
      mode: null
    },{
      matches: /(text|application)\/(x-)?vb(a|script)/i,
      mode: "vbscript"
    }]
  };

  adv.codeEditer = {
    MODES: {
      html: htmlmixed,
      js: 'javascript',
      css: 'css',
      txt: 'javascript',
      json: 'json',
      'null':'null',
      adv: 'javascript'
    },
    init: function (filepath, options) {
      var me = this, txt = '', wrap = $('#logContentWrap'), el;
      el = $('<textarea name="" id="logContent"></textarea>');
      wrap.text('').append(el);
      options = $.extend({}, defaultConfig, options);
      if (filepath) {
        txt = util.readFileSync(filepath);
        this.filepath = filepath;
        //如果没指定编辑器模式,则根据文件扩展名判断
        var mode = filepath.match(/\.([^\.]+$)/)[1];
        if (!options.mode) options.mode = this.MODES[mode] || 'null';
        if (mode == 'js') {
          options.lint = true;
        }
      }
      else {
        this.filepath = null;
      }
      $(el).text(txt.trim());
      el = el[0];
      this.cm = CodeMirror.fromTextArea(el, options);
      this.cm.on('change', function (em, changeObj) {
        me.hasChange = true;
        me.fire('change', {
          em: em,
          changeObj: changeObj
        });
      });

      //绑定按键
      this.cm.addKeyMap({
        "Ctrl-S": function () {
          me.save();
        },
        "Ctrl-M": function () {
          me.format();
        },
        "Ctrl-K": function () {
          me.commentSelection(true);
        },
        "Ctrl-L": function () {
          me.commentSelection();
        },
        "Ctrl-Tab": function () {
          adv.studio.nextFile && adv.studio.nextFile();
        },
        "Ctrl-W": function () {
          adv.studio.nextFile && adv.studio.prevFile();
        }
      })
      //console.log(CodeMirror.keyMap)
    },
    events: {},
    getSelectedRange:function () {
        return { from: this.cm.getCursor(true), to: this.cm.getCursor(false) };
    },
    format:function(){
      var range = this.getSelectedRange();
      if (range.from.line === range.to.line && range.from.ch === range.to.ch) {
        var line = this.cm.lastLine(),
          ch = this.cm.getLine(line).length;
        range.from  = {
          line : 0,
          ch : 0
        }
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
      if (!this.hasChange) return;
      if (!this.filepath) {
        adv.msg('暂不支持保存新文件');
      }
      else {
        var txt = adv.codeEditer.cm.getValue();
        util.writeFileSync(adv.codeEditer.filepath, txt);
        this.hasChange = false;
        var fileNameArr = this.filepath.split('\\');
        adv.msg('文件:' + fileNameArr[fileNameArr.length-1] + '保存成功!');
        this.fire('save');
      }
    },
    fire:function(eventName,obj){
      this.events[eventName] && this.events[eventName].forEach(function (fn) {
        fn(obj);
      });
    },
    on: function (eventName, fn) {
      this.events[eventName] = this.events[eventName] || [];
      this.events[eventName].push(fn);
    }
  };

})()