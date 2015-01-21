(function () {
  'use strict';

  adv.system.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('system', {
        url: "/system",
        //templateUrl: "modules/system/views/content.html",
        controller: 'system',
        onEnter: function () {
          adv.nav.changeStatus(adv.nav.NAVLIST.system);
        }
      });
      //.state('cacheClearResult', {
      //  url: "/cacheClearResult",
      //  templateUrl: "views/cacheserver/result.html"
      //});
  });
})();