var gui = require('nw.gui'), 
    win = gui.Window.get();
win.on('close', function () {
  var me = this;
  adv.networkWin && adv.networkWin.close();
  require('./proxy').disProxy(function () {
    me.close(true);
  });
});