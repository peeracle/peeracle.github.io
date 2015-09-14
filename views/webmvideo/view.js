'use strict';

Math.trunc = Math.trunc || function(x) {
    return x < 0 ? Math.ceil(x) : Math.floor(x);
  }

angular.module('myApp.view.webmvideo', [])

  .config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('webmvideo', {
      url: "/webmvideo",
      templateUrl: "views/webmvideo/view.html",
      controller: 'WebMVideoViewCtrl'
    });
  }])

  .controller('WebMVideoViewCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
      var video = document.querySelector('video');
      var dataStream;
      var queue = [];
      var session;
      var storage;
      var metadata;
      var mediaSource;
      var sourceBuffer;
      var sessionHandle;
      var cues;

      var current = 0;
      var total;

      var peers = {};
      $scope.peers = [];

      $scope.canvas = document.getElementById('progress');
      $scope.canvas.style.width = '100%';
      $scope.canvas.width = $scope.canvas.offsetWidth;
      $scope.context = $scope.canvas.getContext('2d');

      $scope.context.strokeStyle = '#CCC';
      $scope.context.lineWidth = 5;
      $scope.context.clearRect(0, 0, $scope.canvas.width, $scope.canvas.height);
      $scope.context.strokeRect(0, 0, $scope.canvas.width, $scope.canvas.height);

      var refresh = window.setInterval(function refreshCb() {
        $scope.$apply(function applyCb() {
          $scope.peers;
        });
      }, 10);

      function start(metadata, media) {
        storage = new Peeracle.MemoryStorage();
        session = new Peeracle.Session(storage);

        session.on('connect', function onConnectCb(tracker, id) {
          console.log('[Session] Connected to tracker', tracker, 'with id', id);
        });

        session.on('disconnect', function onDisconnectCb(tracker, code, reason) {
          console.log('[Session] Disconnected from tracker', tracker, code, reason);
        });

        session.addMetadata(metadata, function addMetadataCb(error, handle) {
          if (error) {
            throw error;
          }

          total = metadata.streams[0].mediaSegments.length;
          sessionHandle = handle;
          handle.on('enter', function onEnterCb(peer) {
            console.log('[Handle] Peer', peer.id, 'entered');
            peer.color = '#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16))
                .slice(-6);

            peer.sent = '0 MB';
            peer.sentBytes = 0;
            peer.received = '0 MB';
            peer.receivedBytes = 0;

            peer.browserText = peer.browser + ' (' + peer.os + ')';

            if ($scope.peers.indexOf(peer) === -1) {
              $scope.peers.push(peer);
            }

            peer.on('sending', function (hash, segment, chunk, sentBytes) {
              peer.sentBytes += sentBytes;
              peer.sent = ((peer.sentBytes / 1024) / 1024).toFixed(2) + ' MB';
            });
          });

          handle.on('leave', function onLeaveCb(peer) {
            var index = $scope.peers.indexOf(peer);
            console.log('[Handle] Peer', peer.id, 'left');

            if (index !== -1) {
              $scope.peers.splice(index, 1);
            }
          });

          handle.on('receiving',
            function onReceivingCb(peer, segment, chunk, received, completed, length) {
              peer.receivedBytes += received;
              peer.received = ((peer.receivedBytes / 1024) / 1024).toFixed(2) + ' MB';
            });

          handle.on('received', function onComplete(peer, segment, chunk, offset, length) {
            var index;
            var size = 0;
            var drawOffset = 0;
            var segments = metadata.streams[0].mediaSegments;
            var count = segments.length;

            for (index = 0; index < count; ++index) {
              if (index < segment) {
                drawOffset += segments[index].length;
              }
              size += segments[index].length;
            }

            offset += drawOffset;

            var pos = (offset * $scope.canvas.width) / size;
            var width = (length * $scope.canvas.width) / size;

            $scope.context.fillStyle = peer.color;
            $scope.context.fillRect(pos, 0, width, $scope.canvas.height);
          });

          handle.on('request', function onRequestCb(id, segment) {
          });

          handle.on('send', function onSendCb(id, segment, bytesSent) {
          });

          handle.start();

          initVideo();

          /*handle.retrieveMediaSegment(0, function onComplete(error, bytes) {

           });*/
        });
      }

      var req = new XMLHttpRequest();
      req.open('GET', video.src, true);
      req.responseType = 'arraybuffer';
      req.onreadystatechange = function (evt) {
        if (req.readyState == 4) {
          if (req.status == 200) {
            try {
              var metadataFileStream = new Peeracle.MemoryDataStream({
                buffer: new Uint8Array(req.response)
              });

              metadata = new Peeracle.Metadata();
              metadata.unserialize(metadataFileStream,
                function unserializeCb(error) {
                  if (error) {
                    throw error;
                  }
                });
            } catch (e) {
              throw new Error('Can\'t open the metadata file: ' + e.message);
            }

            start(metadata, null);
          }
        }
      };
      req.onerror = function onError(e) {

      };
      req.send(null);

      var sourceBufferUpdateStart = function sourceBufferUpdateStart() {
        //console.log('sourceBufferUpdateStart_');
      };

      var sourceBufferUpdate = function sourceBufferUpdate() {
        //console.log('sourceBufferUpdate_');
      };

      var sourceBufferUpdateEnd = function sourceBufferUpdateEnd() {
        //console.log('sourceBufferUpdateEnd');
        if (queue.length) {
          sourceBuffer.appendBuffer(queue.shift());
        }
      };

      var sourceBufferError = function sourceBufferError() {
        console.log('sourceBufferError_');
      };

      var sourceBufferAbort = function sourceBufferAbort() {
        console.log('sourceBufferAbort_');
      };

      var mediaSourceOpen = function mediaSourceOpen() {
        console.log('mediaSourceOpen');
        sourceBuffer = mediaSource.addSourceBuffer(metadata.streams[0].mimeType);
        sourceBuffer.addEventListener('updatestart', sourceBufferUpdateStart);
        sourceBuffer.addEventListener('update', sourceBufferUpdate);
        sourceBuffer.addEventListener('updateend', sourceBufferUpdateEnd);
        sourceBuffer.addEventListener('error', sourceBufferError);
        sourceBuffer.addEventListener('abort', sourceBufferAbort);
        sourceBuffer.appendBuffer(metadata.streams[0].initSegment);

        cues = [];
        for (var i = 0, l = metadata.streams[0].mediaSegments.length; i < l; ++i) {
          cues.push(metadata.streams[0].mediaSegments[i].timecode);
        }
        console.log(cues, i, l);

        sessionHandle.retrieveMediaSegment(current,
          function done(error, bytes) {
            console.log('got the cluster', current, 'of', total, '!');
            if (sourceBuffer.updating) {
              queue.push(bytes);
            } else {
              sourceBuffer.appendBuffer(bytes);
            }
            /*if (++current < total) {
             console.log('now getting the cluster', current);
             sessionHandle.retrieveMediaSegment(current, done);
             } else {
             console.log(storage);
             }*/
          });
      };

      var mediaSourceClose = function mediaSourceClose() {
        console.log('mediaSourceClose');
      };

      var mediaSourceEnd = function mediaSourceEnd() {
        console.log('mediaSourceEnd');
      };

      function initVideo() {
        mediaSource = new MediaSource();
        mediaSource.addEventListener('sourceopen', mediaSourceOpen);
        mediaSource.addEventListener('sourceclose', mediaSourceClose);
        mediaSource.addEventListener('sourceend', mediaSourceEnd);

        var elementSeeking = function elementSeeking() {
          var min = 0;
          var index;
          var count;

          video.removeEventListener('timeupdate', elementTimeUpdate);

          count = cues.length;
          for (index = 0; index < count; ++index) {
            if (cues[index] > video.currentTime * 1000) {
              break;
            }
            min = index;
          }

          console.log('elementSeeking', video.currentTime, min, cues[min]);
          current = min;

          count = video.buffered.length;
          for (index = 0; index < count; ++index) {
            if (video.buffered.start(index) < video.currentTime &&
              video.buffered.end(index) > video.currentTime) {
              video.addEventListener('timeupdate', elementTimeUpdate);
              return;
            }
          }

          sessionHandle.stopRequests();
          sessionHandle.retrieveMediaSegment(current,
            function done(error, bytes) {
              console.log('got the cluster', current, 'of', total, '!');
              if (sourceBuffer.updating) {
                queue.push(bytes);
              } else {
                sourceBuffer.appendBuffer(bytes);
              }
              video.addEventListener('timeupdate', elementTimeUpdate);
            });
        };

        var elementTimeUpdate = function elementTimeUpdate() {
          var diff;
          var index;
          var count;

          if (current + 1 >= cues.length) {
            return;
          }

          diff = cues[current + 1] - cues[current];
          if (cues[current + 1] - (video.currentTime * 1000) < diff * (50 / 100)) {
            console.log('asking next segment', video.currentTime * 1000,
              cues[current + 1] * (80 / 100));

            video.removeEventListener('timeupdate', elementTimeUpdate);

            count = video.buffered.length;
            for (index = 0; index < count; ++index) {
              if (video.buffered.start(index) < video.currentTime &&
                video.buffered.end(index) > cues[current + 1] / 1000) {
                video.addEventListener('timeupdate', elementTimeUpdate);
                ++current;
                return;
              }
            }

            sessionHandle.retrieveMediaSegment(current + 1,
              function done(error, bytes) {
                console.log('got the cluster', ++current, 'of', total, '!');
                video.addEventListener('timeupdate', elementTimeUpdate);
                if (sourceBuffer.updating) {
                  queue.push(bytes);
                } else {
                  sourceBuffer.appendBuffer(bytes);
                }
              });
          }
        };

        video.addEventListener('seeking', elementSeeking);
        video.addEventListener('timeupdate', elementTimeUpdate);

        video.src = window.URL.createObjectURL(mediaSource);
      }

      /*
       metadata.unserialize(stream, function unserializeCb(error) {
       if (error) {
       throw error;
       }
       });

       var mediaSourceOpen_ = function mediaSourceOpen_() {
       console.log('mediaSourceOpen_');

       var sourceBufferUpdateStart_ = function sourceBufferUpdateStart_() {
       console.log('sourceBufferUpdateStart_');
       }.bind(this);

       var sourceBufferUpdate_ = function sourceBufferUpdate_() {
       console.log('sourceBufferUpdate_');
       }.bind(this);

       var sourceBufferUpdateEnd_ = function sourceBufferUpdateEnd_() {
       console.log('sourceBufferUpdateEnd_');
       if (queue.length) {
       sourceBuffer.appendBuffer(queue.shift());
       }
       }.bind(this);

       var sourceBufferError_ = function sourceBufferError_() {
       console.log('sourceBufferError_');
       }.bind(this);

       var sourceBufferAbort_ = function sourceBufferAbort_() {
       console.log('sourceBufferAbort_');
       }.bind(this);

       sourceBuffer = mediaSource.addSourceBuffer(metadata.streams[0].mimeType);
       sourceBuffer.addEventListener('updatestart', sourceBufferUpdateStart_);
       sourceBuffer.addEventListener('update', sourceBufferUpdate_);
       sourceBuffer.addEventListener('updateend', sourceBufferUpdateEnd_);
       sourceBuffer.addEventListener('error', sourceBufferError_);
       sourceBuffer.addEventListener('abort', sourceBufferAbort_);
       sourceBuffer.appendBuffer(metadata.streams[0].init);

       session = new Peeracle.Session();
       session.addMetadata(metadata, storage, function addMetadataCb(handle) {
       var current = 0;
       var total = metadata.streams[0].segments.length;

       handle.start();
       handle.retrieveCluster(current, null, function done(bytes) {
       console.log('got the cluster', current, 'of', total, '!');
       if (sourceBuffer.updating) {
       queue.push(bytes);
       } else {
       sourceBuffer.appendBuffer(bytes);
       }
       if (++current < total) {
       console.log('now getting the cluster', current);
       handle.retrieveCluster(current, null, done);
       } else {
       console.log(storage);
       }
       });
       });
       }.bind(this);

       var mediaSourceClose_ = function mediaSourceClose_() {
       console.log('mediaSourceClose_');
       }.bind(this);

       var mediaSourceEnd_ = function mediaSourceEnd_() {
       console.log('mediaSourceEnd_');
       }.bind(this);

       mediaSource = new MediaSource();
       mediaSource.addEventListener('sourceopen', mediaSourceOpen_);
       mediaSource.addEventListener('sourceclose', mediaSourceClose_);
       mediaSource.addEventListener('sourceend', mediaSourceEnd_);

       var elementSeeking_ = function () {
       console.log('elementSeeking_', video.currentTime);
       }.bind(this);

       var elementTimeUpdate_ = function () {
       console.log('elementTimeUpdate_', video.currentTime);
       }.bind(this);

       video.addEventListener('seeking', elementSeeking_);
       video.addEventListener('timeupdate', elementTimeUpdate_);

       video.src = window.URL.createObjectURL(mediaSource);
       }.bind(this));*/

      /*video = document.querySelector('video');

       player.on('enter', function (hash, peers) {
       $scope.$apply(function () {
       var pi;
       var pl = peers.length;
       var peer;

       for (pi = 0; pi < pl; ++pi) {
       peer = peers[pi];
       $scope.peers.push({
       'id': peer.id,
       'country': '',
       'progress': 0,
       'speed': 0
       });
       }
       });
       });

       player.on('leave', function (hash, id) {
       $scope.$apply(function () {
       var i;
       var l = $scope.peers.length;
       var peer;

       for (i = 0; i < l; ++i) {
       peer = $scope.peers[i];
       if (peer.id === id) {
       $scope.peers.splice(i, 1);
       break;
       }
       }
       });
       });*/
      /*prcl = new Peeracle();
       stream = prcl.bind(video);

       stream.on('connected', function (url, id) {
       });

       stream.on('peer', function (peer) {
       });*/

      $scope.$on('$destroy',
        function () {
          console.log('destroy');
          player.destroy();
        });
    }]);