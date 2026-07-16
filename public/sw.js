const CACHE_NAME = 'kansen-kiroku-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigation =
    event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // HTML(アプリの土台)は「まず最新を取りに行き、失敗した時だけキャッシュ」にする。
    // ここをstale-while-revalidateにすると、デプロイ直後の初回アクセスで必ず
    // 古い画面が一瞬表示されてしまい、「直したのに反映されない」混乱の元になるため。
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(event.request)))
    );
    return;
  }

  // JS/CSS/画像などはファイル名にハッシュが付いており、内容が変われば
  // URLごと変わるため、古いキャッシュが表示され続ける心配がない。
  // 即座にキャッシュを返しつつ裏側で最新を取得する(stale-while-revalidate)。
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      event.waitUntil(fetchPromise);
      return cached || fetchPromise;
    })
  );
});
