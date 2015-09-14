'use strict';

angular.module('myApp.view.mp4video', [])

  .config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('mp4video', {
      url: "/mp4video",
      templateUrl: "views/mp4video/view.html",
      controller: 'MP4VideoViewCtrl'
    });
  }])

  .controller('MP4VideoViewCtrl', ['$scope',
    function ($scope) {
    }]);
