var player = videojs('demo');

var heroBanner = document.createElement('div');
var heroBannerTemplate = document.querySelector('#heroBanner-template');
heroBanner.innerHTML = heroBannerTemplate.innerHTML;
heroBanner.className = 'videojs-hero-overlay transparent';

var overlay = document.createElement('div');
var overlayTemplate = document.querySelector('#peeracle-overlay-template');
overlay.innerHTML = overlayTemplate.innerHTML;
overlay.className = 'videojs-peeracle-overlay transparent';

player.el().appendChild(heroBanner);
player.el().appendChild(overlay);

$heroBanner = $(heroBanner);
$overlay = $(overlay);

setTimeout(function () {
  $heroBanner.removeClass('transparent');
}, 250);

player.on('play', function () {
  $heroBanner.addClass('transparent');
});

player.on('pause', function () {
  $heroBanner.removeClass('transparent');
});

/*player.on('mouseover', function () {
  if ($overlay.hasClass('transparent')) {
    $overlay.removeClass('transparent');
  }
});

player.on('mouseout', function () {
  if (!$overlay.hasClass('transparent')) {
    $overlay.addClass('transparent');
  }
});*/

function togglePlay() {
  if (player.paused()) {
    player.play();
  } else {
    player.pause();
  }
}

$heroBanner.click(togglePlay);
$overlay.click(togglePlay);
