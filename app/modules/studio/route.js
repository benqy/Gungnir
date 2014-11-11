(function () {
  'use strict';

  adv.studio.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('studio', {
        url: "/studio",
        templateUrl: "modules/studio/views/studio.html",
        controller: 'studio',
        onEnter: function () {
          adv.nav.changeStatus(adv.nav.NAVLIST.studio);
        }
      });

      //.state('cacheClearResult', {
      //  url: "/cacheClearResult",
      //  templateUrl: "views/cacheserver/result.html"
      //});
  });
})();