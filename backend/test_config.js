require('dotenv').config();
const db = require('./src/db/firebird');
db.query("SELECT * FROM TB_CONFIG")
  .then(res => {
    console.log('TB_CONFIG ROWS:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
  });
