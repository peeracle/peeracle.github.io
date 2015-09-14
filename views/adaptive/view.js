'use strict';

angular.module('myApp.view.adaptive', [])

  .config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('adaptive', {
      url: "/adaptive",
      templateUrl: "views/adaptive/view.html",
      controller: 'AdaptiveViewCtrl'
    });
  }])

  .controller('AdaptiveViewCtrl', ['$scope',
    function ($scope) {
    }]);