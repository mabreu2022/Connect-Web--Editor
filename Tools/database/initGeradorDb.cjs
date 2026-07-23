const Firebird = require('node-firebird');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Carregar variáveis do arquivo .env no diretório pai
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbPath = path.resolve(__dirname, 'GERADOR_SAAS.FDB');
const sqlPath = path.resolve(__dirname, 'saas_schema.sql');

const options = {
  host: process.env.FB_HOST || '127.0.0.1',
  port: parseInt(process.env.FB_PORT || '3050', 10),
  database: dbPath,
  user: process.env.FB_USER || 'SYSDBA',
  password: process.env.FB_PASSWORD || 'masterkey',
  lowercase_keys: true,
  role: null,
  pageSize: 16384,
  charset: 'UTF8'
};

console.log('🏁 Iniciando criação do banco de dados do Gerador SaaS...');
console.log('📁 Destino:', dbPath);

// Se o arquivo do banco já existir, removemos para recriar do zero
if (fs.existsSync(dbPath)) {
  console.log('⚠️ Arquivo antigo encontrado, removendo...');
  try {
    fs.unlinkSync(dbPath);
  } catch (err) {
    console.error('❌ Falha ao excluir o banco existente:', err.message);
    console.log('Por favor, certifique-se de que nenhum processo (como o PM2 ou o ISQL) está bloqueando o arquivo.');
    process.exit(1);
  }
}

// 1. Criar Banco de Dados FDB físico
Firebird.create(options, async function (err, db) {
  if (err) {
    console.error('❌ Erro catastrófico ao criar banco físico:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Banco de dados FDB criado física e logicamente.');

  try {
    // 2. Ler e limpar comentários do DDL
    const ddlContent = fs.readFileSync(sqlPath, 'utf8');
    const cleanedDDL = ddlContent.replace(/\/\*[\s\S]*?\*\//g, ''); // Limpa comentários
    
    // Dividir os blocos de comandos por ponto e vírgula
    const ddlStatements = cleanedDDL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`🔌 Executando ${ddlStatements.length} instruções DDL de estrutura...`);

    // Rodar cada DDL sequencialmente na conexão aberta
    for (const sql of ddlStatements) {
      await new Promise((resolve, reject) => {
        db.query(sql, (errQuery) => {
          if (errQuery) {
            console.error(`❌ Erro no DDL: ${sql.substring(0, 50)}...`);
            reject(errQuery);
          } else {
            resolve();
          }
        });
      });
    }
    console.log('✅ Estrutura de tabelas criada com sucesso.');

    // 3. Cadastrar Administrador Padrão
    const hashSenha = await bcrypt.hash('Mmpa@2025', 10);
    const sqlAdmin = `
      INSERT INTO TB_USUARIOS (USU_ID, USU_NOME, USU_EMAIL, USU_SENHA, USU_IS_ADMIN, USU_STATUS)
      VALUES (NEXT VALUE FOR SEQ_USUARIOS, 'Connect Admin', 'conectsolutions@hotmail.com', ?, 1, 1)
    `;

    await new Promise((resolve, reject) => {
      db.query(sqlAdmin, [hashSenha], (errIns) => {
        if (errIns) reject(errIns);
        else resolve();
      });
    });
    console.log('✅ Administrador padrão semeado com sucesso.');

    // 4. Semear configurações de Pix Padrão
    const configs = [
      ['VALOR_DIARIA', '10.00'],
      ['PIX_CHAVE', '+5511945457934'],
      ['PIX_NOME', 'Connect Solutions Ltda'],
      ['PIX_CIDADE', 'Blumenau']
    ];

    for (const [chave, valor] of configs) {
      await new Promise((resolve, reject) => {
        db.query('INSERT INTO TB_CONFIG (CFG_CHAVE, CFG_VALOR) VALUES (?, ?)', [chave, valor], (errConfig) => {
          if (errConfig) reject(errConfig);
          else resolve();
        });
      });
    }
    console.log('✅ Configurações Pix semeadas.');

    // Desconectar
    db.detach();
    console.log('🎉 Inicialização do banco concluída com sucesso!');
    process.exit(0);

  } catch (ex) {
    console.error('❌ Falha na execução do DDL/Seeds:', ex.message);
    db.detach();
    process.exit(1);
  }
});
