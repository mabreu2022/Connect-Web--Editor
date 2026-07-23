import QRCode from 'qrcode';
import pix from 'faz-um-pix';

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

            const pixFunction = pix.Pix; // A lib exporta { Pix: func }
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

            console.log('🔧 PIX Payload Debug:');
            console.log('  Chave:', formattedKey);
            console.log('  Nome:', formattedName);
            console.log('  Cidade:', formattedCity);
            console.log('  Valor:', amountStr);
            console.log('  Payload:', payload);

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

export default PixGenerator;
