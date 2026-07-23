import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import Firebird from 'node-firebird';

// Configuração de diretórios para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Permite que a API receba blocos de texto grandes (o código fonte)
app.use(express.json({ limit: '10mb' })); 

// Servir arquivos estáticos do diretório atual (Tools) para evitar restrições de segurança do protocolo file://
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

const logPath = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Ollama', 'server.log') : path.join(__dirname, 'server.log');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

function autoCorrectPath(originalPath) {
    if (!originalPath) return originalPath;
    let cleaned = originalPath.trim();
    if (fs.existsSync(cleaned)) return cleaned;
    
    // Tenta corrigir espaço duplo em "Connect Web Editor"
    const corrected = cleaned.replace(/Connect Web Editor/g, 'Connect Web  Editor');
    if (fs.existsSync(corrected)) {
        return corrected;
    }
    return cleaned;
}

// ==========================================
// FUNÇÕES UTILITÁRIAS DE PARSING & MAPS (uTypes.pas)
// ==========================================
function toPascalCase(str) {
    if (!str) return '';
    return str.split('_').map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join('');
}

function toCamelCase(str) {
    const pascal = toPascalCase(str);
    if (!pascal) return '';
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function getTipoCampo(f) {
    const typeCode = f.tipo_codigo;
    const subType = f.sub_tipo;
    const scale = f.escala;
    const precision = f.precisao;

    switch (typeCode) {
        case 7: // SMALLINT
            if (precision > 0 && scale < 0) return 'tcCurrency';
            return 'tcInteger';
        case 8: // INTEGER
            if (precision > 0 && scale < 0) return 'tcCurrency';
            return 'tcInteger';
        case 16: // BIGINT
            if (precision > 0 && scale < 0) return 'tcCurrency';
            return 'tcInt64';
        case 10: // FLOAT
        case 27: // DOUBLE PRECISION
            return 'tcDouble';
        case 12: // DATE
            return 'tcDate';
        case 13: // TIME
            return 'tcTime';
        case 35: // TIMESTAMP
            return 'tcDateTime';
        case 14: // CHAR
        case 37: // VARCHAR
            return 'tcString';
        case 23: // BOOLEAN
            return 'tcBoolean';
        case 261: // BLOB
            if (subType === 1) return 'tcBlobText';
            return 'tcBlob';
        default:
            return 'tcDesconhecido';
    }
}

function tipoCampoToPascal(tipo) {
    switch (tipo) {
        case 'tcInteger': return 'Integer';
        case 'tcInt64': return 'Int64';
        case 'tcDouble': return 'Double';
        case 'tcCurrency': return 'Currency';
        case 'tcString': return 'string';
        case 'tcDate': return 'TDate';
        case 'tcTime': return 'TTime';
        case 'tcDateTime': return 'TDateTime';
        case 'tcBoolean': return 'Boolean';
        case 'tcBlob': return 'TBytes';
        case 'tcBlobText': return 'string';
        default: return 'Variant';
    }
}

function tipoCampoToComponent(tipo) {
    switch (tipo) {
        case 'tcInteger': return 'TEdit';
        case 'tcInt64': return 'TEdit';
        case 'tcDouble': return 'TEdit';
        case 'tcCurrency': return 'TEdit';
        case 'tcString': return 'TEdit';
        case 'tcDate': return 'TDateTimePicker';
        case 'tcTime': return 'TDateTimePicker';
        case 'tcDateTime': return 'TDateTimePicker';
        case 'tcBoolean': return 'TCheckBox';
        case 'tcBlob': return 'TEdit';
        case 'tcBlobText': return 'TMemo';
        default: return 'TEdit';
    }
}

function getTipoFirebirdStr(f) {
    switch (f.tipo_codigo) {
        case 7: return 'SMALLINT';
        case 8: return 'INTEGER';
        case 16: return 'BIGINT';
        case 10: return 'FLOAT';
        case 27: return 'DOUBLE PRECISION';
        case 12: return 'DATE';
        case 13: return 'TIME';
        case 35: return 'TIMESTAMP';
        case 14: return 'CHAR';
        case 37: return 'VARCHAR';
        case 23: return 'BOOLEAN';
        case 261: return f.sub_tipo === 1 ? 'BLOB TEXT' : 'BLOB';
        default: return 'UNKNOWN';
    }
}

function gerarCaption(name) {
    if (!name) return '';
    return name.split('_').map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

// ==========================================
// ROTA 1: Logs do Servidor Ollama
// ==========================================
app.get('/api/logs', (req, res) => {
    try {
        if (!fs.existsSync(logPath)) return res.status(404).json({ logs: ["Arquivo não encontrado."] });
        const stats = fs.statSync(logPath);
        const readSize = Math.min(stats.size, 5000); 
        const buffer = Buffer.alloc(readSize);
        const fd = fs.openSync(logPath, 'r');
        fs.readSync(fd, buffer, 0, readSize, stats.size - readSize);
        fs.closeSync(fd);
        let lines = buffer.toString('utf8').split('\n');
        res.json({ logs: lines.slice(-15).filter(l => l.trim() !== "") });
    } catch (error) {
        res.status(500).json({ logs: ["Erro: " + error.message] });
    }
});

let isGpuAvailable = true;
let nvidiaSmiPath = null;

function locateNvidiaSmi() {
    if (nvidiaSmiPath) return nvidiaSmiPath;

    const candidates = [
        'C:\\Windows\\System32\\nvidia-smi.exe',
        'C:\\Windows\\sysnative\\nvidia-smi.exe',
        'C:\\Program Files\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe'
    ];

    for (const cand of candidates) {
        try {
            if (fs.existsSync(cand)) {
                nvidiaSmiPath = cand;
                return nvidiaSmiPath;
            }
        } catch (e) {}
    }

    nvidiaSmiPath = 'nvidia-smi'; // fallback para o PATH global
    return nvidiaSmiPath;
}

// ==========================================
// ROTA 2: Esforço da GPU (NVIDIA)
// ==========================================
app.get('/api/gpu', (req, res) => {
    if (!isGpuAvailable) {
        return res.json({ usage: 0, error: "NVIDIA GPU não disponível" });
    }

    const commandPath = locateNvidiaSmi();
    exec(`"${commandPath}" --query-gpu=utilization.gpu --format=csv,noheader,nounits`, { windowsHide: true }, (error, stdout) => {
        if (error) {
            isGpuAvailable = false; // Desativa chamadas futuras para evitar spawn de CMD
            return res.json({ usage: 0, error: "NVIDIA GPU não disponível" });
        }
        const usage = parseInt(stdout.trim(), 10);
        res.json({ usage: isNaN(usage) ? 0 : usage });
    });
});

// ==========================================
// ROTA 3: Compilador Lazarus (Suporta LPI externo e local)
// ==========================================
app.post('/api/compile', (req, res) => {
    let { codigo_fonte, lpi_path } = req.body;

    // Se o cliente enviar um caminho de arquivo .lpi absoluto direto
    if (lpi_path) {
        lpi_path = autoCorrectPath(lpi_path);
        if (!fs.existsSync(lpi_path)) {
            return res.status(404).json({ sucesso: false, mensagem: "Arquivo .lpi não encontrado em: " + lpi_path });
        }
        const caminhoLazBuild = "C:\\lazarus\\lazbuild.exe";
        const caminhoEXE = lpi_path.replace(/\.lpi$/i, '.exe');
        
        console.log(`⚙️ Construindo projeto externo: ${lpi_path}...`);
        
        exec(`"${caminhoLazBuild}" "${lpi_path}"`, (errCompile, stdoutCompile, stderrCompile) => {
            if (errCompile) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: "Erro do LazBuild:\n" + (stdoutCompile || stderrCompile)
                });
            }

            console.log(`🚀 Abrindo programa: ${caminhoEXE}`);

            exec(`start "" "${caminhoEXE}"`, (errExec) => {
                if (errExec) {
                    return res.status(500).json({ sucesso: false, mensagem: "Falha ao abrir o executável externo." });
                }

                res.json({ sucesso: true, mensagem: `Projeto compilado e aberto com sucesso!` });
            });
        });
        return;
    }

    if (!codigo_fonte) {
        return res.status(400).json({ erro: "Nenhum código fornecido para compilar." });
    }

    const dirGerados = path.join(__dirname, 'Projetos_Gerados');
    if (!fs.existsSync(dirGerados)) {
        fs.mkdirSync(dirGerados, { recursive: true });
    }

    try {
        let jsonLimpo = codigo_fonte;
        const startIndex = jsonLimpo.indexOf('{');
        const endIndex = jsonLimpo.lastIndexOf('}');
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            jsonLimpo = jsonLimpo.substring(startIndex, endIndex + 1);
        } else {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Não foi encontrado nenhum bloco JSON na resposta da IA." 
            });
        }

        let arquivos;
        try {
            arquivos = JSON.parse(jsonLimpo);
        } catch (e) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "O texto extraído tem erros de sintaxe JSON: " + e.message + "\n\nTexto lido:\n" + jsonLimpo.substring(0, 100) + "..." 
            });
        }

        let lpiFileName = null;
        for (const [nomeArquivo, conteudo] of Object.entries(arquivos)) {
            const caminhoCompleto = path.join(dirGerados, nomeArquivo);
            fs.writeFileSync(caminhoCompleto, conteudo, 'utf8');
            
            if (nomeArquivo.toLowerCase().endsWith('.lpi')) {
                lpiFileName = nomeArquivo;
            }
        }

        if (!lpiFileName) {
            return res.status(400).json({ sucesso: false, mensagem: "A IA não gerou o arquivo .lpi" });
        }

        const caminhoLazBuild = "C:\\lazarus\\lazbuild.exe";
        const caminhoLPI = path.join(dirGerados, lpiFileName);
        const nomeExe = lpiFileName.replace('.lpi', '.exe');
        const caminhoEXE = path.join(dirGerados, nomeExe);

        console.log(`⚙️ Construindo projeto: ${lpiFileName}...`);

        exec(`"${caminhoLazBuild}" "${caminhoLPI}"`, (errCompile, stdoutCompile, stderrCompile) => {
            if (errCompile) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: "Erro do LazBuild:\n" + (stdoutCompile || stderrCompile)
                });
            }

            console.log(`🚀 Abrindo programa: ${nomeExe}`);

            exec(`start "" "${caminhoEXE}"`, (errExec) => {
                if (errExec) {
                    return res.status(500).json({ sucesso: false, mensagem: "Falha ao abrir a janela." });
                }

                res.json({ sucesso: true, mensagem: `Projeto ${nomeExe} aberto com sucesso!` });
            });
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// ROTA 4: Listar Modelos/Templates Disponíveis
// ==========================================
app.get('/api/templates', (req, res) => {
    try {
        if (!fs.existsSync(TEMPLATES_DIR)) {
            return res.status(404).json({ sucesso: false, erro: "Pasta de templates não encontrada em: " + TEMPLATES_DIR });
        }
        const dirs = fs.readdirSync(TEMPLATES_DIR);
        const templates = [];
        for (const dirName of dirs) {
            const dirPath = path.join(TEMPLATES_DIR, dirName);
            if (fs.statSync(dirPath).isDirectory()) {
                const manifestoPath = path.join(dirPath, 'modelo.json');
                if (fs.existsSync(manifestoPath)) {
                    try {
                        const raw = fs.readFileSync(manifestoPath, 'utf8');
                        const meta = JSON.parse(raw);
                        templates.push({
                            id: dirName,
                            nome: meta.nome || dirName,
                            descricao: meta.descricao || "",
                            versao: meta.versao || "1.0",
                            autor: meta.autor || "Desconhecido",
                            pastas: meta.pastas || [],
                            globais: meta.globais || [],
                            por_tabela: meta.por_tabela || []
                        });
                    } catch (errJson) {
                        console.error(`Erro ao ler modelo.json do template ${dirName}:`, errJson);
                    }
                }
            }
        }
        res.json({ sucesso: true, templates });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// ROTA 5: Ler Metadados do Banco Firebird 5
// ==========================================
app.post('/api/database/schema', (req, res) => {
    let { host, port, database, user, password } = req.body;
    host = host ? host.toString().trim() : '127.0.0.1';
    port = port ? port.toString().trim() : '3050';
    user = user ? user.trim() : 'SYSDBA';
    password = password ? password.trim() : 'masterkey';
    database = autoCorrectPath(database);
    
    console.log("🔍 [Diagnostic] Database Path length:", database.length);
    for (let i = 0; i < database.length; i++) {
        console.log(`  char[${i}]: ${database.charCodeAt(i)} (${database[i]})`);
    }

    if (!database) {
        return res.status(400).json({ sucesso: false, erro: "Caminho do banco de dados (.fdb) é obrigatório." });
    }

    const options = {
        host: host || '127.0.0.1',
        port: parseInt(port, 10) || 3050,
        database: database,
        user: user || 'SYSDBA',
        password: password || 'masterkey',
        lowercase_keys: true,
        charset: 'UTF8'
    };

    console.log("🔌 [Firebird Attach] Opções enviadas:", { ...options, password: '***' });

    Firebird.attach(options, (err, db) => {
        if (err) {
            console.error("❌ [Firebird Attach Error Details]:", err);
            if (res.headersSent) return;
            return res.status(500).json({ sucesso: false, erro: "Falha ao conectar no Firebird: " + err.message });
        }

        // 1. Listar todas as tabelas (sem tabelas de sistema e views)
        const sqlListarTabelas = `
            SELECT TRIM(RDB$RELATION_NAME) AS TABLE_NAME 
            FROM RDB$RELATIONS 
            WHERE coalesce(RDB$SYSTEM_FLAG, 0) = 0 
              AND RDB$VIEW_SOURCE IS NULL
            ORDER BY RDB$RELATION_NAME
        `;

        // 2. Listar campos e seus tipos
        const sqlCampos = `
            SELECT 
              TRIM(RF.RDB$RELATION_NAME) AS TABLE_NAME,
              TRIM(RF.RDB$FIELD_NAME) AS FIELD_NAME, 
              COALESCE(RF.RDB$NULL_FLAG, 0) AS NOT_NULL, 
              F.RDB$FIELD_TYPE AS FIELD_TYPE, 
              COALESCE(F.RDB$FIELD_LENGTH, 0) AS FIELD_LENGTH, 
              COALESCE(F.RDB$FIELD_PRECISION, 0) AS FIELD_PRECISION, 
              COALESCE(F.RDB$FIELD_SCALE, 0) AS FIELD_SCALE, 
              COALESCE(F.RDB$FIELD_SUB_TYPE, 0) AS FIELD_SUB_TYPE, 
              RF.RDB$FIELD_POSITION AS FIELD_POSITION,
              TRIM(RF.RDB$GENERATOR_NAME) AS GENERATOR_NAME
            FROM RDB$RELATION_FIELDS RF 
            JOIN RDB$FIELDS F ON F.RDB$FIELD_NAME = RF.RDB$FIELD_SOURCE 
            ORDER BY RF.RDB$RELATION_NAME, RF.RDB$FIELD_POSITION
        `;

        // 3. Listar chaves primárias
        const sqlPKs = `
            SELECT 
              TRIM(C.RDB$RELATION_NAME) AS TABLE_NAME,
              TRIM(S.RDB$FIELD_NAME) AS FIELD_NAME 
            FROM RDB$INDEX_SEGMENTS S 
            JOIN RDB$RELATION_CONSTRAINTS C ON C.RDB$INDEX_NAME = S.RDB$INDEX_NAME 
            WHERE C.RDB$CONSTRAINT_TYPE = 'PRIMARY KEY' 
            ORDER BY C.RDB$RELATION_NAME, S.RDB$FIELD_POSITION
        `;

        // 4. Listar chaves estrangeiras
        const sqlFKs = `
            SELECT 
              TRIM(C.RDB$RELATION_NAME) AS TABLE_NAME,
              TRIM(S.RDB$FIELD_NAME) AS FIELD_NAME, 
              TRIM(C2.RDB$RELATION_NAME) AS REF_TABLE, 
              TRIM(S2.RDB$FIELD_NAME) AS REF_FIELD 
            FROM RDB$INDEX_SEGMENTS S 
            JOIN RDB$RELATION_CONSTRAINTS C ON C.RDB$INDEX_NAME = S.RDB$INDEX_NAME 
            JOIN RDB$REF_CONSTRAINTS R ON R.RDB$CONSTRAINT_NAME = C.RDB$CONSTRAINT_NAME 
            JOIN RDB$RELATION_CONSTRAINTS C2 ON C2.RDB$CONSTRAINT_NAME = R.RDB$CONST_NAME_UQ 
            JOIN RDB$INDEX_SEGMENTS S2 ON S2.RDB$INDEX_NAME = C2.RDB$INDEX_NAME 
              AND S2.RDB$FIELD_POSITION = S.RDB$FIELD_POSITION 
            WHERE C.RDB$CONSTRAINT_TYPE = 'FOREIGN KEY' 
            ORDER BY C.RDB$RELATION_NAME, S.RDB$FIELD_POSITION
        `;

        db.query(sqlListarTabelas, (errTables, tablesRows) => {
            if (errTables) {
                db.detach();
                if (res.headersSent) return;
                return res.status(500).json({ sucesso: false, erro: "Erro ao listar tabelas: " + errTables.message });
            }

            db.query(sqlCampos, (errFields, fieldsRows) => {
                if (errFields) {
                    db.detach();
                    if (res.headersSent) return;
                    return res.status(500).json({ sucesso: false, erro: "Erro ao ler campos: " + errFields.message });
                }

                db.query(sqlPKs, (errPKs, pksRows) => {
                    if (errPKs) {
                        db.detach();
                        if (res.headersSent) return;
                        return res.status(500).json({ sucesso: false, erro: "Erro ao ler PKs: " + errPKs.message });
                    }

                    db.query(sqlFKs, (errFKs, fksRows) => {
                        db.detach();
                        if (errFKs) {
                            if (res.headersSent) return;
                            return res.status(500).json({ sucesso: false, erro: "Erro ao ler FKs: " + errFKs.message });
                        }

                        const tablesMap = {};
                        tablesRows.forEach(row => {
                            const tableName = row.table_name;
                            tablesMap[tableName] = {
                                nome: tableName,
                                nomePascal: toPascalCase(tableName),
                                nomeLower: tableName.toLowerCase(),
                                campos: [],
                                pk: null
                            };
                        });

                        fieldsRows.forEach(f => {
                            const tblName = f.table_name;
                            if (tablesMap[tblName]) {
                                const fieldName = f.field_name;
                                const isPK = pksRows.some(pk => pk.table_name === tblName && pk.field_name === fieldName);
                                const fk = fksRows.find(fk => fk.table_name === tblName && fk.field_name === fieldName);
                                
                                const tipo = getTipoCampo(f);
                                const campoInfo = {
                                    nome: fieldName,
                                    nomePascal: toPascalCase(fieldName),
                                    nomeCamel: toCamelCase(fieldName),
                                    caption: gerarCaption(fieldName),
                                    tipo: tipo,
                                    tipoFirebird: getTipoFirebirdStr(f),
                                    tipoPascal: tipoCampoToPascal(tipo),
                                    componenteVisual: tipoCampoToComponent(tipo),
                                    tamanho: f.field_length,
                                    precisao: f.field_precision,
                                    escala: f.field_scale,
                                    nao_nulo: f.not_null === 1,
                                    eh_pk: isPK,
                                    eh_fk: !!fk,
                                    tabela_ref: fk ? fk.ref_table : null,
                                    campo_ref: fk ? fk.ref_field : null,
                                    posicao: f.field_position
                                };

                                tablesMap[tblName].campos.push(campoInfo);
                                if (isPK && !tablesMap[tblName].pk) {
                                    tablesMap[tblName].pk = campoInfo;
                                }
                            }
                        });

                        if (res.headersSent) return;
                        res.json({ sucesso: true, tabelas: Object.values(tablesMap) });
                    });
                });
            });
        });
    });
});

// ==========================================
// ROTA 6: Gerar Projeto Lazarus MVC (Local)
// ==========================================
app.post('/api/generate-project', (req, res) => {
    let { 
        host, port, database, user, password,
        selectedTables, templateId, projectName, outputDir 
    } = req.body;
    host = host ? host.toString().trim() : '127.0.0.1';
    port = port ? port.toString().trim() : '3050';
    user = user ? user.trim() : 'SYSDBA';
    password = password ? password.trim() : 'masterkey';
    database = autoCorrectPath(database);
    outputDir = autoCorrectPath(outputDir);

    if (!selectedTables || selectedTables.length === 0) {
        return res.status(400).json({ sucesso: false, erro: "Selecione ao menos uma tabela." });
    }
    if (!projectName) {
        return res.status(400).json({ sucesso: false, erro: "O nome do projeto é obrigatório." });
    }
    // Sanotizar o nome do projeto para ser um identificador Pascal válido (sem espaços, caracteres especiais ou iniciando com número)
    projectName = projectName.trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
    if (!projectName) {
        return res.status(400).json({ sucesso: false, erro: "Nome de projeto inválido. Use apenas letras, números e sublinhados (_)." });
    }
    if (/^[0-9]/.test(projectName)) {
        projectName = 'P_' + projectName;
    }
    if (!outputDir) {
        return res.status(400).json({ sucesso: false, erro: "O diretório de saída é obrigatório." });
    }
    if (!templateId) {
        return res.status(400).json({ sucesso: false, erro: "Selecione um template." });
    }

    const templatePath = path.join(TEMPLATES_DIR, templateId);
    const manifestoPath = path.join(templatePath, 'modelo.json');

    if (!fs.existsSync(manifestoPath)) {
        return res.status(404).json({ sucesso: false, erro: "Template não encontrado ou manifesto modelo.json ausente." });
    }

    let meta;
    try {
        meta = JSON.parse(fs.readFileSync(manifestoPath, 'utf8'));
    } catch (e) {
        return res.status(500).json({ sucesso: false, erro: "Falha ao ler modelo.json do template: " + e.message });
    }

    // Criar conexão temporária para obter os metadados precisos das tabelas selecionadas
    const options = {
        host: host || '127.0.0.1',
        port: parseInt(port, 10) || 3050,
        database: database,
        user: user || 'SYSDBA',
        password: password || 'masterkey',
        lowercase_keys: true,
        charset: 'UTF8'
    };

    Firebird.attach(options, (errCon, db) => {
        if (errCon) {
            return res.status(500).json({ sucesso: false, erro: "Erro ao conectar no banco para leitura do esquema: " + errCon.message });
        }

        const sqlCampos = `
            SELECT 
              TRIM(RF.RDB$RELATION_NAME) AS TABLE_NAME,
              TRIM(RF.RDB$FIELD_NAME) AS FIELD_NAME, 
              COALESCE(RF.RDB$NULL_FLAG, 0) AS NOT_NULL, 
              F.RDB$FIELD_TYPE AS FIELD_TYPE, 
              COALESCE(F.RDB$FIELD_LENGTH, 0) AS FIELD_LENGTH, 
              COALESCE(F.RDB$FIELD_PRECISION, 0) AS FIELD_PRECISION, 
              COALESCE(F.RDB$FIELD_SCALE, 0) AS FIELD_SCALE, 
              COALESCE(F.RDB$FIELD_SUB_TYPE, 0) AS FIELD_SUB_TYPE, 
              RF.RDB$FIELD_POSITION AS FIELD_POSITION,
              TRIM(RF.RDB$GENERATOR_NAME) AS GENERATOR_NAME
            FROM RDB$RELATION_FIELDS RF 
            JOIN RDB$FIELDS F ON F.RDB$FIELD_NAME = RF.RDB$FIELD_SOURCE 
            WHERE TRIM(RF.RDB$RELATION_NAME) IN (${selectedTables.map(t => `'${t}'`).join(',')})
            ORDER BY RF.RDB$RELATION_NAME, RF.RDB$FIELD_POSITION
        `;

        const sqlPKs = `
            SELECT 
              TRIM(C.RDB$RELATION_NAME) AS TABLE_NAME,
              TRIM(S.RDB$FIELD_NAME) AS FIELD_NAME 
            FROM RDB$INDEX_SEGMENTS S 
            JOIN RDB$RELATION_CONSTRAINTS C ON C.RDB$INDEX_NAME = S.RDB$INDEX_NAME 
            WHERE C.RDB$CONSTRAINT_TYPE = 'PRIMARY KEY' 
              AND TRIM(C.RDB$RELATION_NAME) IN (${selectedTables.map(t => `'${t}'`).join(',')})
            ORDER BY C.RDB$RELATION_NAME, S.RDB$FIELD_POSITION
        `;

        const sqlFKs = `
            SELECT 
              TRIM(C.RDB$RELATION_NAME) AS TABLE_NAME,
              TRIM(S.RDB$FIELD_NAME) AS FIELD_NAME, 
              TRIM(C2.RDB$RELATION_NAME) AS REF_TABLE, 
              TRIM(S2.RDB$FIELD_NAME) AS REF_FIELD 
            FROM RDB$INDEX_SEGMENTS S 
            JOIN RDB$RELATION_CONSTRAINTS C ON C.RDB$INDEX_NAME = S.RDB$INDEX_NAME 
            JOIN RDB$REF_CONSTRAINTS R ON R.RDB$CONSTRAINT_NAME = C.RDB$CONSTRAINT_NAME 
            JOIN RDB$RELATION_CONSTRAINTS C2 ON C2.RDB$CONSTRAINT_NAME = R.RDB$CONST_NAME_UQ 
            JOIN RDB$INDEX_SEGMENTS S2 ON S2.RDB$INDEX_NAME = C2.RDB$INDEX_NAME 
              AND S2.RDB$FIELD_POSITION = S.RDB$FIELD_POSITION 
            WHERE C.RDB$CONSTRAINT_TYPE = 'FOREIGN KEY' 
              AND TRIM(C.RDB$RELATION_NAME) IN (${selectedTables.map(t => `'${t}'`).join(',')})
            ORDER BY C.RDB$RELATION_NAME, S.RDB$FIELD_POSITION
        `;

        db.query(sqlCampos, (errFields, fieldsRows) => {
            if (errFields) { db.detach(); return res.status(500).json({ sucesso: false, erro: errFields.message }); }

            db.query(sqlPKs, (errPKs, pksRows) => {
                if (errPKs) { db.detach(); return res.status(500).json({ sucesso: false, erro: errPKs.message }); }

                db.query(sqlFKs, (errFKs, fksRows) => {
                    if (errFKs) { db.detach(); return res.status(500).json({ sucesso: false, erro: errFKs.message }); }
                    
                    db.query("SELECT TRIM(RDB$GENERATOR_NAME) AS GEN_NAME FROM RDB$GENERATORS WHERE RDB$SYSTEM_FLAG = 0", (errGens, gensRows) => {
                        db.detach();
                        if (errGens) return res.status(500).json({ sucesso: false, erro: errGens.message });
                        
                        const gensList = (gensRows || []).map(r => r.gen_name || r.GEN_NAME).filter(Boolean);

                        // Agrupar metadados
                        const tables = selectedTables.map(tableName => {
                            const fieldsForTable = fieldsRows.filter(f => f.table_name === tableName);
                            const pkField = fieldsForTable.find(f => pksRows.some(pk => pk.table_name === tableName && pk.field_name === f.field_name));
                            let generatorName = '';
                            if (pkField && pkField.generator_name) {
                                generatorName = pkField.generator_name;
                            } else {
                                const possibleNames = [
                                    `GEN_${tableName}_ID`,
                                    `GEN_${tableName}`,
                                    `${tableName}_SEQ`
                                ];
                                const foundGen = gensList.find(g => g && possibleNames.some(p => p.toUpperCase() === g.toUpperCase()));
                                if (foundGen) {
                                    generatorName = foundGen;
                                } else {
                                    const foundContains = gensList.find(g => g && g.toUpperCase().includes(tableName.toUpperCase()));
                                    generatorName = foundContains || `GEN_${tableName}`;
                                }
                            }
                            console.log(`Table: ${tableName}, PK: ${pkField ? pkField.field_name : 'none'}, GenName: ${generatorName}`);

                            const tbl = {
                            nome: tableName,
                            nomePascal: toPascalCase(tableName),
                            nomeLower: tableName.toLowerCase(),
                            campos: [],
                            pk: null,
                            generatorName: generatorName
                        };

                        const fields = fieldsRows.filter(f => f.table_name === tableName);
                        fields.forEach(f => {
                            const fieldName = f.field_name;
                            const isPK = pksRows.some(pk => pk.table_name === tableName && pk.field_name === fieldName);
                            const fk = fksRows.find(fk => fk.table_name === tableName && fk.field_name === fieldName);
                            
                            const tipo = getTipoCampo(f);
                            const campoInfo = {
                                nome: fieldName,
                                nomePascal: toPascalCase(fieldName),
                                nomeCamel: toCamelCase(fieldName),
                                caption: gerarCaption(fieldName),
                                tipo: tipo,
                                tipoFirebird: getTipoFirebirdStr(f),
                                tipoPascal: tipoCampoToPascal(tipo),
                                componenteVisual: tipoCampoToComponent(tipo),
                                tamanho: f.field_length,
                                precisao: f.field_precision,
                                escala: f.field_scale,
                                nao_nulo: f.not_null === 1,
                                eh_pk: isPK,
                                eh_fk: !!fk,
                                tabela_ref: fk ? fk.ref_table : null,
                                campo_ref: fk ? fk.ref_field : null,
                                posicao: f.field_position
                            };
                            tbl.campos.push(campoInfo);
                            if (isPK && !tbl.pk) {
                                tbl.pk = campoInfo;
                            }
                        });
                        return tbl;
                    });

                    try {
                        // 1. Criar pasta exclusiva para o projeto
                        const projectDir = path.join(outputDir, projectName);
                        if (!fs.existsSync(projectDir)) {
                            fs.mkdirSync(projectDir, { recursive: true });
                        }

                        // 2. Criar subpastas MVC definidas no modelo.json
                        if (meta.pastas) {
                            meta.pastas.forEach(folder => {
                                const subPath = path.join(projectDir, folder);
                                if (!fs.existsSync(subPath)) {
                                    fs.mkdirSync(subPath, { recursive: true });
                                }
                            });
                        }

                        const filesList = [];
                        const generatedFilesMap = {};

                        // Helper para salvar e registrar arquivos
                        const salvarArquivo = (relPath, conteudo) => {
                            const absPath = path.join(projectDir, relPath);
                            const dir = path.dirname(absPath);
                            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                            fs.writeFileSync(absPath, conteudo, 'utf8');
                            filesList.push(relPath);
                            generatedFilesMap[relPath] = conteudo;
                        };

                        // 3. Renderizar arquivos globais
                        if (meta.globais) {
                            meta.globais.forEach(g => {
                                const tplContent = fs.readFileSync(path.join(templatePath, g.tpl), 'utf8');
                                let rendered = processarGlobal(tplContent, projectName);
                                
                                // Injetar configurações do banco nos DataModules de conexão
                                if (g.tpl === 'dm_conexao.tpl' || g.tpl === 'dm_conexao.pas') {
                                    rendered = rendered.replace(/\{\{DB_HOST\}\}/g, host || '127.0.0.1');
                                    rendered = rendered.replace(/\{\{DB_PORT\}\}/g, port || '3050');
                                    rendered = rendered.replace(/\{\{DB_NAME\}\}/g, database.replace(/\\/g, '\\\\'));
                                    rendered = rendered.replace(/\{\{DB_USER\}\}/g, user || 'SYSDBA');
                                    rendered = rendered.replace(/\{\{DB_PASSWORD\}\}/g, password || 'masterkey');
                                }

                                const outName = g.saida.replace(/\{\{NOME_SISTEMA\}\}/g, projectName);
                                salvarArquivo(outName, rendered);
                            });
                        }

                        // 4. Renderizar arquivos por tabela
                        if (meta.por_tabela) {
                            tables.forEach(tabela => {
                                meta.por_tabela.forEach(pt => {
                                    const tplContent = fs.readFileSync(path.join(templatePath, pt.tpl), 'utf8');
                                    
                                    // Processa loops de campos e substitui os marcadores do banco
                                    let rendered = processarLoop(tplContent, tabela);
                                    rendered = processarMarcadoresGlobais(rendered, tabela, projectName);

                                    const outName = pt.saida
                                        .replace(/\{\{T\}\}/g, tabela.nomePascal)
                                        .replace(/\{\{NOME_SISTEMA\}\}/g, projectName);
                                    salvarArquivo(outName, rendered);
                                });
                            });
                        }

                        // 5. Pós-processar view_main.pas para registrar os menus e rotas dos CRUDs
                        const mainViewPath = 'view/uViewMain.pas';
                        if (generatedFilesMap[mainViewPath]) {
                            const updatedContent = postProcessViewMain(generatedFilesMap[mainViewPath], tables, projectName);
                            salvarArquivo(mainViewPath, updatedContent);
                        }

                        // 6. Gerar o arquivo de projeto Lazarus .lpi contendo todas as units criadas
                        const pasAndLprFiles = filesList.filter(f => f.endsWith('.pas') || f.endsWith('.lpr'));
                        const lpiContent = gerarProjetoLPI(projectName, pasAndLprFiles, meta.pastas || []);
                        const lpiName = `${projectName}.lpi`;
                        salvarArquivo(lpiName, lpiContent);

                        // 6b. Gerar o arquivo Lazarus Project Session .lps para abrir uViewMain por padrão
                        const lpsContent = `<?xml version="1.0" encoding="UTF-8"?>\r\n` +
                                           `<CONFIG>\r\n` +
                                           `  <ProjectSession>\r\n` +
                                           `    <PathDelim Value="\\\\"/>\r\n` +
                                           `    <Version Value="12"/>\r\n` +
                                           `    <Units>\r\n` +
                                           `      <Unit>\r\n` +
                                           `        <Filename Value="${projectName}.lpr"/>\r\n` +
                                           `        <IsPartOfProject Value="True"/>\r\n` +
                                           `        <UsageCount Value="20"/>\r\n` +
                                           `      </Unit>\r\n` +
                                           `      <Unit>\r\n` +
                                           `        <Filename Value="view\\\\uViewMain.pas"/>\r\n` +
                                           `        <IsPartOfProject Value="True"/>\r\n` +
                                           `        <IsVisibleTab Value="True"/>\r\n` +
                                           `        <Loaded Value="True"/>\r\n` +
                                           `        <LoadedDesigner Value="True"/>\r\n` +
                                           `        <UsageCount Value="20"/>\r\n` +
                                           `      </Unit>\r\n` +
                                           `    </Units>\r\n` +
                                           `  </ProjectSession>\r\n` +
                                           `</CONFIG>`;
                        salvarArquivo(`${projectName}.lps`, lpsContent);

                        res.json({
                            sucesso: true,
                            mensagem: `Projeto ${projectName} gerado com sucesso em: ${projectDir}`,
                            projeto_dir: projectDir,
                            lpi_path: path.join(projectDir, lpiName),
                            arquivos: filesList
                        });

                    } catch (errGen) {
                        res.status(500).json({ sucesso: false, erro: "Falha durante a geração física dos arquivos: " + errGen.message });
                    }
                    });
                });
            });
        });
    });
});

// ==========================================
// FUNÇÕES AUXILIARES DA ROTA DE PROJETO
// ==========================================
function processarLoop(tplText, tabela) {
    const tagInicio = '{{LOOP_CAMPOS}}';
    const tagFim = '{{/LOOP_CAMPOS}}';
    
    let result = tplText;
    while (true) {
        const posI = result.indexOf(tagInicio);
        if (posI === -1) break;
        const posF = result.indexOf(tagFim);
        if (posF === -1) break;
        
        const antes = result.substring(0, posI);
        const corpo = result.substring(posI + tagInicio.length, posF);
        const depois = result.substring(posF + tagFim.length);
        
        let bloco = "";
        let topAtual = 12;
        
        tabela.campos.forEach((campo, index) => {
            let item = corpo;
            item = item.replace(/\{\{CAMPO_NOME\}\}/g, campo.nome);
            item = item.replace(/\{\{CAMPO_PASCAL\}\}/g, campo.nomePascal);
            item = item.replace(/\{\{CAMPO_CAMEL\}\}/g, campo.nomeCamel);
            item = item.replace(/\{\{CAMPO_CAPTION\}\}/g, campo.caption);
            item = item.replace(/\{\{CAMPO_TIPO_PASCAL\}\}/g, campo.tipoPascal);
            item = item.replace(/\{\{CAMPO_TIPO_FIREBIRD\}\}/g, campo.tipoFirebird);
            item = item.replace(/\{\{CAMPO_COMPONENTE\}\}/g, campo.componenteVisual);
            item = item.replace(/\{\{CAMPO_TOP\}\}/g, topAtual.toString());
            item = item.replace(/\{\{CAMPO_INDEX\}\}/g, index.toString());
            item = item.replace(/\{\{CAMPO_TAMANHO\}\}/g, (campo.tamanho || 0).toString());
            item = item.replace(/\{\{CAMPO_IS_PK\}\}/g, campo.eh_pk ? 'True' : 'False');
            item = item.replace(/\{\{CAMPO_IS_FK\}\}/g, campo.eh_fk ? 'True' : 'False');
            
            if (campo.eh_fk && campo.tabela_ref) {
                item = item.replace(/\{\{CAMPO_TAB_REF\}\}/g, campo.tabela_ref);
                item = item.replace(/\{\{CAMPO_TAB_REF_PASCAL\}\}/g, toPascalCase(campo.tabela_ref));
            } else {
                item = item.replace(/\{\{CAMPO_TAB_REF\}\}/g, '');
                item = item.replace(/\{\{CAMPO_TAB_REF_PASCAL\}\}/g, '');
            }
            
            bloco += item;
            
            if (campo.tipo === 'tcBlobText') {
                topAtual += 80;
            } else {
                topAtual += 32;
            }
        });
        
        result = antes + bloco + depois;
    }
    return result;
}

function processarMarcadoresGlobais(tplText, tabela, projectName) {
    const pk = tabela.pk || { nome: 'ID', nomePascal: 'Id', tipoPascal: 'Integer' };
    const pkNome = pk.nome;
    const pkNomePascal = pk.nomePascal;
    const pkTipo = pk.tipoPascal;

    let properties = '';
    let clear = '';
    let selectCamposArr = [];
    let insertCamposArr = [];
    let insertParamsArr = [];
    let insertCamposComPKArr = [pkNome];
    let insertParamsComPKArr = [':' + pkNome];
    let updateSetArr = [];
    let setFromQuery = '';
    let setToQuery = '';

    tabela.campos.forEach(campo => {
        properties += `    F${campo.nomePascal}: ${campo.tipoPascal};\r\n`;

        if (['tcInteger', 'tcInt64', 'tcDouble', 'tcCurrency', 'tcDate', 'tcTime', 'tcDateTime'].includes(campo.tipo)) {
            clear += `    F${campo.nomePascal} := 0;\r\n`;
        } else if (['tcString', 'tcBlobText'].includes(campo.tipo)) {
            clear += `    F${campo.nomePascal} := '';\r\n`;
        } else if (campo.tipo === 'tcBoolean') {
            clear += `    F${campo.nomePascal} := False;\r\n`;
        } else {
            clear += `    F${campo.nomePascal} := 0;\r\n`;
        }

        selectCamposArr.push(campo.nome);

        if (!campo.eh_pk) {
            insertCamposArr.push(campo.nome);
            insertParamsArr.push(':' + campo.nome);
            
            insertCamposComPKArr.push(campo.nome);
            insertParamsComPKArr.push(':' + campo.nome);

            updateSetArr.push(`${campo.nome} = :${campo.nome}`);
        }

        if (['tcInteger', 'tcInt64'].includes(campo.tipo)) {
            setFromQuery += `    AModel.${campo.nomePascal} := AQuery.FieldByName('${campo.nome}').AsInteger;\r\n`;
        } else if (['tcDouble', 'tcCurrency'].includes(campo.tipo)) {
            setFromQuery += `    AModel.${campo.nomePascal} := AQuery.FieldByName('${campo.nome}').AsFloat;\r\n`;
        } else if (['tcString', 'tcBlobText'].includes(campo.tipo)) {
            setFromQuery += `    AModel.${campo.nomePascal} := AQuery.FieldByName('${campo.nome}').AsString;\r\n`;
        } else if (['tcDate', 'tcTime', 'tcDateTime'].includes(campo.tipo)) {
            setFromQuery += `    AModel.${campo.nomePascal} := AQuery.FieldByName('${campo.nome}').AsDateTime;\r\n`;
        } else if (campo.tipo === 'tcBoolean') {
            setFromQuery += `    AModel.${campo.nomePascal} := AQuery.FieldByName('${campo.nome}').AsBoolean;\r\n`;
        } else {
            setFromQuery += `    AModel.${campo.nomePascal} := AQuery.FieldByName('${campo.nome}').AsString;\r\n`;
        }

        if (!campo.eh_pk) {
            if (['tcInteger', 'tcInt64'].includes(campo.tipo)) {
                setToQuery += `    AQuery.ParamByName('${campo.nome}').AsInteger := AModel.${campo.nomePascal};\r\n`;
            } else if (['tcDouble', 'tcCurrency'].includes(campo.tipo)) {
                setToQuery += `    AQuery.ParamByName('${campo.nome}').AsFloat := AModel.${campo.nomePascal};\r\n`;
            } else if (['tcString', 'tcBlobText'].includes(campo.tipo)) {
                setToQuery += `    AQuery.ParamByName('${campo.nome}').AsString := AModel.${campo.nomePascal};\r\n`;
            } else if (['tcDate', 'tcTime', 'tcDateTime'].includes(campo.tipo)) {
                setToQuery += `    AQuery.ParamByName('${campo.nome}').AsDateTime := AModel.${campo.nomePascal};\r\n`;
            } else if (campo.tipo === 'tcBoolean') {
                setToQuery += `    AQuery.ParamByName('${campo.nome}').AsBoolean := AModel.${campo.nomePascal};\r\n`;
            } else {
                setToQuery += `    AQuery.ParamByName('${campo.nome}').AsString := AModel.${campo.nomePascal};\r\n`;
            }
        }
    });

    const selectCampos = selectCamposArr.join(', ');
    const insertCampos = insertCamposArr.join(', ');
    const insertParams = insertParamsArr.join(', ');
    const insertCamposComPK = insertCamposComPKArr.join(', ');
    const insertParamsComPK = insertParamsComPKArr.join(', ');
    const updateSet = updateSetArr.join(', ');

    const dateStr = new Date().toLocaleString('pt-BR');

    let result = tplText;
    result = result.replace(/\{\{NOME_SISTEMA\}\}/g, projectName);
    result = result.replace(/\{\{NOME_TABELA\}\}/g, tabela.nome);
    result = result.replace(/\{\{NOME_TABELA_PASCAL\}\}/g, tabela.nomePascal);
    result = result.replace(/\{\{NOME_TABELA_LOWER\}\}/g, tabela.nomeLower);
    result = result.replace(/\{\{PK_CAMPO\}\}/g, pkNome);
    result = result.replace(/\{\{PK_CAMPO_PASCAL\}\}/g, pkNomePascal);
    result = result.replace(/\{\{PK_TIPO_PASCAL\}\}/g, pkTipo);
    result = result.replace(/\{\{GENERATOR_NAME\}\}/g, tabela.generatorName || `GEN_${tabela.nome}`);
    result = result.replace(/\{\{DATA_GERACAO\}\}/g, dateStr);
    result = result.replace(/\{\{TOTAL_CAMPOS\}\}/g, tabela.campos.length.toString());

    result = result.replace(/\{\{CAMPOS_PROPERTIES\}\}/g, properties);
    result = result.replace(/\{\{CAMPOS_CLEAR\}\}/g, clear);
    result = result.replace(/\{\{CAMPOS_INSERT_LISTA\}\}/g, insertCampos);
    result = result.replace(/\{\{CAMPOS_INSERT_PARAMS\}\}/g, insertParams);
    result = result.replace(/\{\{CAMPOS_UPDATE_SET\}\}/g, updateSet);
    result = result.replace(/\{\{CAMPOS_SELECT\}\}/g, selectCampos);
    result = result.replace(/\{\{CAMPOS_SET_FROM_QUERY\}\}/g, setFromQuery);
    result = result.replace(/\{\{CAMPOS_SET_TO_QUERY\}\}/g, setToQuery);

    result = result.replace(/\{\{SQL_SELECT\}\}/g, `SELECT ${selectCampos} FROM ${tabela.nome}`);
    result = result.replace(/\{\{SQL_SELECT_BY_PK\}\}/g, `SELECT ${selectCampos} FROM ${tabela.nome} WHERE ${pkNome} = :${pkNome}`);
    result = result.replace(/\{\{SQL_INSERT\}\}/g, `INSERT INTO ${tabela.nome} (${insertCampos}) VALUES (${insertParams})`);
    result = result.replace(/\{\{SQL_INSERT_FULL\}\}/g, `INSERT INTO ${tabela.nome} (${insertCamposComPK}) VALUES (${insertParamsComPK})`);
    result = result.replace(/\{\{SQL_UPDATE\}\}/g, `UPDATE ${tabela.nome} SET ${updateSet} WHERE ${pkNome} = :${pkNome}`);
    result = result.replace(/\{\{SQL_DELETE\}\}/g, `DELETE FROM ${tabela.nome} WHERE ${pkNome} = :${pkNome}`);

    return result;
}

function processarGlobal(tplText, projectName) {
    const dateStr = new Date().toLocaleString('pt-BR');
    let result = tplText;
    result = result.replace(/\{\{NOME_SISTEMA\}\}/g, projectName);
    result = result.replace(/\{\{DATA_GERACAO\}\}/g, dateStr);
    return result;
}

function postProcessViewMain(viewMainContent, selectedTables, projectName) {
    let usesCRUD = '';
    let menuCRUD = '';
    let navCRUD = '';

    const obterIconeTabela = (nome) => {
        if (nome.toUpperCase() === 'CLIENTES') return 'ICO_CLIENTES';
        if (nome.toUpperCase() === 'PRODUTOS') return 'ICO_PRODUTOS';
        if (['PEDIDOS', 'VENDAS'].includes(nome.toUpperCase())) return 'ICO_PEDIDOS';
        return "'📋'";
    };

    selectedTables.forEach((tabela, idx) => {
        if (usesCRUD !== '') usesCRUD += ', ';
        usesCRUD += `uFrLista${tabela.nomePascal}`;

        menuCRUD += `  Itens[${idx + 1}].Icone := ${obterIconeTabela(tabela.nome)};  Itens[${idx + 1}].Titulo := '${tabela.nomePascal}'; Itens[${idx + 1}].Tag := ${idx + 1};\r\n`;

        navCRUD += `    ${idx + 1}: ExibirFrame(TFrLista${tabela.nomePascal}.Create(pnlConteudoBody), '${tabela.nomePascal}');\r\n`;
    });

    if (usesCRUD !== '') {
        usesCRUD = ', ' + usesCRUD;
    }

    const qtdItens = 1 + selectedTables.length + 3;
    const idxPDV = 1 + selectedTables.length;
    const idxRel = idxPDV + 1;
    const idxCfg = idxRel + 1;

    const fullMenuCRUD = 
        `  SetLength(Itens, ${qtdItens});\r\n` +
        `  Itens[0].Icone := ICO_DASHBOARD;  Itens[0].Titulo := 'Dashboard'; Itens[0].Tag := 0;\r\n` +
        menuCRUD +
        `  Itens[${idxPDV}].Icone := ICO_PDV;        Itens[${idxPDV}].Titulo := 'PDV';       Itens[${idxPDV}].Tag := 100; Itens[${idxPDV}].Separador := True;\r\n` +
        `  Itens[${idxRel}].Icone := ICO_RELATORIOS; Itens[${idxRel}].Titulo := 'Relatórios';Itens[${idxRel}].Tag := 101; Itens[${idxRel}].Separador := True;\r\n` +
        `  Itens[${idxCfg}].Icone := ICO_CONFIG;     Itens[${idxCfg}].Titulo := 'Config.';   Itens[${idxCfg}].Tag := 102; Itens[${idxCfg}].Separador := True;`;

    const fullNavCRUD = 
        `  case ATag of\r\n` +
        `    0: ExibirDashboard;\r\n` +
        navCRUD +
        `    100:\r\n` +
        `    begin\r\n` +
        `      LimparConteudo;\r\n` +
        `      with TProcess.Create(nil) do\r\n` +
        `      try\r\n` +
        `        Executable := ExtractFilePath(Application.ExeName) + '${projectName}_PDV.exe';\r\n` +
        `        InheritHandles := False;\r\n` +
        `        Options := [];\r\n` +
        `        if FileExists(Executable) then\r\n` +
        `          Execute\r\n` +
        `        else\r\n` +
        `          ShowMessage('Executável do PDV não encontrado em: ' + Executable);\r\n` +
        `      finally\r\n` +
        `        Free;\r\n` +
        `      end;\r\n` +
        `    end;\r\n` +
        `    else\r\n` +
        `    begin\r\n` +
        `      LimparConteudo;\r\n` +
        `    end;\r\n` +
        `  end;`;

    let content = viewMainContent.replace(/\r\n/g, '\n');
    
    // Expressões regulares tolerantes a espaçamento e novas linhas
    content = content.replace(
        /uFrSidebar,\s*uViewDashboard\s*\{\s*Adicione aqui as units dos seus Frames de CRUD\s*\};/i,
        `uFrSidebar,\n  uViewDashboard, process${usesCRUD};`
    );

    content = content.replace(
        /SetLength\s*\(\s*Itens\s*,\s*7\s*\)\s*;\s*Itens\s*\[\s*0\s*\]\s*\.\s*Icone\s*:=\s*ICO_DASHBOARD\s*;\s*Itens\s*\[\s*0\s*\]\s*\.\s*Titulo\s*:=\s*'Dashboard'\s*;\s*Itens\s*\[\s*0\s*\]\s*\.\s*Tag\s*:=\s*0\s*;\s*\/\/\s*Adicione os módulos abaixo conforme suas tabelas:\s*Itens\s*\[\s*1\s*\]\s*\.\s*Icone\s*:=\s*ICO_CLIENTES\s*;\s*Itens\s*\[\s*1\s*\]\s*\.\s*Titulo\s*:=\s*'Clientes'\s*;\s*Itens\s*\[\s*1\s*\]\s*\.\s*Tag\s*:=\s*1\s*;\s*Itens\s*\[\s*2\s*\]\s*\.\s*Icone\s*:=\s*ICO_PRODUTOS\s*;\s*Itens\s*\[\s*2\s*\]\s*\.\s*Titulo\s*:=\s*'Produtos'\s*;\s*Itens\s*\[\s*2\s*\]\s*\.\s*Tag\s*:=\s*2\s*;\s*Itens\s*\[\s*3\s*\]\s*\.\s*Icone\s*:=\s*ICO_PEDIDOS\s*;\s*Itens\s*\[\s*3\s*\]\s*\.\s*Titulo\s*:=\s*'Pedidos'\s*;\s*Itens\s*\[\s*3\s*\]\s*\.\s*Tag\s*:=\s*3\s*;\s*Itens\s*\[\s*4\s*\]\s*\.\s*Icone\s*:=\s*ICO_PDV\s*;\s*Itens\s*\[\s*4\s*\]\s*\.\s*Titulo\s*:=\s*'PDV'\s*;\s*Itens\s*\[\s*4\s*\]\s*\.\s*Tag\s*:=\s*4\s*;\s*Itens\s*\[\s*4\s*\]\s*\.\s*Separador\s*:=\s*True\s*;\s*Itens\s*\[\s*5\s*\]\s*\.\s*Icone\s*:=\s*ICO_RELATORIOS\s*;\s*Itens\s*\[\s*5\s*\]\s*\.\s*Titulo\s*:=\s*'Relatórios'\s*;\s*Itens\s*\[\s*5\s*\]\s*\.\s*Tag\s*:=\s*5\s*;\s*Itens\s*\[\s*5\s*\]\s*\.\s*Separador\s*:=\s*True\s*;\s*Itens\s*\[\s*6\s*\]\s*\.\s*Icone\s*:=\s*ICO_CONFIG\s*;\s*Itens\s*\[\s*6\s*\]\s*\.\s*Titulo\s*:=\s*'Config\.'\s*;\s*Itens\s*\[\s*6\s*\]\s*\.\s*Tag\s*:=\s*99\s*;\s*Itens\s*\[\s*6\s*\]\s*\.\s*Separador\s*:=\s*True\s*;/i,
        fullMenuCRUD.replace(/\r\n/g, '\n')
    );

    content = content.replace(
        /case\s+ATag\s+of\s+0\s*:\s*ExibirDashboard\s*;\s*else\s*begin\s*LimparConteudo\s*;\s*\/\/\s*TODO:\s*adicione seus frames aqui\s*end\s*;\s*end\s*;/i,
        fullNavCRUD.replace(/\r\n/g, '\n')
    );

    return content.replace(/\n/g, '\r\n');
}

function gerarProjetoLPI(projectName, filesList, foldersList) {
    const uniqueFiles = Array.from(new Set(filesList));

    const sortedFiles = [...uniqueFiles].sort((a, b) => {
        const aIsMain = a.toLowerCase() === `${projectName.toLowerCase()}.lpr`;
        const bIsMain = b.toLowerCase() === `${projectName.toLowerCase()}.lpr`;
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;

        const aIsLpr = a.toLowerCase().endsWith('.lpr');
        const bIsLpr = b.toLowerCase().endsWith('.lpr');
        if (aIsLpr && !bIsLpr) return -1;
        if (!aIsLpr && bIsLpr) return 1;

        return a.localeCompare(b);
    });

    let unitsXML = '';
    let idxUnit = 0;
    
    sortedFiles.forEach(file => {
        const normalizedFile = file.replace(/\//g, '\\');
        unitsXML += `      <Unit${idxUnit}>\r\n` +
                    `        <Filename Value="${normalizedFile}"/>\r\n` +
                    `        <IsPartOfProject Value="True"/>\r\n` +
                    `      </Unit${idxUnit}>\r\n`;
        idxUnit++;
    });

    const sPaths = foldersList.map(f => f.replace(/\//g, '\\')).join(';');

    return `<?xml version="1.0" encoding="UTF-8"?>
<CONFIG>
  <ProjectOptions>
    <Version Value="12"/>
    <PathDelim Value="\\"/>
    <General>
      <SessionStorage Value="InProjectDir"/>
      <Title Value="${projectName}"/>
      <Scaled Value="True"/>
      <ResourceType Value="res"/>
      <UseXPManifest Value="True"/>
      <XPManifest>
        <DpiAware Value="True"/>
      </XPManifest>
      <MainUnit Value="0"/>
    </General>
    <BuildModes Count="1">
      <Item1 Name="Default" Default="True"/>
    </BuildModes>
    <PublishOptions>
      <Version Value="2"/>
      <UseFileFilters Value="True"/>
    </PublishOptions>
    <RunParams>
      <FormatVersion Value="2"/>
    </RunParams>
    <RequiredPackages Count="3">
      <Item1>
        <PackageName Value="ibexpress"/>
      </Item1>
      <Item2>
        <PackageName Value="LCL"/>
      </Item2>
      <Item3>
        <PackageName Value="DateTimeCtrls"/>
      </Item3>
    </RequiredPackages>
    <Units Count="${idxUnit}">
${unitsXML}    </Units>
  </ProjectOptions>
  <CompilerOptions>
    <Version Value="11"/>
    <Target>
      <Filename Value="${projectName}"/>
    </Target>
    <SearchPaths>
      <IncludeFiles Value="$(ProjOutDir)"/>
      <OtherUnitFiles Value="${sPaths}"/>
      <UnitOutputDirectory Value="lib\\$(TargetCPU)-\$(TargetOS)"/>
    </SearchPaths>
    <Parsing>
      <SyntaxOptions>
        <SyntaxMode Value="Delphi"/>
      </SyntaxOptions>
    </Parsing>
    <Linking>
      <Debugging>
        <DebugInfoType Value="dsDwarf3"/>
      </Debugging>
      <Options>
        <Win32GraphicApp Value="True"/>
      </Options>
    </Linking>
  </CompilerOptions>
  <Debugging>
    <Exceptions Count="3">
      <Item1>
        <Name Value="EAbort"/>
      </Item1>
      <Item2>
        <Name Value="ECodetoolError"/>
      </Item2>
      <Item3>
        <Name Value="EFOpenError"/>
      </Item3>
    </Exceptions>
  </Debugging>
</CONFIG>`;
}

// ==========================================
// ROTA DO FILESYSTEM EXPLORER
// ==========================================
app.post('/api/fs/list', (req, res) => {
    let currentPath = req.body.path || 'C:\\Projetos Antigravity';
    currentPath = autoCorrectPath(currentPath);
    
    // Normaliza o caminho
    currentPath = path.resolve(currentPath);
    
    try {
        if (!fs.existsSync(currentPath)) {
            return res.json({ sucesso: false, erro: 'Caminho não existe' });
        }
        
        const stats = fs.statSync(currentPath);
        if (!stats.isDirectory()) {
            return res.json({ sucesso: false, erro: 'Não é um diretório' });
        }
        
        const items = fs.readdirSync(currentPath);
        const dirs = [];
        const files = [];
        
        const parentPath = path.dirname(currentPath);
        
        items.forEach(item => {
            try {
                const fullItemPath = path.join(currentPath, item);
                const itemStats = fs.statSync(fullItemPath);
                if (itemStats.isDirectory()) {
                    dirs.push({ name: item, path: fullItemPath });
                } else {
                    files.push({ name: item, path: fullItemPath, size: itemStats.size });
                }
            } catch (e) {
                // Ignora sem erro de permissão
            }
        });
        
        dirs.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) => a.name.localeCompare(b.name));
        
        res.json({
            sucesso: true,
            currentPath,
            parentPath: parentPath !== currentPath ? parentPath : null,
            dirs,
            files
        });
    } catch (error) {
        res.json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// ROTA 7: Abrir Caixa de Diálogo de Arquivo (.fdb)
// ==========================================
app.get('/api/dialog/file', (req, res) => {
    const scriptPath = path.join(__dirname, 'open_file_dialog.ps1');
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -STA -File "${scriptPath}"`;
    
    exec(command, (error, stdout) => {
        if (error) {
            return res.json({ sucesso: false, erro: error.message });
        }
        res.json({ sucesso: true, path: stdout.trim() });
    });
});

// ==========================================
// ROTA 8: Abrir Caixa de Diálogo de Pasta (Diretório)
// ==========================================
app.get('/api/dialog/folder', (req, res) => {
    const scriptPath = path.join(__dirname, 'open_folder_dialog.ps1');
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -STA -File "${scriptPath}"`;
    
    exec(command, (error, stdout) => {
        if (error) {
            return res.json({ sucesso: false, erro: error.message });
        }
        res.json({ sucesso: true, path: stdout.trim() });
    });
});

// ==========================================
// INICIALIZAÇÃO SAAS
// ==========================================
import { startSaaSBackend } from './saas-backend.js';
startSaaSBackend(app);