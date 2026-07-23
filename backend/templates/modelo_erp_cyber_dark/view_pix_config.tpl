unit uViewPixConfig;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} }
{ VIEW — Tela de Configuração da Chave PIX }
{ Permite configurar: tipo de chave, valor, nome recebedor, cidade, CNPJ }

interface

uses
  Classes, SysUtils, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, Buttons, IniFiles,
  uPixUtils,
  uTheme;

type
  { TViewPixConfig — Configuração completa da integração PIX }
  TViewPixConfig = class(TForm)
    // === CABEÇALHO ===
    pnlHeader: TPanel;
      lblHeaderIcon: TLabel;
      lblHeaderTitulo: TLabel;
      lblHeaderDesc: TLabel;
    // === FORMULÁRIO ===
    pnlForm: TPanel;
      // Status ON/OFF
      pnlPixAtivo: TPanel;
        chkPixAtivo: TCheckBox;
        lblPixAtivoDesc: TLabel;
      // Separador visual
      pnlSep1: TPanel;
      // Tipo de chave
      lblTipoChave: TLabel;
      cmbTipoChave: TComboBox;
      // Chave PIX
      lblChavePIX: TLabel;
      edtChavePIX: TEdit;
      lblChaveDica: TLabel;
      // Nome do recebedor
      lblNomeRecebedor: TLabel;
      edtNomeRecebedor: TEdit;
      lblNomeDica: TLabel;
      // Cidade
      lblCidade: TLabel;
      edtCidade: TEdit;
      // CNPJ (opcional)
      lblCNPJ: TLabel;
      edtCNPJ: TEdit;
      // Descrição default
      lblDescricao: TLabel;
      edtDescricao: TEdit;
      // Tempo de expiração do QR
      lblExpiracao: TLabel;
      spnExpiracao: TSpinEdit;
      lblExpiracaoSufixo: TLabel;
      // Separador
      pnlSep2: TPanel;
      // Preview da chave
      pnlPreview: TPanel;
        lblPreviewTitulo: TLabel;
        lblPreviewChave: TLabel;
        lblPreviewNome: TLabel;
        lblPreviewValidacao: TLabel;
      // Teste: gera payload de exemplo
      pnlTeste: TPanel;
        lblTesteValor: TLabel;
        edtTesteValor: TEdit;
        btnTestarPayload: TButton;
        mmoTestePayload: TMemo;
    // === BOTÕES ===
    pnlBotoes: TPanel;
      btnSalvar: TBitBtn;
      btnCancelar: TBitBtn;

    procedure FormCreate(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure cmbTipoChaveChange(Sender: TObject);
    procedure edtChavePIXChange(Sender: TObject);
    procedure edtNomeRecebedorChange(Sender: TObject);
    procedure chkPixAtivoChange(Sender: TObject);
    procedure btnSalvarClick(Sender: TObject);
    procedure btnCancelarClick(Sender: TObject);
    procedure btnTestarPayloadClick(Sender: TObject);
  private
    FArquivoINI: string;

    procedure CarregarConfig;
    procedure SalvarConfig;
    procedure AtualizarDica;
    procedure AtualizarPreview;
    function  ValidarFormulario: string;
    procedure ConfigurarCores;
    function  ObterConfig: TPIXConfig;
    procedure AplicarConfig(const AConfig: TPIXConfig);
  public
    property ArquivoINI: string read FArquivoINI write FArquivoINI;
  end;

const
  // Seções e chaves do INI
  INI_SEC_PIX     = 'PIX';
  INI_KEY_ATIVO   = 'Ativo';
  INI_KEY_TIPO    = 'TipoChave';
  INI_KEY_CHAVE   = 'Chave';
  INI_KEY_NOME    = 'NomeRecebedor';
  INI_KEY_CIDADE  = 'Cidade';
  INI_KEY_CNPJ    = 'CNPJ';
  INI_KEY_DESC    = 'Descricao';
  INI_KEY_EXPIRA  = 'ExpiracaoSegundos';

implementation

{$R *.lfm}

{ TViewPixConfig }

procedure TViewPixConfig.FormCreate(Sender: TObject);
var T: TTipoChavePIX;
begin
  // Preenche ComboBox de tipos
  cmbTipoChave.Items.Clear;
  for T := Low(TTipoChavePIX) to High(TTipoChavePIX) do
    cmbTipoChave.Items.Add(TIPO_CHAVE_LABELS[T]);
  cmbTipoChave.ItemIndex := 0;

  spnExpiracao.MinValue := 30;
  spnExpiracao.MaxValue := 3600;
  spnExpiracao.Value    := 300;  // 5 minutos

  ConfigurarCores;
end;

procedure TViewPixConfig.FormShow(Sender: TObject);
begin
  if FArquivoINI <> '' then CarregarConfig;
  AtualizarDica;
  AtualizarPreview;
end;

procedure TViewPixConfig.ConfigurarCores;
begin
  Color := CLR_SIDE_BG;

  pnlHeader.Color      := $2D8A6B;   // verde PIX
  pnlForm.Color        := CLR_CONTENT_BG;
  pnlPixAtivo.Color    := $1A3A2A;
  pnlPreview.Color     := $1E1E2E;
  pnlTeste.Color       := $1E1E2E;
  pnlBotoes.Color      := CLR_SIDE_BG;
  pnlSep1.Color        := $3A5A4A;
  pnlSep2.Color        := $3A5A4A;

  lblHeaderIcon.Font.Color  := clWhite;
  lblHeaderTitulo.Font.Color := clWhite;
  lblHeaderTitulo.Font.Style := [fsBold];
  lblHeaderDesc.Font.Color  := $AAFFCC;

  chkPixAtivo.Font.Color  := clWhite;
  chkPixAtivo.Font.Style  := [fsBold];
  lblPixAtivoDesc.Font.Color := $88AAAA;

  // Labels do formulário
  var Labels: array of TLabel := [
    lblTipoChave, lblChavePIX, lblNomeRecebedor, lblCidade, lblCNPJ, lblDescricao, lblExpiracao
  ];
  var L: TLabel;
  for L in Labels do begin L.Font.Color := $CCCCCC; L.Transparent := True; end;

  lblChaveDica.Font.Color   := $888899;
  lblNomeDica.Font.Color    := $888899;
  lblExpiracaoSufixo.Font.Color := $888899;

  // Edits com tema escuro
  var Edits: array of TEdit := [edtChavePIX, edtNomeRecebedor, edtCidade, edtCNPJ, edtDescricao, edtTesteValor];
  var E: TEdit;
  for E in Edits do
  begin
    E.Color := $2D2D3D;
    E.Font.Color := clWhite;
    E.Font.Name  := 'Segoe UI';
  end;
  cmbTipoChave.Color := $2D2D3D;
  cmbTipoChave.Font.Color := clWhite;

  // Preview
  lblPreviewTitulo.Font.Color := $AAAACC;
  lblPreviewTitulo.Font.Style := [fsBold];
  lblPreviewChave.Font.Color  := $44FFAA;
  lblPreviewChave.Font.Name   := 'Consolas';
  lblPreviewChave.Font.Style  := [fsBold];
  lblPreviewNome.Font.Color   := $CCCCCC;
  lblPreviewValidacao.Font.Color := $FF4444;

  mmoTestePayload.Color      := $0A0A1A;
  mmoTestePayload.Font.Color := $44FF88;
  mmoTestePayload.Font.Name  := 'Consolas';

  btnTestarPayload.Color      := $555577;
  btnTestarPayload.Font.Color := clWhite;

  btnSalvar.Color      := $28A745;
  btnSalvar.Font.Color := clWhite;
  btnSalvar.Font.Style := [fsBold];
end;

procedure TViewPixConfig.CarregarConfig;
var
  INI: TIniFile;
  Config: TPIXConfig;
begin
  if not FileExists(FArquivoINI) then Exit;
  INI := TIniFile.Create(FArquivoINI);
  try
    Config.Ativo     := INI.ReadBool  (INI_SEC_PIX, INI_KEY_ATIVO,  False);
    Config.TipoChave := TTipoChavePIX(INI.ReadInteger(INI_SEC_PIX, INI_KEY_TIPO, 0));
    Config.Chave     := INI.ReadString(INI_SEC_PIX, INI_KEY_CHAVE, '');
    Config.Nome      := INI.ReadString(INI_SEC_PIX, INI_KEY_NOME,  '');
    Config.Cidade    := INI.ReadString(INI_SEC_PIX, INI_KEY_CIDADE,'');
    Config.CNPJ      := INI.ReadString(INI_SEC_PIX, INI_KEY_CNPJ,  '');
    Config.Descricao := INI.ReadString(INI_SEC_PIX, INI_KEY_DESC,  '');
    spnExpiracao.Value := INI.ReadInteger(INI_SEC_PIX, INI_KEY_EXPIRA, 300);
    AplicarConfig(Config);
  finally
    INI.Free;
  end;
end;

procedure TViewPixConfig.SalvarConfig;
var
  INI: TIniFile;
  Config: TPIXConfig;
begin
  Config := ObterConfig;
  INI := TIniFile.Create(FArquivoINI);
  try
    INI.WriteBool   (INI_SEC_PIX, INI_KEY_ATIVO,  Config.Ativo);
    INI.WriteInteger(INI_SEC_PIX, INI_KEY_TIPO,   Ord(Config.TipoChave));
    INI.WriteString (INI_SEC_PIX, INI_KEY_CHAVE,  Config.Chave);
    INI.WriteString (INI_SEC_PIX, INI_KEY_NOME,   Config.Nome);
    INI.WriteString (INI_SEC_PIX, INI_KEY_CIDADE, Config.Cidade);
    INI.WriteString (INI_SEC_PIX, INI_KEY_CNPJ,   Config.CNPJ);
    INI.WriteString (INI_SEC_PIX, INI_KEY_DESC,   Config.Descricao);
    INI.WriteInteger(INI_SEC_PIX, INI_KEY_EXPIRA, spnExpiracao.Value);
  finally
    INI.Free;
  end;
end;

function TViewPixConfig.ObterConfig: TPIXConfig;
begin
  Result.Ativo     := chkPixAtivo.Checked;
  Result.TipoChave := TTipoChavePIX(cmbTipoChave.ItemIndex);
  Result.Chave     := Trim(edtChavePIX.Text);
  Result.Nome      := Trim(edtNomeRecebedor.Text);
  Result.Cidade    := Trim(edtCidade.Text);
  Result.CNPJ      := Trim(edtCNPJ.Text);
  Result.Descricao := Trim(edtDescricao.Text);
end;

procedure TViewPixConfig.AplicarConfig(const AConfig: TPIXConfig);
begin
  chkPixAtivo.Checked       := AConfig.Ativo;
  cmbTipoChave.ItemIndex    := Ord(AConfig.TipoChave);
  edtChavePIX.Text          := AConfig.Chave;
  edtNomeRecebedor.Text     := AConfig.Nome;
  edtCidade.Text            := AConfig.Cidade;
  edtCNPJ.Text              := AConfig.CNPJ;
  edtDescricao.Text         := AConfig.Descricao;
  AtualizarDica;
  AtualizarPreview;
end;

procedure TViewPixConfig.AtualizarDica;
const
  DICAS: array[TTipoChavePIX] of string = (
    'Ex: 00000000000 (somente números, 11 dígitos)',
    'Ex: 00000000000000 (somente números, 14 dígitos)',
    'Ex: +5511999999999 (com código do país)',
    'Ex: usuario@dominio.com.br',
    'UUID no formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  );
  MASKS: array[TTipoChavePIX] of string = (
    '###.###.###-##',
    '##.###.###/####-##',
    '+## (##) #####-####',
    'usuario@dominio',
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  );
var
  T: TTipoChavePIX;
begin
  T := TTipoChavePIX(cmbTipoChave.ItemIndex);
  lblChaveDica.Caption := DICAS[T] + '   Formato: ' + MASKS[T];
end;

procedure TViewPixConfig.AtualizarPreview;
var
  T: TTipoChavePIX;
  Erro: string;
begin
  T := TTipoChavePIX(cmbTipoChave.ItemIndex);
  if Trim(edtChavePIX.Text) <> '' then
    lblPreviewChave.Caption := '  ⚡ ' + TIPO_CHAVE_LABELS[T] + ': ' +
      FormatarChavePIX(edtChavePIX.Text, T)
  else
    lblPreviewChave.Caption := '  (informe a chave PIX)';

  if Trim(edtNomeRecebedor.Text) <> '' then
    lblPreviewNome.Caption := '  👤 ' + Trim(edtNomeRecebedor.Text) +
      IfThen(Trim(edtCidade.Text) <> '', ' — ' + Trim(edtCidade.Text), '')
  else
    lblPreviewNome.Caption := '  (informe o nome do recebedor)';

  // Validação
  Erro := ValidarChavePIX(edtChavePIX.Text, T);
  if Erro <> '' then
  begin
    lblPreviewValidacao.Caption := '  ⚠ ' + Erro;
    lblPreviewValidacao.Font.Color := $FF6644;
  end
  else if Trim(edtChavePIX.Text) <> '' then
  begin
    lblPreviewValidacao.Caption := '  ✓ Chave válida';
    lblPreviewValidacao.Font.Color := $44FF88;
  end
  else
    lblPreviewValidacao.Caption := '';
end;

function TViewPixConfig.ValidarFormulario: string;
var
  T: TTipoChavePIX;
  Erro: string;
begin
  Result := '';
  T := TTipoChavePIX(cmbTipoChave.ItemIndex);
  if Trim(edtChavePIX.Text) = '' then begin Result := 'Informe a chave PIX.'; Exit; end;
  Erro := ValidarChavePIX(edtChavePIX.Text, T);
  if Erro <> '' then begin Result := Erro; Exit; end;
  if Trim(edtNomeRecebedor.Text) = '' then begin Result := 'Informe o nome do recebedor.'; Exit; end;
  if Length(Trim(edtNomeRecebedor.Text)) > 25 then begin Result := 'Nome do recebedor: máximo 25 caracteres.'; Exit; end;
  if Trim(edtCidade.Text) = '' then begin Result := 'Informe a cidade.'; Exit; end;
  if Length(Trim(edtCidade.Text)) > 15 then begin Result := 'Cidade: máximo 15 caracteres.'; Exit; end;
end;

procedure TViewPixConfig.cmbTipoChaveChange(Sender: TObject);
begin
  edtChavePIX.Clear;
  AtualizarDica;
  AtualizarPreview;
end;

procedure TViewPixConfig.edtChavePIXChange(Sender: TObject);
begin
  AtualizarPreview;
end;

procedure TViewPixConfig.edtNomeRecebedorChange(Sender: TObject);
var
  S: string;
begin
  S := edtNomeRecebedor.Text;
  if Length(S) > 25 then
  begin
    edtNomeRecebedor.Text := Copy(S, 1, 25);
    edtNomeRecebedor.SelStart := 25;
  end;
  lblNomeDica.Caption := IntToStr(Length(edtNomeRecebedor.Text)) + '/25 chars (limite BCB)';
  AtualizarPreview;
end;

procedure TViewPixConfig.chkPixAtivoChange(Sender: TObject);
begin
  pnlForm.Enabled := chkPixAtivo.Checked;
  if chkPixAtivo.Checked then
    lblPixAtivoDesc.Caption := '✅ PIX habilitado — Aparecerá como opção de pagamento no PDV'
  else
    lblPixAtivoDesc.Caption := '❌ PIX desabilitado — Botão PIX não aparecerá no PDV';
end;

procedure TViewPixConfig.btnTestarPayloadClick(Sender: TObject);
var
  Config: TPIXConfig;
  Valor: Currency;
  Payload, CRC: string;
begin
  Config := ObterConfig;
  Valor  := StrToCurrDef(StringReplace(edtTesteValor.Text, ',', '.', [rfReplaceAll]), 1.00);
  Payload := GerarPayloadPIXConfig(Config, Valor, 'TESTE001');
  mmoTestePayload.Lines.Clear;
  mmoTestePayload.Lines.Add('=== PAYLOAD PIX (EMV) ===');
  mmoTestePayload.Lines.Add(Payload);
  mmoTestePayload.Lines.Add('');
  mmoTestePayload.Lines.Add('=== DETALHES ===');
  mmoTestePayload.Lines.Add('Chave: ' + Config.Chave);
  mmoTestePayload.Lines.Add('Nome: '  + Config.Nome);
  mmoTestePayload.Lines.Add('Cidade: ' + Config.Cidade);
  mmoTestePayload.Lines.Add('Valor: R$ ' + FormatFloat('#,##0.00', Valor));
  CRC := Copy(Payload, Length(Payload) - 3, 4);
  mmoTestePayload.Lines.Add('CRC-16: ' + CRC);
  mmoTestePayload.Lines.Add('Comprimento total: ' + IntToStr(Length(Payload)) + ' chars');
  mmoTestePayload.Lines.Add('');
  mmoTestePayload.Lines.Add('💡 Copie o payload acima e escaneie com um app de câmera');
  mmoTestePayload.Lines.Add('   ou use o Google Lens para testar o QR Code gerado.');
end;

procedure TViewPixConfig.btnSalvarClick(Sender: TObject);
var
  Erro: string;
begin
  Erro := ValidarFormulario;
  if Erro <> '' then
  begin
    ShowMessage('⚠ ' + Erro);
    Exit;
  end;
  if FArquivoINI <> '' then SalvarConfig;
  ModalResult := mrOk;
end;

procedure TViewPixConfig.btnCancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

end.
