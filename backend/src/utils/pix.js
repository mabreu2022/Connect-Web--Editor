const QRCode = require('qrcode');
const pix = require('faz-um-pix');

class PixGenerator {
    constructor(pixKey, merchantName, merchantCity, merchantCategoryCode = '8299') {
        this.pixKey = pixKey;
        this.merchantName = merchantName;
        this.merchantCity = merchantCity;
        this.merchantCategoryCode = merchantCategoryCode;
    }

    // Gera QR Code do PIX usando faz-um-pix
    async generateQRCode(amount, txid = '***') {
        try {
            console.log('🔧 Gerando PIX com faz-um-pix:');
            console.log('  Chave:', this.pixKey);
            console.log('  Nome:', this.merchantName);
            console.log('  Cidade:', this.merchantCity);
            console.log('  Valor:', amount);
            console.log('  TXID:', txid);

            const pixFunction = pix.Pix; 

            // Garantir que amount seja STRING com 2 casas decimais (Ex: "19.90")
            const amountStr = parseFloat(amount).toFixed(2);

            let formattedKey = this.pixKey;

            // Garantir +55 para celular
            let cleanKey = formattedKey.replace(/\D/g, '');
            if (cleanKey.length >= 10 && !formattedKey.startsWith('+')) {
                if (formattedKey.startsWith('55') && (formattedKey.length === 12 || formattedKey.length === 13)) {
                    formattedKey = '+' + formattedKey;
                } else if (cleanKey.startsWith('55') && (cleanKey.length === 12 || cleanKey.length === 13)) {
                    formattedKey = '+' + cleanKey;
                }
            }

            // Tratamento de Cidade e Nome
            const formattedCity = this.merchantCity
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .substring(0, 15);

            const formattedName = this.merchantName
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            const description = '';

            // Chamada da lib: Pix(chave, nome, cidade, valor, txid, qr)
            const payload = await pixFunction(formattedKey, formattedName, formattedCity, amountStr, description, false);

            console.log('📝 Código PIX gerado:', payload);

            // Gerar QR Code (Imagem)
            const qrCodeDataURL = await QRCode.toDataURL(payload, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 300,
                margin: 1
            });

            return {
                payload: payload, // Código Copia e Cola
                qrCode: qrCodeDataURL // Imagem Base64
            };

        } catch (err) {
            console.error('❌ Erro na lib faz-um-pix:', err);
            throw new Error('Erro ao gerar QR Code: ' + err.message);
        }
    }
}

module.exports = PixGenerator;
