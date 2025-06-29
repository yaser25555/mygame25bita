# تحديث CORS في Backend

## في كود الـ Backend على Render، ابحث عن:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://mygame25bita-1-4ue6.onrender.com'
  ]
}));
```

## واستبدله بـ:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://infinity-box25.netlify.app',  // النطاق الجديد
    'https://mygame25bita-1-4ue6.onrender.com'
  ]
}));
```

## إذا اشتريت نطاق مخصص، أضفه أيضاً:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://infinity-box25.netlify.app',
    'https://infinitybox.com',  // النطاق المخصص
    'https://mygame25bita-1-4ue6.onrender.com'
  ]
}));
```

## بعد التحديث:
1. احفظ الملف
2. انتظر إعادة النشر التلقائي على Render
3. اختبر الموقع مرة أخرى