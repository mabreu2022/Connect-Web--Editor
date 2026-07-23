const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const localZipPath = path.resolve(__dirname, '../tools.tar.gz');
const remoteZipPath = '/home/ubuntu/tools.tar.gz';
const targetDir = '/home/ubuntu/Projestos Antigravity/Gerador';

const config = {
  host: '45.225.129.86',
  port: 22,
  username: 'ubuntu',
  password: 'WWgcZtHU7eN6QVr9Usr7'
};

console.log('📡 Estabelecendo conexão SSH com a VPS...');

conn.on('ready', () => {
  console.log('✅ Conexão SSH estabelecida com sucesso.');
  
  // 1. Criar diretórios necessários
  console.log('📁 Criando diretórios na VPS...');
  conn.exec(`mkdir -p "${targetDir}"`, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code, signal) => {
      console.log('✅ Diretório alvo criado.');
      
      // 2. Iniciar Upload via SFTP
      console.log('📤 Inicializando envio do arquivo tools.zip...');
      conn.sftp((errSftp, sftp) => {
        if (errSftp) throw errSftp;
        
        sftp.fastPut(localZipPath, remoteZipPath, {}, (errPut) => {
          if (errPut) {
            console.error('❌ Falha ao enviar o arquivo zip:', errPut);
            conn.end();
            return;
          }
          console.log('✅ Upload concluído com sucesso.');
          
          // 3. Executar comandos de extração e instalação remota
          executeRemoteCommands();
        });
      });
    });
    stream.stdout.on('data', (d) => console.log('STDOUT: ' + d));
    stream.stderr.on('data', (d) => console.error('STDERR: ' + d));
  });
}).connect(config);

function executeRemoteCommands() {
  console.log('⚙️ Executando comandos de instalação e configuração na VPS...');
  
  // Script shell para extrair, copiar, configurar e rodar PM2
  const remoteScript = `
    echo "=== Extraindo tools.tar.gz ==="
    tar -xzf "/home/ubuntu/tools.tar.gz" -C "/home/ubuntu"
    
    echo "=== Copiando arquivos para pasta Gerador ==="
    cp -rf "/home/ubuntu/Tools/"* "${targetDir}/"
    rm -rf "/home/ubuntu/Tools"
    rm "/home/ubuntu/tools.tar.gz"
    
    cd "${targetDir}"
    
    echo "=== Instalando Dependências npm ==="
    npm install express cors node-firebird bcryptjs jsonwebtoken nodemailer qrcode multer socket.io socket.io-client faz-um-pix axios dotenv
    
    echo "=== Criando arquivo .env ==="
    cat <<EOT > .env
SAAS_MODE=true
PORT=3012
JWT_SECRET=gerador_lazarus_secret_key_2026
SMTP_USER=conectsolutions@hotmail.com
SMTP_PASS=Mmpa@2025
FB_PASSWORD=ZmrL9W79B48nUeUBOPK0
EOT

    echo "=== Inicializando Banco de Dados Firebird 5 ==="
    node database/initGeradorDb.cjs
    
    echo "=== Iniciando/Reiniciando no PM2 ==="
    pm2 delete gerador-saas 2>/dev/null || true
    pm2 start server-logs.js --name "gerador-saas" --update-env
    pm2 save
    
    echo "=== Status PM2 ==="
    pm2 status gerador-saas
  `;

  conn.exec(remoteScript, (err, stream) => {
    if (err) {
      console.error('❌ Falha ao executar script remoto:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log(`🎉 Processo de implantação finalizado. Código de saída: ${code}`);
      conn.end();
    });
    
    stream.stdout.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    stream.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}
