var ImageLoader = (function() {
  var instance = function() { };

  var images = {};
  var loadingCount = 0;

  function finishedLoading(url, image, callback)
  {
    var size = 1;
    while(image.width > size || image.height > size) {
      size *= 2;
    }
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height, 0, 0, size, size);

    loadingCount--;
    images[url] = canvas;

    if (!isLoading()) {
      callback();
    }
  };

  function isLoading()
  {
    return loadingCount > 0;
  }

  instance.prototype.images = function(url) {
    if (url) {
      return images[url];
    } else {
      return images;
    }
  };

  instance.prototype.load = function(urls, callback) {
    if (typeof urls == 'string') {
      urls = [ urls ];
    }

    for (var i = 0; i < urls.length; i++) {
      var url = urls[i];

      if (!images[url]) {
        images[url] = true;
        loadingCount++;

        var img = document.createElement("img");
        img._url = url;
        img.onload = function(e) {
          finishedLoading(e.srcElement._url, e.srcElement, callback);
        };
        img.src = url;
      }
    }
  };

  instance.prototype.isLoading = function() {
    return isLoading();
  };

  return instance;
})();
