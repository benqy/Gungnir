(function () {
  'use strict';

  adv.network.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('network', {
        url: "/network",
        templateUrl: "modules/network/views/network.html",
        controller: 'network'
      });

      //.state('cacheClearResult', {
      //  url: "/cacheClearResult",
      //  templateUrl: "views/cacheserver/result.html"
      //});
  });
})();