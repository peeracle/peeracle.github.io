'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'angulartics', 'angulartics.google.analytics',
  'ui.bootstrap',
  'ui.router',
  'myApp.view.adaptive',
  'myApp.view.mp3audio',
  'myApp.view.mp4video',
  'myApp.view.settings',
  'myApp.view.stream',
  'myApp.view.webmvideo'
]).
config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/webmvideo");
  }]);
