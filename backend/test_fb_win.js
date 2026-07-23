const Firebird = require('node-firebird');
const options = {
    host: '127.0.0.1',
    port: 3050,
    database: 'c:\\Projetos Antigravity\\Connect Web  Editor\\database\\CONNECTWEBEDITOR.FDB',
    user: 'SYSDBA',
    password: 'masterkey',
    lowercase_keys: true,
    charset: 'UTF8'
};
Firebird.attach(options, (err, db) => {
    if (err) {
        console.log('FAILED:', err.message);
    } else {
        console.log('SUCCEEDED!');
        db.query('SELECT rdb$relation_name FROM rdb$relations WHERE rdb$system_flag = 0', (err, rows) => {
            if (err) {
                console.log('Query failed:', err.message);
            } else {
                console.log('Tables found:', rows.map(r => r.rdb$relation_name.trim()));
            }
            db.detach();
        });
    }
});
