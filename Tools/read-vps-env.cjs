const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '45.225.129.86',
  port: 22,
  username: 'ubuntu',
  password: 'WWgcZtHU7eN6QVr9Usr7'
};

console.log('📡 Conectando ao SSH da VPS para ler variáveis do editor...');

conn.on('ready', () => {
  console.log('✅ Conexão SSH estabelecida.');
  
  // Ler o .env do backend do editor
  const cmd = 'cat "/home/ubuntu/Projestos Antigravity/Connect Web  Editor/backend/.env" || cat "/home/ubuntu/Projestos Antigravity/Connect Web  Editor/.env" || echo "Sem arquivo .env encontrado"';
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', () => conn.end());
    stream.stdout.on('data', (d) => console.log(d.toString()));
    stream.stderr.on('data', (d) => console.error(d.toString()));
  });
}).connect(config);
