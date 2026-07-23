unit uViewDashboard;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} — Dashboard de KPIs }

interface

uses
  Classes, SysUtils, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, Grids, ComCtrls,
  uTheme, uFrDashCard;

type
  TfrmDashboard = class(TForm)
    scbDash: TScrollBox;
      pnlKPIs: TPanel;
        cardTotal1: TFrDashCard;
        cardTotal2: TFrDashCard;
        cardTotal3: TFrDashCard;
        cardTotal4: TFrDashCard;
      pnlAtividade: TPanel;
        lblAtivTitulo: TLabel;
        grdAtividade: TStringGrid;
      pnlGraficos: TPanel;
        lblGrafTitulo: TLabel;
        imgGrafico: TImage;
    tmrRefresh: TTimer;
    procedure FormCreate(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure tmrRefreshTimer(Sender: TObject);
  private
    procedure ConfigurarCores;
    procedure ConfigurarCards;
    procedure CarregarKPIs;
    procedure CarregarAtividadeRecente;
    procedure DesenharGrafico;
    function ConsultarCount(const ASQL: string): Integer;
  end;

implementation

{$R *.lfm}

{ TfrmDashboard }

procedure TfrmDashboard.FormCreate(Sender: TObject);
begin
  ConfigurarCores;
  ConfigurarCards;

  // Grid de atividade recente
  grdAtividade.ColCount   := 4;
  grdAtividade.FixedRows  := 1;
  grdAtividade.RowCount   := 2;
  grdAtividade.Options    := grdAtividade.Options + [goRowSelect];
  grdAtividade.ColWidths[0] := 80;
  grdAtividade.ColWidths[1] := 200;
  grdAtividade.ColWidths[2] := 120;
  grdAtividade.ColWidths[3] := 80;
  grdAtividade.Cells[0,0] := 'ID';
  grdAtividade.Cells[1,0] := 'Descrição';
  grdAtividade.Cells[2,0] := 'Data/Hora';
  grdAtividade.Cells[3,0] := 'Status';
end;

procedure TfrmDashboard.FormShow(Sender: TObject);
begin
  CarregarKPIs;
  CarregarAtividadeRecente;
  DesenharGrafico;
  tmrRefresh.Enabled := True;
end;

procedure TfrmDashboard.ConfigurarCores;
begin
  Color           := CLR_CONTENT_BG;
  scbDash.Color   := CLR_CONTENT_BG;
  pnlKPIs.Color   := CLR_CONTENT_BG;
  pnlAtividade.Color := CLR_CARD_BG;
  pnlGraficos.Color  := CLR_CARD_BG;

  lblAtivTitulo.Font.Color := CLR_TEXT_PRIMARY;
  lblAtivTitulo.Font.Style := [fsBold];
  lblGrafTitulo.Font.Color := CLR_TEXT_PRIMARY;
  lblGrafTitulo.Font.Style := [fsBold];

  // Grid estilo
  grdAtividade.Color        := CLR_CARD_BG;
  grdAtividade.FixedColor   := CLR_SIDE_BG;
  grdAtividade.Font.Color   := CLR_TEXT_PRIMARY;
  grdAtividade.Font.Name    := FONT_DEFAULT;
end;

procedure TfrmDashboard.ConfigurarCards;
begin
  // ============================================================
  // Configure os cards com títulos e ícones do seu negócio
  // Os valores são carregados em CarregarKPIs via SQL
  // ============================================================
  cardTotal1.Setup('Total de Registros', '0', '📋', csInfo,    '', 'Todas as tabelas');
  cardTotal2.Setup('Ativos Hoje',        '0', '✅', csSucesso, '+0%', 'vs. ontem');
  cardTotal3.Setup('Pendências',         '0', '⚠️', csAviso,  '0', 'itens pendentes');
  cardTotal4.Setup('Receita do Dia',     'R$ 0,00', '💰', csInfo, '', 'atualizado agora');
end;

function TfrmDashboard.ConsultarCount(const ASQL: string): Integer;
begin
  Result := 0;
  if ASQL = '' then Exit;
  // TODO: Implemente consultas reais usando DMConexao
end;

procedure TfrmDashboard.CarregarKPIs;
begin
  // ============================================================
  // TODO: Substitua pelos SQLs reais do seu sistema
  // Exemplo com tabelas geradas:
  // cardTotal1.AtualizarValor(IntToStr(ConsultarCount('SELECT COUNT(*) FROM CLIENTES')));
  // cardTotal2.AtualizarValor(IntToStr(ConsultarCount('SELECT COUNT(*) FROM PEDIDOS WHERE DATA_PEDIDO = CURRENT_DATE')), csSucesso);
  // cardTotal3.AtualizarValor(IntToStr(ConsultarCount('SELECT COUNT(*) FROM PEDIDOS WHERE STATUS = ''PENDENTE''')), csAviso);
  // ============================================================
end;

procedure TfrmDashboard.CarregarAtividadeRecente;
begin
  // ============================================================
  // TODO: Carregue os últimos movimentos do sistema
  // Exemplo:
  // var Q: TIBQuery; I: Integer;
  // Q := TIBQuery.Create(nil);
  // ============================================================
  grdAtividade.RowCount := 4;
  grdAtividade.Cells[0,1] := '1'; grdAtividade.Cells[1,1] := 'Novo registro cadastrado';   grdAtividade.Cells[2,1] := FormatDateTime('hh:nn', Now); grdAtividade.Cells[3,1] := 'OK';
  grdAtividade.Cells[0,2] := '2'; grdAtividade.Cells[1,2] := 'Atualização de parâmetro';  grdAtividade.Cells[2,2] := FormatDateTime('hh:nn', Now); grdAtividade.Cells[3,2] := 'OK';
  grdAtividade.Cells[0,3] := '3'; grdAtividade.Cells[1,3] := 'Consulta realizada';         grdAtividade.Cells[2,3] := FormatDateTime('hh:nn', Now); grdAtividade.Cells[3,3] := 'OK';
end;

procedure TfrmDashboard.DesenharGrafico;
var
  W, H, I, X, Y: Integer;
  LCanvas: TCanvas;
  Dados: array[0..6] of Integer;
  Dias: array[0..6] of string;
  MaxVal: Integer;
begin
  if not Assigned(imgGrafico) then Exit;
  W := imgGrafico.Width;
  H := imgGrafico.Height;

  if (W <= 0) or (H <= 0) then Exit;

  imgGrafico.Picture.Bitmap.SetSize(W, H);
  LCanvas := imgGrafico.Picture.Bitmap.Canvas;

  LCanvas.Brush.Color := CLR_CARD_BG;
  LCanvas.FillRect(0, 0, W, H);

  // Dados fictícios para o gráfico de exemplo
  Dados[0] := 42; Dados[1] := 67; Dados[2] := 53;
  Dados[3] := 81; Dados[4] := 74; Dados[5] := 95; Dados[6] := 60;
  Dias[0]  := 'Seg'; Dias[1] := 'Ter'; Dias[2] := 'Qua';
  Dias[3]  := 'Qui'; Dias[4]  := 'Sex'; Dias[5] := 'Sáb'; Dias[6] := 'Dom';
  MaxVal := 100;

  // Grade de fundo
  LCanvas.Pen.Color  := CLR_CARD_BORDER;
  LCanvas.Pen.Width  := 1;
  for I := 0 to 4 do
  begin
    Y := Int64(H) - 30 - Round((I / 4) * (H - 60));
    LCanvas.MoveTo(40, Y);
    LCanvas.LineTo(W - 10, Y);
  end;

  // Barras
  LCanvas.Pen.Color   := CLR_SIDE_ACTIVE;
  LCanvas.Brush.Color := CLR_SIDE_ACTIVE;
  for I := 0 to 6 do
  begin
    X := 48 + I * Round((W - 60) / 7);
    Y := Int64(H) - 30 - Round((Dados[I] / MaxVal) * (H - 60));
    LCanvas.FillRect(Rect(X, Y, X + Round((W - 60) / 7) - 8, Int64(H) - 30));
    // Label dia
    LCanvas.Font.Color := CLR_TEXT_SECONDARY;
    LCanvas.Font.Size  := 9;
    LCanvas.TextOut(X + 2, H - 24, Dias[I]);
    // Valor
    LCanvas.Font.Color := CLR_TEXT_PRIMARY;
    LCanvas.TextOut(X + 2, Y - 16, IntToStr(Dados[I]));
  end;
end;

procedure TfrmDashboard.tmrRefreshTimer(Sender: TObject);
begin
  CarregarKPIs;
end;

end.
