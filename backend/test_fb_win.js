const Firebird = require('node-firebird');
const options = {
    host: '127.0.0.1',
    port: 3050,
    database: 'C:\\Projetos Antigravity\\colaborarcrm\\DataBase\\BANCOCOLABORAR.FDB',
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
        const sql = `
            SELECT 
              TRIM(RF.RDB$RELATION_NAME) AS TABLE_NAME,
              TRIM(RF.RDB$FIELD_NAME) AS FIELD_NAME, 
              COALESCE(RF.RDB$NULL_FLAG, 0) AS NOT_NULL, 
              F.RDB$FIELD_TYPE AS FIELD_TYPE, 
              COALESCE(F.RDB$FIELD_LENGTH, 0) AS FIELD_LENGTH, 
              COALESCE(F.RDB$FIELD_PRECISION, 0) AS FIELD_PRECISION, 
              COALESCE(F.RDB$FIELD_SCALE, 0) AS FIELD_SCALE, 
              COALESCE(F.RDB$FIELD_SUB_TYPE, 0) AS FIELD_SUB_TYPE, 
              RF.RDB$FIELD_POSITION AS FIELD_POSITION 
            FROM RDB$RELATION_FIELDS RF 
            JOIN RDB$FIELDS F ON F.RDB$FIELD_NAME = RF.RDB$FIELD_SOURCE 
            WHERE TRIM(RF.RDB$RELATION_NAME) = 'ACOES'
            ORDER BY RF.RDB$RELATION_NAME, RF.RDB$FIELD_POSITION
        `;
        db.query(sql, (err, rows) => {
            if (err) {
                console.log('Query failed:', err.message);
            } else {
                console.log('Fields found:', rows);
            }
            db.detach();
        });
    }
});
