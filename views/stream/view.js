'use strict';

angular.module('myApp.view.stream', [])

  .config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('stream', {
      url: "/stream",
      templateUrl: "views/stream/view.html",
      controller: 'StreamViewCtrl'
    });
  }])

  .controller('StreamViewCtrl', ['$scope',
    function ($scope) {
    }]);