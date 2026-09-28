let app;
try {
  app = require('../server.js');
  // যদি server.js সরাসরি app export না করে, তাহলে fallback
  if (typeof app !== 'function' && app && app.default) app = app.default;
} catch(e) {
  const express = require('express');
  app = express();
  app.get('/', (req,res)=> res.send('PROJECT SUROKKHA-X LIVE - www.projectsurokkhax.com'));
}
module.exports = app;
