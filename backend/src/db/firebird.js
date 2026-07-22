const Firebird = require('node-firebird');

function getOptions() {
  return {
    host: process.env.FB_HOST || 'localhost',
    port: parseInt(process.env.FB_PORT) || 3050,
    database: process.env.FB_DATABASE || 'C:/Projetos Antigravity/Connect Web  Editor/database/CONNECTWEBEDITOR.FDB',
    user: process.env.FB_USER || 'SYSDBA',
    password: process.env.FB_PASSWORD || 'masterkey',
    lowercase_keys: true,
    role: null,
    pageSize: 4096,
    charset: 'UTF8'
  };
}

let pool = Firebird.pool(5, getOptions());

function getPool() {
  if (!pool) {
    pool = Firebird.pool(5, getOptions());
  }
  return pool;
}

function readBlobField(blobFn) {
  return new Promise((resolve) => {
    if (typeof blobFn !== 'function') return resolve(blobFn);
    blobFn((err, name, stream) => {
      if (err || !stream) return resolve(null);
      let chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => {
        try {
          resolve(Buffer.concat(chunks).toString('utf8'));
        } catch (e) {
          resolve(null);
        }
      });
      stream.on('error', () => resolve(null));
    });
  });
}

async function resolveBlobsInRows(rows) {
  if (!Array.isArray(rows)) return rows;
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    for (const key of Object.keys(row)) {
      if (typeof row[key] === 'function') {
        row[key] = await readBlobField(row[key]);
      }
    }
  }
  return rows;
}

/**
 * Executa uma query e retorna os resultados como array de objetos
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.get((err, db) => {
      if (err) return reject(new Error('Erro ao obter conexão: ' + err.message));
      db.query(sql, params, async (err, result) => {
        db.detach();
        if (err) return reject(new Error('Erro na query: ' + err.message));
        try {
          const resolved = await resolveBlobsInRows(result || []);
          resolve(resolved);
        } catch (blobErr) {
          resolve(result || []);
        }
      });
    });
  });
}

/**
 * Executa INSERT/UPDATE/DELETE e retorna resultado
 */
function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.get((err, db) => {
      if (err) return reject(new Error('Erro ao obter conexão: ' + err.message));
      db.execute(sql, params, (err, result) => {
        db.detach();
        if (err) return reject(new Error('Erro ao executar: ' + err.message));
        resolve(result);
      });
    });
  });
}

/**
 * Executa dentro de uma transação - garante atomicidade
 */
function transaction(callback) {
  return new Promise((resolve, reject) => {
    pool.get((err, db) => {
      if (err) return reject(err);
      db.transaction(Firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
        if (err) { db.detach(); return reject(err); }
        callback(transaction)
          .then(result => {
            transaction.commit(commitErr => {
              db.detach();
              if (commitErr) return reject(commitErr);
              resolve(result);
            });
          })
          .catch(cbErr => {
            transaction.rollback(() => { db.detach(); reject(cbErr); });
          });
      });
    });
  });
}

module.exports = { query, execute, transaction };
