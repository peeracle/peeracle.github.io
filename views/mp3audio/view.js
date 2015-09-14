'use strict';

angular.module('myApp.view.mp3audio', [])

  .config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('mp3audio', {
      url: "/mp3audio",
      templateUrl: "views/mp3audio/view.html",
      controller: 'MP3AudioViewCtrl'
    });
  }])

  .controller('MP3AudioViewCtrl', ['$scope',
    function ($scope) {
    }]);