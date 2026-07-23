unit uFrDashCard;

{$mode objfpc}{$H+}
{ Sistema: {{NOME_SISTEMA}} }
{ Componente: TFrDashCard — Card de KPI para o Dashboard }
{ Exibe: título, valor principal, ícone, variação e cor de status }

interface

uses
  Classes, SysUtils, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, LCLType,
  uTheme;

type
  TCardStatus = (csNeutro, csSucesso, csAviso, csPerigo, csInfo);

  TFrDashCard = class(TFrame)
    pnlCard: TPanel;
      pnlCardHeader: TPanel;
        lblTitulo: TLabel;
        lblIcone: TLabel;
      pnlCardBody: TPanel;
        lblValor: TLabel;
        lblVariacao: TLabel;
        lblSubtitulo: TLabel;
      pnlCardBarra: TPanel;  // Barra colorida no topo
    procedure pnlCardPaint(Sender: TObject);
    procedure FrameMouseEnter(Sender: TObject);
    procedure FrameMouseLeave(Sender: TObject);
  private
    FStatus: TCardStatus;
    FCorStatus: TColor;
    procedure AtualizarCor;
    function StatusParaCor(AStatus: TCardStatus): TColor;
  public
    constructor Create(AOwner: TComponent); override;

    { Configura o card com os dados a exibir }
    procedure Setup(const ATitulo, AValor, AIcone: string;
      AStatus: TCardStatus = csNeutro;
      const AVariacao: string = '';
      const ASubtitulo: string = '');

    { Atualiza apenas o valor (para refresh periódico) }
    procedure AtualizarValor(const AValor: string; AStatus: TCardStatus = csNeutro);

    property Status: TCardStatus read FStatus write FStatus;
  end;

implementation

{$R *.lfm}

constructor TFrDashCard.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  Width  := 240;
  Height := 140;
  FStatus := csNeutro;
  FCorStatus := CLR_STATUS_INFO;

  // Estilo do card
  pnlCard.Color      := CLR_CARD_BG;
  pnlCard.BevelOuter := bvNone;
  pnlCardHeader.Color := CLR_CARD_BG;
  pnlCardBody.Color   := CLR_CARD_BG;
  pnlCardBarra.Color  := CLR_STATUS_INFO;
  pnlCardBarra.Height := 4;

  // Textos
  lblTitulo.Font.Color    := CLR_TEXT_SECONDARY;
  lblTitulo.Font.Size     := FONT_SIZE_SM;
  lblValor.Font.Size      := FONT_SIZE_XL;
  lblValor.Font.Color     := CLR_TEXT_PRIMARY;
  lblValor.Font.Style     := [fsBold];
  lblVariacao.Font.Size   := FONT_SIZE_SM;
  lblSubtitulo.Font.Size  := FONT_SIZE_SM;
  lblSubtitulo.Font.Color := CLR_TEXT_MUTED;
  lblIcone.Font.Size      := 24;
end;

procedure TFrDashCard.Setup(const ATitulo, AValor, AIcone: string;
  AStatus: TCardStatus = csNeutro;
  const AVariacao: string = '';
  const ASubtitulo: string = '');
begin
  lblTitulo.Caption    := UpperCase(ATitulo);
  lblValor.Caption     := AValor;
  lblIcone.Caption     := AIcone;
  lblVariacao.Caption  := AVariacao;
  lblSubtitulo.Caption := ASubtitulo;
  FStatus   := AStatus;
  FCorStatus := StatusParaCor(AStatus);
  AtualizarCor;
end;

procedure TFrDashCard.AtualizarValor(const AValor: string; AStatus: TCardStatus = csNeutro);
begin
  lblValor.Caption := AValor;
  FStatus   := AStatus;
  FCorStatus := StatusParaCor(AStatus);
  AtualizarCor;
end;

function TFrDashCard.StatusParaCor(AStatus: TCardStatus): TColor;
begin
  case AStatus of
    csSucesso: Result := CLR_STATUS_OK;
    csAviso:   Result := CLR_STATUS_WARN;
    csPerigo:  Result := CLR_STATUS_ERR;
    csInfo:    Result := CLR_STATUS_INFO;
    else       Result := CLR_SIDE_ACTIVE;
  end;
end;

procedure TFrDashCard.AtualizarCor;
begin
  pnlCardBarra.Color   := FCorStatus;
  lblVariacao.Font.Color := FCorStatus;
  lblIcone.Font.Color  := FCorStatus;
  pnlCard.Invalidate;
end;

procedure TFrDashCard.pnlCardPaint(Sender: TObject);
begin
  // Borda fina nas laterais e fundo do card
  with pnlCard.Canvas do
  begin
    Pen.Color := CLR_CARD_BORDER;
    Pen.Width := 1;
    Brush.Style := bsClear;
    Rectangle(0, 0, pnlCard.Width - 1, pnlCard.Height - 1);
  end;
end;

procedure TFrDashCard.FrameMouseEnter(Sender: TObject);
begin
  // Sombra leve no hover (muda borda)
  pnlCard.Canvas.Pen.Color := FCorStatus;
  pnlCard.Invalidate;
end;

procedure TFrDashCard.FrameMouseLeave(Sender: TObject);
begin
  pnlCard.Canvas.Pen.Color := CLR_CARD_BORDER;
  pnlCard.Invalidate;
end;

end.
