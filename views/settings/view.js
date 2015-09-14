'use strict';

angular.module('myApp.view.settings', [])

  .config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('settings', {
      url: "/settings",
      templateUrl: "views/settings/view.html",
      controller: 'SettingsViewCtrl'
    });
  }])

  .controller('SettingsViewCtrl', ['$scope',
    function ($scope) {
    }]);