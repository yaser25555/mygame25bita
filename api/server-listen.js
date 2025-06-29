const { httpServer, PORT } = require('./index');

// تشغيل الخادم على المنفذ المحدد في PORT
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server is ready for connections`);
  console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
});

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
