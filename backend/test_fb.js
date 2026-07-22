const Firebird = require('node-firebird');
const options = {
    host: '127.0.0.1',
    port: 3050,
    database: '/home/ubuntu/Projestos Antigravity/Connect Web  Editor/database/CONNECTWEBEDITOR.FDB',
    user: 'SYSDBA',
    password: 'masterkey',
    lowercase_keys: true,
    charset: 'UTF8'
};
Firebird.attach(options, (err, db) => {
    if (err) {
        console.log('MASTERKEY FAILED:', err.message);
        options.password = 'ZmrL9W79B48nUeUBOPK0';
        Firebird.attach(options, (err2, db2) => {
            if (err2) {
                console.log('ZmrL9W79B48nUeUBOPK0 FAILED:', err2.message);
            } else {
                console.log('ZmrL9W79B48nUeUBOPK0 SUCCEEDED!');
                db2.detach();
            }
        });
    } else {
        console.log('MASTERKEY SUCCEEDED!');
        db.detach();
    }
});
