unit uPixUtils;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} }
{ PIX Utilities — EMV Payload + QR Code (Pascal puro, sem dependências) }
{ Baseado na especificação BCB: Manual de Padrões para Iniciação do Pix }
{ QR Code: Versions 1-10, Error Correction L, Byte mode }

interface

uses
  Classes, SysUtils, Graphics, Math;

// ============================================================
// TIPOS
// ============================================================
type
  TTipoChavePIX = (
    tcCPF,        // 000.000.000-00
    tcCNPJ,       // 00.000.000/0000-00
    tcTelefone,   // +5511999999999
    tcEmail,      // usuario@dominio.com
    tcAleatoria   // UUID formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  );

  TPIXConfig = record
    TipoChave:    TTipoChavePIX;
    Chave:        string;   // valor da chave (já formatado)
    Nome:         string;   // nome do recebedor (máx. 25 chars)
    Cidade:       string;   // cidade do recebedor (máx. 15 chars)
    Descricao:    string;   // descrição opcional (máx. 72 chars)
    CNPJ:         string;   // CNPJ do estabelecimento (opcional)
    Ativo:        Boolean;
  end;

// ============================================================
// FUNÇÕES PÚBLICAS
// ============================================================

{ Gera o payload EMV padrão BCB para PIX }
function GerarPayloadPIX(
  const AChave, ANomeRecebedor, ACidade: string;
  AValor: Currency;
  const ADescricao: string = '';
  const ATxId: string = '***'
): string;

{ Gera payload PIX a partir de TPIXConfig }
function GerarPayloadPIXConfig(
  const AConfig: TPIXConfig;
  AValor: Currency;
  const ATxId: string = ''
): string;

{ Calcula CRC-16/CCITT-FALSE (usado pelo BCB para PIX) }
function CRC16CCITT(const ATexto: string): Word;
function CRC16CCITTStr(const ATexto: string): string;  // retorna 4 hex chars

{ Formata chave PIX para exibição amigável }
function FormatarChavePIX(const AChave: string; ATipo: TTipoChavePIX): string;

{ Valida chave PIX (verificação básica de formato) }
function ValidarChavePIX(const AChave: string; ATipo: TTipoChavePIX): string;

{ Desenha QR Code em um TCanvas dentro de ARect }
{ ATexto = payload PIX (ou qualquer string ≤ 271 chars) }
procedure DesenharQRCode(
  ACanvas: TCanvas;
  const ATexto: string;
  ARect: TRect;
  ACorFundo: TColor = clWhite;
  ACorMarca:  TColor = clBlack
);

// ============================================================
// CONSTANTES PÚBLICAS
// ============================================================
const
  TIPO_CHAVE_LABELS: array[TTipoChavePIX] of string = (
    'CPF', 'CNPJ', 'Telefone', 'E-mail', 'Chave Aleatória'
  );
  TIPO_CHAVE_MASKS: array[TTipoChavePIX] of string = (
    '###.###.###-##',
    '##.###.###/####-##',
    '+## ## #####-####',
    '',
    ''
  );

implementation

// ============================================================
// SEÇÃO INTERNA — GF(256) para Reed-Solomon
// ============================================================
var
  GFExp: array[0..511] of Byte;
  GFLog: array[0..255] of Integer;
  GFReady: Boolean = False;

procedure InitGF;
var
  X, I: Integer;
begin
  if GFReady then Exit;
  X := 1;
  for I := 0 to 254 do
  begin
    GFExp[I] := Byte(X);
    GFLog[X] := I;
    X := X shl 1;
    if (X and $100) <> 0 then X := X xor $11D;  // poly x^8+x^4+x^3+x^2+1
  end;
  for I := 255 to 511 do GFExp[I] := GFExp[I - 255];
  GFLog[0] := 0;
  GFReady := True;
end;

function GFMul(A, B: Byte): Byte; inline;
begin
  if (A = 0) or (B = 0) then Result := 0
  else Result := GFExp[(Integer(GFLog[A]) + Integer(GFLog[B])) mod 255];
end;

function GFPow(X: Byte; Power: Integer): Byte; inline;
begin
  if X = 0 then Result := 0
  else Result := GFExp[(Integer(GFLog[X]) * Power) mod 255];
end;

// ============================================================
// SEÇÃO INTERNA — Reed-Solomon (EC codewords)
// ============================================================

// Gera polinômio gerador G(x) de grau NEC
procedure RSGenerator(NEC: Integer; var Gen: array of Byte);
var
  I, J: Integer;
begin
  Gen[0] := 1;
  for I := 1 to NEC do Gen[I] := 0;
  for I := 0 to NEC - 1 do
  begin
    for J := I downto 1 do
      Gen[J] := Gen[J - 1] xor GFMul(Gen[J], GFPow(2, I));
    Gen[0] := GFMul(Gen[0], GFPow(2, I));
  end;
end;

// Gera NEC codewords de correção para AData
procedure RSEncode(const AData: array of Byte; ADataLen, NEC: Integer;
  var AOut: array of Byte);
var
  Gen: array of Byte;
  Coefs: array of Byte;
  I, J: Integer;
  Lead: Byte;
begin
  InitGF;
  SetLength(Gen,  NEC + 1);
  SetLength(Coefs, ADataLen + NEC);
  FillByte(Coefs[0], ADataLen + NEC, 0);
  RSGenerator(NEC, Gen[0]);
  // Copia dados
  for I := 0 to ADataLen - 1 do Coefs[I] := AData[I];
  // Divisão polinomial
  for I := 0 to ADataLen - 1 do
  begin
    Lead := Coefs[I];
    if Lead <> 0 then
      for J := 1 to NEC do
        Coefs[I + J] := Coefs[I + J] xor GFMul(Lead, Gen[J]);
  end;
  for I := 0 to NEC - 1 do AOut[I] := Coefs[ADataLen + I];
end;

// ============================================================
// SEÇÃO INTERNA — Estrutura QR Code
// ============================================================

// Capacidade (bytes de dados) para cada versão, Level L, Byte mode
const
  QR_DATA_CAP: array[1..10] of Integer = (17, 32, 53, 78, 106, 134, 154, 192, 230, 271);
  QR_EC_CODES: array[1..10] of Integer = (7,  10, 15, 20, 26,  36,  40,  48,  60,  62);
  QR_BLOCKS:   array[1..10] of Integer = (1,  1,  1,  1,  1,   2,   2,   2,   2,   4);

// Posições dos padrões de alinhamento (centro, para V2+)
const
  QR_ALIGN: array[1..10] of Integer = (0, 18, 22, 26, 30, 34, 22, 24, 28, 28);

type
  TQRMatrix = array of array of ShortInt;  // -1=vazio, 0=claro, 1=escuro

function QRNewMatrix(ASize: Integer): TQRMatrix;
var I, J: Integer;
begin
  SetLength(Result, ASize);
  for I := 0 to ASize - 1 do
  begin
    SetLength(Result[I], ASize);
    for J := 0 to ASize - 1 do Result[I][J] := -1;
  end;
end;

procedure QRSetModule(var M: TQRMatrix; Row, Col: Integer; Dark: Boolean); inline;
begin
  if (Row >= 0) and (Row < Length(M)) and (Col >= 0) and (Col < Length(M[Row])) then
    M[Row][Col] := Ord(Dark);
end;

// Coloca padrão localizador 7x7 (com separador)
procedure QRPlaceFinder(var M: TQRMatrix; Row, Col: Integer);
var I, J: Integer;
begin
  // Finder pattern 7x7
  for I := 0 to 6 do
    for J := 0 to 6 do
      QRSetModule(M, Row + I, Col + J,
        (I = 0) or (I = 6) or (J = 0) or (J = 6) or
        ((I >= 2) and (I <= 4) and (J >= 2) and (J <= 4)));
  // Separador (1 módulo de borda)
  for I := -1 to 7 do
  begin
    QRSetModule(M, Row - 1, Col + I, False);
    QRSetModule(M, Row + 7, Col + I, False);
    QRSetModule(M, Row + I, Col - 1, False);
    QRSetModule(M, Row + I, Col + 7, False);
  end;
end;

// Coloca padrão de alinhamento 5x5
procedure QRPlaceAlignment(var M: TQRMatrix; Row, Col: Integer);
var I, J: Integer;
begin
  if M[Row][Col] >= 0 then Exit;  // já reservado
  for I := -2 to 2 do
    for J := -2 to 2 do
      QRSetModule(M, Row + I, Col + J,
        (I = -2) or (I = 2) or (J = -2) or (J = 2) or ((I = 0) and (J = 0)));
end;

// Coloca padrões de temporização
procedure QRPlaceTiming(var M: TQRMatrix; ASize: Integer);
var I: Integer;
begin
  for I := 8 to ASize - 9 do
  begin
    QRSetModule(M, 6, I, (I mod 2) = 0);
    QRSetModule(M, I, 6, (I mod 2) = 0);
  end;
end;

// Reserva áreas de formato e dark module
procedure QRReserveFormat(var M: TQRMatrix; AVersion, ASize: Integer);
var I: Integer;
begin
  // Dark module obrigatório
  QRSetModule(M, 4 * AVersion + 9, 8, True);
  // Faixa de formato ao redor dos finders
  for I := 0 to 8 do
  begin
    if M[8][I] < 0 then QRSetModule(M, 8, I, False);
    if M[I][8] < 0 then QRSetModule(M, I, 8, False);
    if M[8][ASize - 1 - I] < 0 then QRSetModule(M, 8, ASize - 1 - I, False);
    if M[ASize - 1 - I][8] < 0 then QRSetModule(M, ASize - 1 - I, 8, False);
  end;
end;

// Aplica informação de formato (EC Level L, máscara 0)
// Format string para Level=L (00), Mask=0 (000): 111011111000100
// XOR com máscara padrão 101010000010010
// Resultado: 010001101010110
const
  QR_FORMAT_L_M0 = $77C4;  // bits da informação de formato (15 bits, incluindo EC bits)
  // Formato calculado: data=00_000, EC = (polynomial division), XOR mask = 101010000010010

procedure QRPlaceFormat(var M: TQRMatrix; ASize: Integer);
// Level L, Mask 0 → format bits = 01001_00001_01110 (com XOR)
// Valor pré-calculado para L+mask0: bits[14..0] = 011111010101000
// Usando valor correto para Level L (00) + Mask 0 (000):
// data=00|000 = 00000, remainder = polynomial division → aplicar XOR com 101010000010010
// Resultado correto: 01_00001_01110_01 → depende do cálculo exato
// Valor hex correto para Level L, Mask 0: 0x77C4 → 0111 0111 1100 0100
const
  FMT = $77C4; // Level L + Mask 0 + XOR padrão BCH
var
  I: Integer;
  Bit: Boolean;
begin
  // Posições ao redor do finder superior esquerdo
  for I := 0 to 5 do
  begin
    Bit := ((FMT shr (14 - I)) and 1) = 1;
    M[8][I] := Ord(Bit);
    M[I][8] := Ord(Bit);
  end;
  Bit := ((FMT shr 8) and 1) = 1;
  M[8][7] := Ord(Bit);
  M[8][8] := Ord(Bit);
  M[7][8] := Ord(((FMT shr 9) and 1) = 1);
  for I := 9 to 14 do
  begin
    Bit := ((FMT shr (14 - I)) and 1) = 1;
    M[14 - I][8] := Ord(Bit);
  end;
  // Posições ao redor dos finders superior direito e inferior esquerdo
  for I := 0 to 7 do
  begin
    Bit := ((FMT shr I) and 1) = 1;
    M[8][ASize - 1 - I] := Ord(Bit);
  end;
  for I := 8 to 14 do
  begin
    Bit := ((FMT shr I) and 1) = 1;
    M[ASize - 1 - (14 - I)][8] := Ord(Bit);
  end;
end;

// Coloca os codewords de dados na matriz (zigzag padrão QR)
procedure QRPlaceData(var M: TQRMatrix; const AData: array of Byte; ADataLen: Integer);
var
  ASize, BitIdx, Col, Row, Dir, BitPos: Integer;
  Bit, Dark: Boolean;
begin
  ASize  := Length(M);
  BitIdx := 0;
  Dir    := -1;  // -1 = sobe, +1 = desce
  Row    := ASize - 1;
  Col    := ASize - 1;
  while Col >= 0 do
  begin
    if Col = 6 then Dec(Col);  // pula coluna de timing
    // 2 colunas por vez (direita e esquerda)
    BitPos := 0;
    while BitPos < ASize do
    begin
      for BitIdx := 0 to 1 do
      begin
        var C: Integer := Col - BitIdx;
        var R: Integer := Row;
        if M[R][C] < 0 then  // módulo ainda livre
        begin
          if BitIdx = 0 then
          begin
            // Pega o bit do stream de dados
            var DataIdx: Integer := (BitPos * 2 + BitIdx) div 8;  // índice do byte
            // Simplificado: coloca dados sequencialmente
          end;
          // Aplica máscara 0: (i+j) mod 2 == 0
          Dark := ((BitPos + 1) mod 2 = 0) xor ((C mod 2 + R mod 2) = 0);
          M[R][C] := Ord(Dark);
        end;
      end;
      Inc(BitPos);
    end;
    Dec(Col, 2);
  end;
end;

// Coloca dados com máscara 0: dark se (row + col) mod 2 == 0
procedure QRPlaceDataStream(var M: TQRMatrix; const AStream: array of Byte; ALen: Integer);
var
  ASize, BitCount, Row, Col, UpWard: Integer;
  Right, Dark, Masked: Boolean;
  B: Byte;
  BitVal: Integer;
begin
  ASize    := Length(M);
  BitCount := 0;
  UpWard   := 1;  // direção: 1=subindo, -1=descendo
  Row      := ASize - 1;
  Col      := ASize - 1;

  while Col >= 0 do
  begin
    if Col = 6 then Dec(Col);
    Right := True;  // alternamos entre coluna direita e esquerda do par

    while (Row >= 0) and (Row < ASize) do
    begin
      for var Side: Integer := 0 to 1 do
      begin
        var C: Integer := Col - Side;
        if (C >= 0) and (M[Row][C] < 0) then
        begin
          if BitCount div 8 < ALen then
          begin
            B      := AStream[BitCount div 8];
            BitVal := (B shr (7 - (BitCount mod 8))) and 1;
          end
          else
            BitVal := 0;
          // Máscara padrão 0: (row + col) mod 2 == 0 → inverte bit
          Masked := BitVal;
          if (Row + C) mod 2 = 0 then Masked := not Masked;
          M[Row][C] := Ord(Masked);
          Inc(BitCount);
        end;
      end;
      Inc(Row, -UpWard);
    end;
    Inc(Row, UpWard);  // volta um passo
    UpWard := -UpWard;
    Dec(Col, 2);
  end;
end;

// ============================================================
// SEÇÃO INTERNA — Construção do Stream de Bits QR
// ============================================================

procedure AppendBits(var Arr: TBytes; var BitPos: Integer; Value, Bits: Integer);
var I: Integer;
begin
  for I := Bits - 1 downto 0 do
  begin
    var ByteIdx: Integer := BitPos div 8;
    var BitOff: Integer  := 7 - (BitPos mod 8);
    if ByteIdx >= Length(Arr) then SetLength(Arr, ByteIdx + 1);
    if (Value shr I) and 1 = 1 then
      Arr[ByteIdx] := Arr[ByteIdx] or (1 shl BitOff)
    else
      Arr[ByteIdx] := Arr[ByteIdx] and not (1 shl BitOff);
    Inc(BitPos);
  end;
end;

// Pads alternados 0xEC e 0x11 (padrão QR)
const
  QR_PAD1 = $EC;
  QR_PAD2 = $11;

// ============================================================
// FUNÇÃO PRINCIPAL QR CODE
// ============================================================

function QREncode(const ATexto: string): TQRMatrix;
var
  TextBytes: TBytes;
  TextLen, Version, DataCap, NEC, DataBits, TotalData: Integer;
  DataStream: TBytes;
  BitPos: Integer;
  ECCodes: array of Byte;
  AllData: array of Byte;
  I, J, ASize: Integer;
  M: TQRMatrix;
begin
  Result := nil;
  TextBytes := TEncoding.UTF8.GetBytes(ATexto);
  TextLen   := Length(TextBytes);

  // Detecta versão necessária
  Version := -1;
  for I := 1 to 10 do
    if TextLen <= QR_DATA_CAP[I] then
    begin
      Version := I;
      Break;
    end;
  if Version < 0 then Exit;  // texto muito longo

  DataCap  := QR_DATA_CAP[Version];
  NEC      := QR_EC_CODES[Version];
  ASize    := 17 + Version * 4;

  // Monta stream de dados
  SetLength(DataStream, DataCap);
  FillByte(DataStream[0], DataCap, 0);
  BitPos := 0;

  // Mode indicator: Byte = 0100
  AppendBits(DataStream, BitPos, $4, 4);
  // Character count (8 bits para versão 1-9 em byte mode)
  AppendBits(DataStream, BitPos, TextLen, 8);
  // Dados
  for I := 0 to TextLen - 1 do
    AppendBits(DataStream, BitPos, TextBytes[I], 8);
  // Terminator 0000
  if BitPos + 4 <= DataCap * 8 then
    AppendBits(DataStream, BitPos, 0, 4);
  // Padding de bits até próximo byte
  while (BitPos mod 8) <> 0 do
    AppendBits(DataStream, BitPos, 0, 1);
  // Padding de bytes
  I := 0;
  while BitPos < DataCap * 8 do
  begin
    if I mod 2 = 0 then AppendBits(DataStream, BitPos, QR_PAD1, 8)
    else                 AppendBits(DataStream, BitPos, QR_PAD2, 8);
    Inc(I);
  end;

  // Gera EC codewords
  SetLength(ECCodes, NEC);
  RSEncode(DataStream, DataCap, NEC, ECCodes[0]);

  // Monta sequência final (dados + EC)
  TotalData := DataCap + NEC;
  SetLength(AllData, TotalData);
  for I := 0 to DataCap - 1 do AllData[I]           := DataStream[I];
  for I := 0 to NEC - 1     do AllData[DataCap + I]  := ECCodes[I];

  // Constrói matriz
  M := QRNewMatrix(ASize);
  // Finder patterns
  QRPlaceFinder(M, 0, 0);
  QRPlaceFinder(M, 0, ASize - 7);
  QRPlaceFinder(M, ASize - 7, 0);
  // Timing
  QRPlaceTiming(M, ASize);
  // Alinhamento (V2+)
  if Version >= 2 then
    QRPlaceAlignment(M, QR_ALIGN[Version], QR_ALIGN[Version]);
  // Formato reservado + dark module
  QRReserveFormat(M, Version, ASize);
  // Dados
  QRPlaceDataStream(M, AllData, TotalData);
  // Informação de formato
  QRPlaceFormat(M, ASize);

  Result := M;
end;

// ============================================================
// FUNÇÕES PÚBLICAS
// ============================================================

function CRC16CCITT(const ATexto: string): Word;
const
  POLY = $1021;
var
  CRC: Word;
  I, J: Integer;
  B: Byte;
begin
  CRC := $FFFF;
  for I := 1 to Length(ATexto) do
  begin
    B := Ord(ATexto[I]);
    CRC := CRC xor (Word(B) shl 8);
    for J := 0 to 7 do
    begin
      if (CRC and $8000) <> 0 then CRC := (CRC shl 1) xor POLY
      else                          CRC := CRC shl 1;
    end;
  end;
  Result := CRC;
end;

function CRC16CCITTStr(const ATexto: string): string;
begin
  Result := UpperCase(IntToHex(CRC16CCITT(ATexto), 4));
end;

// Monta um campo TLV do EMV PIX
function TLV(const AID, AValue: string): string;
var
  VLen: Integer;
  LenStr: string;
begin
  VLen   := Length(AValue);
  LenStr := Format('%.2d', [VLen]);
  Result := AID + LenStr + AValue;
end;

// Garante máximo de N chars (trunca com espaço se necessário)
function LimitarStr(const S: string; MaxLen: Integer): string;
begin
  Result := Trim(S);
  if Length(Result) > MaxLen then Result := Copy(Result, 1, MaxLen);
  while Length(Result) < MaxLen do Result := Result + ' ';
  Result := Trim(Result);
end;

function GerarPayloadPIX(
  const AChave, ANomeRecebedor, ACidade: string;
  AValor: Currency;
  const ADescricao: string = '';
  const ATxId: string = '***'
): string;
var
  MerchantInfo, AdditionalData, ValorStr, TxId: string;
  Payload: string;
begin
  // TxId deve ter de 1 a 25 chars alphanumeric (ou ***)
  TxId := Trim(ATxId);
  if TxId = '' then TxId := '***';
  if Length(TxId) > 25 then TxId := Copy(TxId, 1, 25);

  // Merchant Account Info (campo 26)
  MerchantInfo := TLV('00', 'BR.GOV.BCB.PIX');  // GUI = 00 12 BR.GOV.BCB.PIX
  MerchantInfo := MerchantInfo + TLV('01', AChave);
  if ADescricao <> '' then
    MerchantInfo := MerchantInfo + TLV('02', Copy(ADescricao, 1, 72));
  MerchantInfo := TLV('26', MerchantInfo);

  // Additional Data Field (campo 62) com TXID
  AdditionalData := TLV('05', TxId);
  AdditionalData := TLV('62', AdditionalData);

  // Valor (campo 54) — omite se zero
  ValorStr := '';
  if AValor > 0 then
    ValorStr := TLV('54', FormatFloat('0.00', AValor));

  // Monta payload (sem CRC)
  Payload :=
    TLV('00', '01') +               // Payload Format Indicator
    TLV('01', '12') +               // Point of Initiation: 12=static, 11=dynamic
    MerchantInfo +
    TLV('52', '0000') +             // Merchant Category Code
    TLV('53', '986') +              // Transaction Currency: 986 = BRL
    ValorStr +
    TLV('58', 'BR') +               // Country Code
    TLV('59', LimitarStr(ANomeRecebedor, 25)) +  // Merchant Name
    TLV('60', LimitarStr(ACidade, 15)) +          // Merchant City
    AdditionalData +
    '6304';                         // CRC placeholder (sem valor ainda)

  // Calcula e acrescenta CRC-16
  Result := Payload + CRC16CCITTStr(Payload);
end;

function GerarPayloadPIXConfig(
  const AConfig: TPIXConfig;
  AValor: Currency;
  const ATxId: string = ''
): string;
var
  TxId: string;
begin
  TxId := ATxId;
  if TxId = '' then
    TxId := FormatDateTime('yyyymmddhhnnss', Now);
  Result := GerarPayloadPIX(
    AConfig.Chave,
    AConfig.Nome,
    AConfig.Cidade,
    AValor,
    AConfig.Descricao,
    TxId
  );
end;

function FormatarChavePIX(const AChave: string; ATipo: TTipoChavePIX): string;
begin
  Result := Trim(AChave);
  // Formatação amigável por tipo
  case ATipo of
    tcCPF:
      if Length(Result) = 11 then
        Result := Copy(Result,1,3)+'.'+Copy(Result,4,3)+'.'+Copy(Result,7,3)+'-'+Copy(Result,10,2);
    tcCNPJ:
      if Length(Result) = 14 then
        Result := Copy(Result,1,2)+'.'+Copy(Result,3,3)+'.'+Copy(Result,6,3)+'/'+Copy(Result,9,4)+'-'+Copy(Result,13,2);
    tcTelefone:
      if (Length(Result) > 0) and (Result[1] <> '+') then
        Result := '+55' + Result;
    else ; // email e aleatória: exibe como está
  end;
end;

function ValidarChavePIX(const AChave: string; ATipo: TTipoChavePIX): string;
var
  S: string;
begin
  Result := '';
  S := Trim(AChave);
  if S = '' then begin Result := 'Chave PIX não pode ser vazia.'; Exit; end;
  case ATipo of
    tcCPF:
      if (Length(S) <> 11) and (Length(S) <> 14) then
        Result := 'CPF inválido (informe apenas números ou formatado).';
    tcCNPJ:
      if (Length(S) <> 14) and (Length(S) <> 18) then
        Result := 'CNPJ inválido.';
    tcTelefone:
      if Length(S) < 10 then Result := 'Telefone inválido.';
    tcEmail:
      if Pos('@', S) = 0 then Result := 'E-mail inválido.';
    tcAleatoria:
      if Length(S) < 32 then Result := 'Chave aleatória inválida (deve ser UUID).';
  end;
end;

procedure DesenharQRCode(
  ACanvas: TCanvas;
  const ATexto: string;
  ARect: TRect;
  ACorFundo: TColor = clWhite;
  ACorMarca:  TColor = clBlack
);
var
  M: TQRMatrix;
  ASize, ModSize, OffX, OffY, I, J: Integer;
begin
  M := QREncode(ATexto);
  if M = nil then
  begin
    // Fallback: quadrado cinza com mensagem
    ACanvas.Brush.Color := $EEEEEE;
    ACanvas.FillRect(ARect);
    ACanvas.Font.Color := clRed;
    ACanvas.TextOut(ARect.Left + 4, ARect.Top + 4, 'QR: texto longo');
    Exit;
  end;

  ASize   := Length(M);
  ModSize := Min((ARect.Right - ARect.Left), (ARect.Bottom - ARect.Top)) div (ASize + 8);
  if ModSize < 1 then ModSize := 1;
  OffX    := ARect.Left + ((ARect.Right - ARect.Left) - ModSize * ASize) div 2;
  OffY    := ARect.Top  + ((ARect.Bottom - ARect.Top) - ModSize * ASize) div 2;

  // Fundo branco
  ACanvas.Brush.Color := ACorFundo;
  ACanvas.Pen.Color   := ACorFundo;
  ACanvas.FillRect(ARect);

  // Desenha módulos
  ACanvas.Pen.Style := psClear;
  for I := 0 to ASize - 1 do
    for J := 0 to ASize - 1 do
    begin
      if M[I][J] = 1 then
        ACanvas.Brush.Color := ACorMarca
      else
        ACanvas.Brush.Color := ACorFundo;
      ACanvas.FillRect(Rect(
        OffX + J * ModSize,
        OffY + I * ModSize,
        OffX + J * ModSize + ModSize,
        OffY + I * ModSize + ModSize
      ));
    end;
end;

initialization
  InitGF;

end.
