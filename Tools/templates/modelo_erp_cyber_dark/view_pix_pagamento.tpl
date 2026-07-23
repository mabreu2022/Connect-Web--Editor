unit uViewPixPagamento;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} }
{ VIEW — Dialog de Recebimento via PIX }
{ Exibe: QR Code desenhado em canvas + Copia e Cola + Timer de expiração }

interface

uses
  Classes, SysUtils, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, Buttons, ComCtrls, LCLIntf, Clipbrd,
  uPixUtils,
  uTheme;

type
  { TViewPixPagamento — Dialog de Cobrança PIX }
  TViewPixPagamento = class(TForm)
    // === PAINEL SUPERIOR — Valor e status ===
    pnlTopo: TPanel;
      pnlIconPix: TPanel;
        lblIconPix: TLabel;
      pnlTopoInfo: TPanel;
        lblTituloCobranca: TLabel;
        lblValor: TLabel;
        lblStatus: TLabel;
    // === CORPO CENTRAL ===
    pnlCorpo: TPanel;
      // QR Code (canvas)
      imgQRCode: TImage;
      // Linha separadora
      pnlSep: TPanel;
      // Copia e Cola
      pnlCopiaECola: TPanel;
        lblCopiaLegenda: TLabel;
        edtPayload: TEdit;
        btnCopiar: TButton;
    // === TIMER E STATUS ===
    pnlTimer: TPanel;
      pbTimer: TProgressBar;
      lblTempoRestante: TLabel;
      lblInstrucoes: TLabel;
    // === RODAPÉ — Botões ===
    pnlBotoes: TPanel;
      btnConfirmar: TBitBtn;
      btnCancelar: TBitBtn;
    // === Timer de contagem regressiva ===
    tmrContagem: TTimer;
    tmrExpirar: TTimer;

    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure imgQRCodePaint(Sender: TObject);
    procedure btnCopiarClick(Sender: TObject);
    procedure btnConfirmarClick(Sender: TObject);
    procedure btnCancelarClick(Sender: TObject);
    procedure tmrContagemTimer(Sender: TObject);
    procedure tmrExpirarTimer(Sender: TObject);
  private
    FValor:     Currency;
    FConfig:    TPIXConfig;
    FPayload:   string;
    FTxId:      string;
    FExpirarEm: Integer;  // segundos para expirar (padrão 300 = 5min)
    FSegundosRestantes: Integer;
    FPago:      Boolean;

    procedure MontarCobranca;
    procedure AtualizarQRCode;
    procedure AtualizarTimer;
    procedure ConfigurarCores;
    procedure AnimarIconPix;
  public
    property Valor:     Currency   read FValor  write FValor;
    property Config:    TPIXConfig read FConfig write FConfig;
    property TxId:      string     read FTxId   write FTxId;
    property ExpirarEm: Integer    read FExpirarEm write FExpirarEm;
    property Pago:      Boolean    read FPago;
  end;

implementation

{$R *.lfm}

{ TViewPixPagamento }

procedure TViewPixPagamento.FormCreate(Sender: TObject);
begin
  FExpirarEm := 300;  // 5 minutos padrão
  FPago      := False;
  ConfigurarCores;
end;

procedure TViewPixPagamento.FormDestroy(Sender: TObject);
begin
  tmrContagem.Enabled := False;
  tmrExpirar.Enabled  := False;
end;

procedure TViewPixPagamento.FormShow(Sender: TObject);
begin
  MontarCobranca;
  AtualizarQRCode;
  // Inicia contagem regressiva
  FSegundosRestantes      := FExpirarEm;
  pbTimer.Max             := FExpirarEm;
  pbTimer.Position        := FExpirarEm;
  tmrContagem.Interval    := 1000;
  tmrContagem.Enabled     := True;
  AtualizarTimer;
  // Blink do ícone PIX
  tmrExpirar.Interval := 800;
  tmrExpirar.Enabled  := True;
end;

procedure TViewPixPagamento.ConfigurarCores;
begin
  Color := CLR_SIDE_BG;
  BorderStyle := bsDialog;
  Position    := poMainFormCenter;

  pnlTopo.Color  := $2D8A6B;  // verde PIX
  pnlIconPix.Color := $2D8A6B;
  pnlTopoInfo.Color := $2D8A6B;
  pnlCorpo.Color := CLR_CARD_BG;
  pnlSep.Color   := $DDDDDD;
  pnlCopiaECola.Color := CLR_CONTENT_BG;
  pnlTimer.Color := CLR_SIDE_BG;
  pnlBotoes.Color := CLR_SIDE_BG;

  lblIconPix.Font.Color  := clWhite;
  lblIconPix.Font.Size   := 48;
  lblIconPix.Transparent := True;

  lblTituloCobranca.Font.Color := clWhite;
  lblTituloCobranca.Font.Style := [fsBold];
  lblValor.Font.Color  := clWhite;
  lblValor.Font.Size   := 28;
  lblValor.Font.Style  := [fsBold];
  lblStatus.Font.Color := $AAFFAA;
  lblStatus.Font.Style := [fsBold];

  lblCopiaLegenda.Font.Color := CLR_TEXT_MUTED;
  edtPayload.Color     := $1E1E2E;
  edtPayload.Font.Color := $88AAFF;
  edtPayload.Font.Name  := 'Consolas';

  btnCopiar.Color      := $3A7BAF;
  btnCopiar.Font.Color := clWhite;
  btnCopiar.Font.Style := [fsBold];

  lblTempoRestante.Font.Color := $FFCC44;
  lblTempoRestante.Font.Style := [fsBold];
  lblInstrucoes.Font.Color    := $AAAACC;

  pbTimer.Color := $44AA66;

  btnConfirmar.Color      := $28A745;
  btnConfirmar.Font.Color := clWhite;
  btnConfirmar.Font.Style := [fsBold];

  imgQRCode.Color := clWhite;
