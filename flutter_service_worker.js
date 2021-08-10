'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "f3a8bb5e99ef5cf759cb78bd2a329f77",
"assets/assets/google_fonts/OFL.txt": "e3a1cc2721b8b8b106d53b45d4e608c0",
"assets/assets/google_fonts/README.txt": "77ef82952125c0e819878c59044da8a4",
"assets/assets/google_fonts/WorkSans-Black.ttf": "1446e4f15dc4b7f83535267c78d35c3c",
"assets/assets/google_fonts/WorkSans-BlackItalic.ttf": "4236a703173354e1c6291e248bfe6f6b",
"assets/assets/google_fonts/WorkSans-Bold.ttf": "a0bf66dd6fc75494a0a51f7662a99c41",
"assets/assets/google_fonts/WorkSans-BoldItalic.ttf": "dbb1fc6dc788cbf11a0659d47ce49ffe",
"assets/assets/google_fonts/WorkSans-Light.ttf": "526a15477e60abaa9e94be1700a7423f",
"assets/assets/google_fonts/WorkSans-LightItalic.ttf": "03014407b8776ee3e9b2f9ece1909904",
"assets/assets/google_fonts/WorkSans-Regular.ttf": "6f916ce8ada5d5facf5ad4e1266a486d",
"assets/assets/init/rikdata_export_config.txt": "0467712f060ed913b57dfd195aa7f0a0",
"assets/assets/init/rikdata_export_d365bc_config.txt": "b71232a031cf0042251fbdb77c4bc6f0",
"assets/assets/init/rikdata_export_d365_config.txt": "37dadd16044d79299fafb56f99c570aa",
"assets/assets/init/rikdata_export_ebs_config.txt": "2d0a04b052067f407128a8f3f26a1bb9",
"assets/assets/init/rikdata_export_local_config.txt": "f932e95db884b681f8797321c071d92d",
"assets/assets/init/rikdata_export_oracle_config.txt": "2aa82d47619f7c26e985cac94e86ca49",
"assets/assets/init/rikdata_export_sap_config.txt": "fc2d1eb68f215fa12c603ffc705fd7d2",
"assets/assets/init/rikdata_export_snow_config.txt": "be2f4f91dc3c8b53fdee133842752d39",
"assets/assets/js/js_methods.js": "d8b4c3d24ecde41b4f3092d8832d78bb",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/NOTICES": "a8ad36dbd01530242039c2fa4da0c91b",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"favicon.png": "34dbc305675d723bd9c79dd0f64b8901",
"icons/Icon-192.png": "b083984443195a7ca624fa7b79a095f1",
"icons/Icon-512.png": "a8aba57f3bd9b2a6e9e173f227d4fee0",
"index.html": "e9041627aabe42a290ed455434d9539c",
"/": "e9041627aabe42a290ed455434d9539c",
"main.dart.js": "49f0bf640ce0d3b0eecaec9b8a452a7c",
"manifest.json": "d1d95ae979225d33a891a53e32eb1b74",
"version.json": "920bb654ff24e139a533f0bc1f921cd8"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
