var gui = require('nw.gui'), 
    win = gui.Window.get();
win.on('close', function () {
  var me = this;
  require('./proxy').disProxy(function () {
    me.close(true);
  });
});