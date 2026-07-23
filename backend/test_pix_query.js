const db = require('./src/db/firebird');
const PixGenerator = require('./src/utils/pix');

async function test() {
  try {
    const rows = await db.query("SELECT CFG_CHAVE, CFG_VALOR FROM TB_CONFIG WHERE CFG_CHAVE IN ('PIX_CHAVE', 'PIX_NOME', 'PIX_CIDADE')");
    console.log('Query result rows:', rows);
    
    let chavePix = '';
    let nomeRecebedor = 'Connect Web Editor';
    let cidadeRecebedor = 'Sao Paulo';

    rows.forEach(r => {
      const k = (r.cfg_chave || r.CFG_CHAVE || '').toUpperCase();
      const v = r.cfg_valor || r.CFG_VALOR || '';
      console.log(`Normalizing: ${k} = ${v}`);
      if (k === 'PIX_CHAVE') chavePix = v;
      if (k === 'PIX_NOME') nomeRecebedor = v;
      if (k === 'PIX_CIDADE') cidadeRecebedor = v;
    });

    console.log('Chave Pix:', chavePix);
    console.log('Nome Recebedor:', nomeRecebedor);
    console.log('Cidade Recebedor:', cidadeRecebedor);

    if (chavePix) {
      const generator = new PixGenerator(chavePix, nomeRecebedor, cidadeRecebedor);
      const res = await generator.generateQRCode(19.90, 'TESTE123');
      console.log('Pix Copia e Cola:', res.payload);
      console.log('QR Code generated length:', res.qrCode?.length);
    } else {
      console.log('Nenhuma chave Pix encontrada no banco!');
    }
  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    process.exit(0);
  }
}

test();
