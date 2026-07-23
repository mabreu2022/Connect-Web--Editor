import 'dotenv/config';
import Firebird from 'node-firebird';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database', 'GERADOR_SAAS.FDB');

const options = {
  host: process.env.FB_HOST || '127.0.0.1',
  port: parseInt(process.env.FB_PORT || '3050', 10),
  database: dbPath,
  user: process.env.FB_USER || 'SYSDBA',
  password: process.env.FB_PASSWORD || 'masterkey',
  lowercase_keys: true,
  charset: 'UTF8'
};

const pool = Firebird.pool(10, options);

// Helper para ler campos Blob de forma assíncrona
export function readBlobField(blob) {
  return new Promise((resolve, reject) => {
    if (!blob || typeof blob !== 'function') {
      return resolve(blob);
    }
    blob((err, name, e) => {
      if (err) return reject(err);
      let data = '';
      e.on('data', (chunk) => {
        data += chunk.toString('utf8');
      });
      e.on('end', () => {
        resolve(data);
      });
      e.on('error', (blobErr) => {
        reject(blobErr);
      });
    });
  });
}

// Helper para varrer as linhas e resolver quaisquer Blobs encontrados
export async function resolveBlobsInRows(rows) {
  if (!rows || !Array.isArray(rows)) return rows;
  for (let row of rows) {
    for (let key in row) {
      if (typeof row[key] === 'function') {
        row[key] = await readBlobField(row[key]);
      }
    }
  }
  return rows;
}

// Executar uma consulta SELECT que retorna linhas
export function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.get(async (err, db) => {
      if (err) {
        return reject(new Error('Erro ao conectar ao pool do Firebird: ' + err.message));
      }
      db.query(sql, params, async (errQuery, result) => {
        db.detach();
        if (errQuery) {
          return reject(errQuery);
        }
        try {
          const resolved = await resolveBlobsInRows(result);
          resolve(resolved);
        } catch (blobErr) {
          reject(blobErr);
        }
      });
    });
  });
}

// Executar INSERT, UPDATE, DELETE
export function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.get((err, db) => {
      if (err) {
        return reject(new Error('Erro ao conectar ao pool do Firebird: ' + err.message));
      }
      db.query(sql, params, (errQuery, result) => {
        db.detach();
        if (errQuery) {
          return reject(errQuery);
        }
        resolve(result);
      });
    });
  });
}

// Executar transações
export function transaction(callback) {
  return new Promise((resolve, reject) => {
    pool.get((err, db) => {
      if (err) return reject(err);

      db.transaction(Firebird.ISOLATION_READ_COMMITTED, async (errTrans, trans) => {
        if (errTrans) {
          db.detach();
          return reject(errTrans);
        }

        const transWrapper = {
          execute: (sql, params = []) => {
            return new Promise((res, rej) => {
              trans.query(sql, params, (errQuery, result) => {
                if (errQuery) rej(errQuery);
                else res(result);
              });
            });
          },
          query: (sql, params = []) => {
            return new Promise((res, rej) => {
              trans.query(sql, params, async (errQuery, result) => {
                if (errQuery) rej(errQuery);
                else {
                  try {
                    const resolved = await resolveBlobsInRows(result);
                    res(resolved);
                  } catch (e) {
                    rej(e);
                  }
                }
              });
            });
          }
        };

        try {
          await callback(transWrapper);
          trans.commit((commitErr) => {
            db.detach();
            if (commitErr) reject(commitErr);
            else resolve();
          });
        } catch (execErr) {
          trans.rollback(() => {
            db.detach();
            reject(execErr);
          });
        }
      });
    });
  });
}
