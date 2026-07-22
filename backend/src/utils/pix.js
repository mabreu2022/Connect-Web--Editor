const QRCode = require('qrcode');
const pix = require('faz-um-pix');

class PixGenerator {
    constructor(pixKey, merchantName = 'Connect Web Editor', merchantCity = 'Sao Paulo', merchantCategoryCode = '8299') {
        this.pixKey = pixKey;
        this.merchantName = merchantName;
        this.merchantCity = merchantCity;
        this.merchantCategoryCode = merchantCategoryCode;
    }

    async generateQRCode(amount, txid = '***') {
        try {
            const pixFunction = pix.Pix;
            const amountStr = parseFloat(amount).toFixed(2);
            let formattedKey = this.pixKey;

            let cleanKey = formattedKey.replace(/\D/g, '');
            if (cleanKey.length >= 10 && !formattedKey.startsWith('+')) {
                if (formattedKey.startsWith('55') && (formattedKey.length === 12 || formattedKey.length === 13)) {
                    formattedKey = '+' + formattedKey;
                } else if (cleanKey.startsWith('55') && (cleanKey.length === 12 || cleanKey.length === 13)) {
                    formattedKey = '+' + cleanKey;
                }
            }

            const formattedCity = this.merchantCity
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .substring(0, 15);

            const formattedName = this.merchantName
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            const description = '';

            const payload = await pixFunction(formattedKey, formattedName, formattedCity, amountStr, description, false);

            const qrCodeDataURL = await QRCode.toDataURL(payload, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 320,
                margin: 1
            });

            return {
                payload: payload,
                qrCode: qrCodeDataURL
            };
        } catch (err) {
            console.error('❌ Erro na lib faz-um-pix:', err);
            throw new Error('Erro ao gerar QR Code: ' + err.message);
        }
    }
}

module.exports = PixGenerator;
