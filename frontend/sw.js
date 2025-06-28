// إصدار ذاكرة التخزين المؤقت
const CACHE_NAME = 'voiceboom-v1';

// الملفات التي سيتم تخزينها مؤقتاً
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './profile.html',
  './game.html',
  './js/secureStorage.js',
  './js/soundManager.js',
  './game.js',
  './profile.js',
  './game-styles.css',
  './profile-styles.css',
  './box-styles.css',
  './mobile-optimization.css',
  './logo.png',
  './sounds/click.mp3',
  './sounds/win.mp3',
  './sounds/lose.mp3',
  './sounds/single_shot.mp3',
  './sounds/triple_shot.mp3',
  './sounds/hammer_shot.mp3',
  './sounds/MSG.mp3',
  './manifest.json'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('تم تثبيت Service Worker وتخزين الأصول في الذاكرة المؤقتة');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('فشل في تثبيت Service Worker:', error);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف الذاكرة المؤقتة القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  console.log('Service Worker مفعل');
  return self.clients.claim();
});

// استرجاع الطلبات من الذاكرة المؤقتة أو الشبكة
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات POST وطلبات الصفحات المختلفة
  if (event.request.method !== 'GET') return;
  
  // تجاهل طلبات الصوت والفيديو الكبيرة
  if (event.request.url.match(/\.(mp3|mp4|webm|ogg)$/)) {
    return;
  }

  // تجاهل الطلبات الخارجية (API calls)
  if (event.request.url.includes('/api/') || event.request.url.includes('onrender.com/health')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إرجاع الاستجابة من الذاكرة المؤقتة إذا كانت موجودة
        if (response) {
          return response;
        }

        // استرجاع من الشبكة
        return fetch(event.request).then((response) => {
          // التحقق من صحة الاستجابة
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // استنساخ الاستجابة
          const responseToCache = response.clone();

          // تخزين الاستجابة في الذاكرة المؤقتة
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // إرجاع صفحة غير متصل إذا فشل كل شيء
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./offline.html');
        }
      })
  );
});

// تحديث التطبيق تلقائياً عند توفر إصدار جديد
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// معالجة أخطاء الاتصال
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});
