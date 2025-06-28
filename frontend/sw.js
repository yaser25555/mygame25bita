// إصدار ذاكرة التخزين المؤقت
const CACHE_NAME = 'voiceboom-v4';

// الملفات التي سيتم تخزينها مؤقتاً
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/profile.html',
  '/game.html',
  '/trading.html',
  '/gifts.html',
  '/shield.html',
  '/admin.html',
  '/styles.css',
  '/profile-styles.css',
  '/game-styles.css',
  '/trading-styles.css',
  '/gifts-styles.css',
  '/shield-styles.css',
  '/admin-styles.css',
  '/login-styles.css',
  '/mobile-optimization.css',
  '/js/secureStorage.js',
  '/js/soundManager.js',
  '/navigation.js',
  '/profile.js',
  '/game.js',
  '/trading.js',
  '/gifts.js',
  '/shield.js',
  '/admin.js',
  '/login.js',
  '/achievement-system.js',
  '/daily-quests.js',
  '/notification-system.js',
  '/socket.io.min.js',
  '/images/logo.png',
  '/images/logo1.png',
  '/images/logo2.png',
  '/images/hero.png',
  '/images/coin.png',
  '/images/box_closed.png',
  '/images/default-avatar.png',
  '/images/default-cover.jpg',
  '/images/background_image.jpg',
  '/sounds/MSG.mp3',
  '/sounds/hammer_shot.mp3',
  '/sounds/single_shot.mp3',
  '/sounds/triple_shot.mp3',
  '/sounds/click.mp3',
  '/sounds/win.mp3',
  '/sounds/lose.mp3',
  '/sounds/music.mp3',
  '/sounds/strike_music.mp3',
  '/favicon.ico',
  '/manifest.json'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('تم تثبيت Service Worker وتخزين الأصول في الذاكرة المؤقتة');
        // إضافة الملفات واحداً تلو الآخر لتجنب فشل addAll
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => 
            cache.add(url).catch(error => {
              console.warn(`فشل في تخزين ${url}:`, error);
              return null; // تجاهل الأخطاء
            })
          )
        );
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

// معالجة طلبات الشبكة
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات API لتجنب مشاكل CORS
  if (event.request.url.includes('/api/') || event.request.url.includes('socket.io')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إرجاع الملف من الذاكرة المؤقتة إذا كان موجوداً
        if (response) {
          return response;
        }

        // محاولة جلب الملف من الشبكة
        return fetch(event.request)
          .then((response) => {
            // التحقق من أن الاستجابة صالحة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // نسخ الاستجابة لتخزينها مؤقتاً
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.warn('فشل في تخزين الملف مؤقتاً:', error);
              });

            return response;
          })
          .catch((error) => {
            console.warn('فشل في جلب الملف من الشبكة:', error);
            // إرجاع صفحة offline إذا كانت متوفرة
            return caches.match('/offline.html');
          });
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
