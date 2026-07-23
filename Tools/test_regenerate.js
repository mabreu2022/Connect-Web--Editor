import axios from 'axios';

const payload = {
    host: '127.0.0.1',
    port: '3050',
    database: 'C:\\Projetos Antigravity\\colaborarcrm\\DataBase\\BANCOCOLABORAR.FDB',
    user: 'SYSDBA',
    password: 'masterkey',
    selectedTables: [
        "ACOES", "AGENDA", "AGENDA_DETALHE", "AGENDA_TECNICOS", "ATIVOS", 
        "ATIVOS_CONTRATOS", "AUDITORIA", "CLIENTES", "COMPROMISSOS", "CONTATOS", 
        "CONTRATOS", "ENDERECOS_CLIENTE", "ESPECIALIDADES", "FORMAS_PAGAMENTO", 
        "LOG_ACESSO", "PAGAMENTOS", "PERFIS", "PERMISSOES", "STATUS", 
        "STATUS_CONTRATO", "STATUS_PAGAMENTO", "TECNICO_ESPECIALIDADES", 
        "TECNICOS", "TELEFONES_CLIENTE", "USUARIOS"
    ],
    templateId: 'modelo_erp_cyber_dark',
    projectName: 'SistemaERP',
    outputDir: 'C:\\Projetos Antigravity\\Gerador de Programas Lazarus\\sistemas_gerados'
};

console.log("Calling generate-project...");
axios.post('http://localhost:3002/api/generate-project', payload)
    .then(res => {
        console.log("SUCCESS:", res.data);
    })
    .catch(err => {
        console.error("FAILED:", err.response ? err.response.data : err.message);
    });