end;

procedure TViewPixPagamento.MontarCobranca;
var
  TxIdFinal: string;
begin
  TxIdFinal := FTxId;
  if TxIdFinal = '' then
    TxIdFinal := FormatDateTime('yyyymmddhhnnsszzz', Now);

  FPayload := GerarPayloadPIXConfig(FConfig, FValor, TxIdFinal);
  edtPayload.Text := FPayload;

  lblValor.Caption := 'R$ ' + FormatFloat('#,##0.00', FValor);
  lblTituloCobranca.Caption :=
    'PIX — ' + TIPO_CHAVE_LABELS[FConfig.TipoChave] + ': ' +
    FormatarChavePIX(FConfig.Chave, FConfig.TipoChave);
  lblStatus.Caption := '⏳  Aguardando pagamento...';
  Caption := 'Cobrança PIX — R$ ' + FormatFloat('#,##0.00', FValor);
end;

procedure TViewPixPagamento.AtualizarQRCode;
var
  ARect: TRect;
begin
  imgQRCode.Picture.Bitmap.Width  := imgQRCode.Width;
  imgQRCode.Picture.Bitmap.Height := imgQRCode.Height;
  ARect := Rect(8, 8, imgQRCode.Width - 8, imgQRCode.Height - 8);
  imgQRCode.Picture.Bitmap.Canvas.Brush.Color := clWhite;
  imgQRCode.Picture.Bitmap.Canvas.FillRect(
    Rect(0, 0, imgQRCode.Width, imgQRCode.Height));
  DesenharQRCode(
    imgQRCode.Picture.Bitmap.Canvas,
    FPayload,
    ARect,
    clWhite,
    clBlack
  );
  imgQRCode.Refresh;
end;

procedure TViewPixPagamento.imgQRCodePaint(Sender: TObject);
begin
  // QR já renderizado no bitmap; não precisa repintar aqui
end;

procedure TViewPixPagamento.AtualizarTimer;
var
  Min, Seg: Integer;
begin
  Min := FSegundosRestantes div 60;
  Seg := FSegundosRestantes mod 60;
  lblTempoRestante.Caption := Format('⏱  Expira em  %d:%2.2d', [Min, Seg]);
  pbTimer.Position := FSegundosRestantes;
  if FSegundosRestantes <= 30 then
  begin
    pbTimer.Color := $4444CC;  // azul→urgente
    lblTempoRestante.Font.Color := $FF4444;
  end;
end;

procedure TViewPixPagamento.tmrContagemTimer(Sender: TObject);
begin
  if FSegundosRestantes <= 0 then
  begin
    tmrContagem.Enabled := False;
    tmrExpirar.Enabled  := False;
    lblStatus.Caption   := '❌  PIX expirado! Gere uma nova cobrança.';
    lblStatus.Font.Color := $FF4444;
    btnConfirmar.Enabled := False;
    Exit;
  end;
  Dec(FSegundosRestantes);
  AtualizarTimer;
end;

procedure TViewPixPagamento.tmrExpirarTimer(Sender: TObject);
begin
  // Simples blink no ícone PIX (indica que está aguardando)
  AnimarIconPix;
end;

procedure TViewPixPagamento.AnimarIconPix;
begin
  if pnlIconPix.Color = $2D8A6B then
    pnlIconPix.Color := $22AA77
  else
    pnlIconPix.Color := $2D8A6B;
end;

procedure TViewPixPagamento.btnCopiarClick(Sender: TObject);
begin
  if FPayload = '' then Exit;
  Clipboard.AsText := FPayload;
  lblCopiaLegenda.Caption := '✓ Payload PIX copiado! Cole no app do seu banco.';
  lblCopiaLegenda.Font.Color := $44FF44;
  // Restaura após 3 segundos (via um TTimer simples)
  btnCopiar.Caption := '✓ Copiado!';
  btnCopiar.Color   := $28A745;
  Application.ProcessMessages;
  Sleep(2000);
  btnCopiar.Caption := '📋 Copiar';
  btnCopiar.Color   := $3A7BAF;
  lblCopiaLegenda.Caption := '💡 Copia e Cola (escaneie o QR ou copie o código):';
  lblCopiaLegenda.Font.Color := CLR_TEXT_MUTED;
end;

procedure TViewPixPagamento.btnConfirmarClick(Sender: TObject);
begin
  // Em produção: verificar via API PIX (webhook, polling Banco Central ou PSP)
  // Aqui, confirmação manual pelo operador
  if MessageDlg(
    'Confirmar recebimento do PIX?'#13#10 +
    'Valor: R$ ' + FormatFloat('#,##0.00', FValor) + #13#10 +
    'Verifique no app do banco antes de confirmar.',
    mtConfirmation, [mbYes, mbNo], 0) = mrYes then
  begin
    FPago := True;
    tmrContagem.Enabled := False;
    tmrExpirar.Enabled  := False;
    lblStatus.Caption   := '✅  Pagamento confirmado!';
    lblStatus.Font.Color := $AAFFAA;
    ModalResult := mrOk;
  end;
end;

procedure TViewPixPagamento.btnCancelarClick(Sender: TObject);
begin
  tmrContagem.Enabled := False;
  tmrExpirar.Enabled  := False;
  FPago := False;
  ModalResult := mrCancel;
end;

end.
