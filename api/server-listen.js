const { httpServer, PORT } = require('./index');

// تشغيل الخادم على المنفذ المحدد في PORT
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
