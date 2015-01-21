(function () {
  'use strict';

  var network = adv.network;
  var gui = require('nw.gui'), win = gui.Window.get();
  var logs = [];
  //for (var i = 0; i < 15; i++) {
  //  logs.push({ "url": "http://www.17173.com/2015/yxdh/inc-game-sort.shtml", "filename": "inc-game-sort.shtml", "method": "GET", "contentType": "text/html", "statusCode": 200, "reqHeader": { "host": "www.17173.com", "proxy-connection": "keep-alive", "cache-control": "max-age=0", "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8", "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36", "dnt": "1", "referer": "http://www.17173.com/", "accept-encoding": "gzip, deflate, sdch", "accept-language": "zh-CN,zh;q=0.8,zh-TW;q=0.6", "cookie": "SUV=1421059178878867; NUV=1421078400000; ue-guide=1; cyan_uv=C6746582A0A0000141A081301D10A000; vjuids=-33baa7645.14ae1c4d123.0.5e5803f1; live_17173_unique=5b304fd304b0477be79e724544254082; __utma=113262040.1253443372.1421224925.1421224925.1421224925.1; __utmc=113262040; __utmz=113262040.1421224925.1.1.utmcsr=about.17173.com|utmccn=(referral)|utmcmd=referral|utmcct=/; pgv_si=s1292936192; ppinf17173=2|1421638695|0|dWlkOjkxOTA3ODg5fG5pY2tuYW1lOiVFNiU4OCU5MSVFNiU4OSU4RCVFNiU5OCVBRmJlbnF5fHZlcmlmaWVkOjF8cmVndGltZToxMzYyMzcyODE0fHVzZXJuYW1lOmJlbnF5MUAxNzE3My5jb20|1; pprdig17173=PkK7RvXO1dCpUmzxzT_xpwCbUkXhR27vBnSMdjZjpdQwoUHeXCPFDqoX_M7JX4clXI7s-yG_sLE83rU7PLlJoy_7Es07Ch4-JTAjtbzLzIciauhn7bibCV75I6AP1KtCgYdfYMlgEM6Tq1kkMZVb36XW7n8_OpzA0yScSVCeiWY; lastdomain17173=1453174695|YmVucXkxQDE3MTczLmNvbXw=|17173.com; ppmdig17173=7c413fcc39ce316837bf28020229a92b; pgv_pvi=3366161408; pgv_info=ssi=s2245653176; Hm_lvt_970c9e413352b8e77854f54b3769dd51=1421820457; Hm_lpvt_970c9e413352b8e77854f54b3769dd51=1421820643; DIFF=1421821889847; vjlast=1421126980.1421820051.11; Hm_lvt_0245ebe4fb30a09e371e4f011dec1f6a=1420508724,1420525105,1420534249,1421059584; Hm_lpvt_0245ebe4fb30a09e371e4f011dec1f6a=1421822693; focus_float=42; source_ss=38; source_index=37; ONLINE_TIME=1421825282983; sessionid2=142105917887886714218187799813531421817931911|38; ad17173indexbanner1=0; Ad17173Duilian=1; ad17173banner2=2; IPLOC=CN3501" }, "queryObject": {}, "resHeader": { "server": "nginx", "date": "Wed, 21 Jan 2015 08:26:49 GMT", "content-type": "text/html", "transfer-encoding": "chunked", "connection": "close", "expires": "Wed, 21 Jan 2015 08:27:59 GMT", "cache-control": "max-age=70", "x-server": "fzjs-10-59-67-25.h.173ops.com", "my-cache": "EXPIRED from fzjs-10-59-67-18.h.173ops.com", "content-encoding": "gzip", "power-by": "fzjs-10-59-67-20.h.173ops.com" }, "delay": 26+i, "id": "znjqa7apsf4aqzcmjsbr7b0a1n", "resObj": { "dataType": "text", "gzip": true }, "content": "abc", "size": 44.917+i, "date": "2015-01-21T08:26:46.089Z" })
  //}
  win.on('httplog', function (logObj) {
    //console.log('httplog')
    logs.push(logObj);
    var scope = $('#logWrap').scope();
    if (scope && !scope.$$phase && !scope.$root.$$phase) {
      scope.$digest();
    }
  });
  network
    .controller('network', function ($scope) {
      $scope.logs = logs;
      $scope.query = '';
      $scope.order = 'date';
      $scope.clear = function () {
        logs.splice(0, logs.length);
      };
    })
})();
