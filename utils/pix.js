const QRCode = require('qrcode');
const pix = require('faz-um-pix');

class PixGenerator {
    constructor(pixKey, merchantName, merchantCity, merchantCategoryCode = '8299') {
        this.pixKey = pixKey;
        this.merchantName = merchantName;
        this.merchantCity = merchantCity;
        this.merchantCategoryCode = merchantCategoryCode; // A lib faz-um-pix pode não usar isso diretamente ou ter padrão
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
            console.log('  MCC (Ignorado pela lib, usa padrão 0000/geral geralmente):', this.merchantCategoryCode);

            // Assinatura descoberta: Pix(merchant_account, merchant_name, merchant_city, transaction_amount, info_adic, return_qrcode)
            // A lib hardcoded o TXID (Field 62) como ***
            // O argumento info_adic vai para Field 26/02 (Descrição). Vamos deixar vazio para igualar exemplo do usuário.

            const pixFunction = pix.Pix; // A lib exporta { Pix: func }

            // Garantir que amount seja STRING com 2 casas decimais (Ex: "197.00")
            // A lib usa o valor como string. Se passar numero 197, vira "197" e pode dar erro em validar
            const amountStr = parseFloat(amount).toFixed(2);

            // Tratamento de chave: Remover + se a lib não esperar, ou manter
            // A lib apenas calcula tamanho, então +55 está ok.
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

            // Tratamento de Cidade e Nome para IGUALAR ao exemplo funcional
            // Cidade: Max 15 chars, permite espaços, sem acentos
            const formattedCity = this.merchantCity
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .substring(0, 15); // Corte exato do exemplo (Sao Bernardo do)

            // Nome: Sem acentos, mantendo Upper/Lower original
            const formattedName = this.merchantName
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // Descrição (info_adic) vazia para não alterar Field 26
            const description = '';

            // Chamada da lib: Pix(chave, nome, cidade, valor, txid, qr)
            const payload = await pixFunction(formattedKey, formattedName, formattedCity, amountStr, description, false);

            console.log('🔧 PIX Payload Debug:');
            console.log('  Chave:', formattedKey);
            console.log('  Nome:', formattedName);
            console.log('  Cidade:', formattedCity);
            console.log('  Valor:', amountStr);

            console.log('📝 Código PIX gerado (faz-um-pix):', payload);

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
