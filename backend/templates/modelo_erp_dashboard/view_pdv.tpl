unit uViewPDV;

{$mode objfpc}{$H+}
{$modeswitch advancedrecords}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} — Ponto de Venda (PDV) }
{ Layout: Busca produto (esq) + Carrinho (dir) + Numpad + Pagamento }

interface

uses
  Classes, SysUtils, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, Grids, Buttons, ComCtrls, Math, LCLType,
  uTheme, uDMConexao;

type
  { Item no carrinho de compras }
  TItemCarrinho = record
    Codigo: Integer;
    Descricao: string;
    PrecoUnit: Currency;
    Quantidade: Double;
    Desconto: Currency;
    function Total: Currency;
  end;

  { Forma de pagamento }
  TFormaPagamento = (fpDinheiro, fpCartaoDebito, fpCartaoCredito, fpPix, fpOuros);

  { TViewPDV }
  TViewPDV = class(TForm)
    { === PAINEL ESQUERDO — Produto e Numpad === }
    pnlEsquerdo: TPanel;
      pnlBuscaProduto: TPanel;
        lblCodigoProd: TLabel;
        edtCodigoProd: TEdit;
        btnBuscarProd: TButton;
        lblNomeProd: TLabel;
        lblPrecoProd: TLabel;
        lblEstoqueProd: TLabel;
        edtQtd: TEdit;
        lblQtd: TLabel;
        btnAdicionar: TBitBtn;
      pnlNumpad: TPanel;
        btn0, btn1, btn2, btn3, btn4: TButton;
        btn5, btn6, btn7, btn8, btn9: TButton;
        btnPonto, btnBacksp: TButton;
        btnDinheiro, btnDebito, btnCredito, btnPix: TButton;
        btnLimpar: TButton;

    { === PAINEL DIREITO — Carrinho + Totais === }
    pnlDireito: TPanel;
      pnlCarrinhoHeader: TPanel;
        lblCarrinhoTitulo: TLabel;
        lblNumVenda: TLabel;
      grdCarrinho: TStringGrid;
      pnlTotais: TPanel;
        lblSubtotalLabel: TLabel; lblSubtotal: TLabel;
        lblDescontoLabel: TLabel; lblDesconto: TLabel;
        lblTotalLabel: TLabel;    lblTotal: TLabel;
      pnlPagamento: TPanel;
        lblPagTitulo: TLabel;
        edtTroco: TEdit; lblTrocoLabel: TLabel;
        edtRecebido: TEdit; lblRecebidoLabel: TLabel;
        btnFinalizar: TBitBtn;
        btnCancelar: TBitBtn;
        btnCancelarItem: TButton;
        lblFormaPag: TLabel;

    procedure FormCreate(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure edtCodigoProdKeyPress(Sender: TObject; var Key: Char);
    procedure btnBuscarProdClick(Sender: TObject);
    procedure btnAdicionarClick(Sender: TObject);
    procedure btnFinalizarClick(Sender: TObject);
    procedure btnCancelarClick(Sender: TObject);
    procedure btnCancelarItemClick(Sender: TObject);
    procedure edtRecebidoChange(Sender: TObject);
    procedure NumpadClick(Sender: TObject);
    procedure FormaPagClick(Sender: TObject);
    procedure grdCarrinhoKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);
  private
    FItens: array of TItemCarrinho;
    FQtdItens: Integer;
    FFormaPag: TFormaPagamento;
    FNumVenda: Integer;

    procedure IniciarNovaVenda;
    procedure LimparCarrinho;
    procedure BuscarProduto(const ACodigo: string);
    procedure AdicionarAoCarrinho;
    procedure AtualizarGradeCarrinho;
    procedure AtualizarTotais;
    procedure FinalizarVenda;
    procedure CancelarItemSelecionado;
    procedure SelecionarFormaPag(AForma: TFormaPagamento);
    procedure ConfigurarCores;
    procedure ConfigurarNumpad;
    procedure ConfigurarCarrinho;

    function Subtotal: Currency;
    function TotalDescontos: Currency;
    function TotalVenda: Currency;
    function ProximoNumVenda: Integer;
  end;

var
  ViewPDV: TViewPDV;

implementation

{$R *.lfm}

{ TItemCarrinho }
function TItemCarrinho.Total: Currency;
begin
  Result := (PrecoUnit * Quantidade) - Desconto;
end;

{ TViewPDV }

procedure TViewPDV.FormCreate(Sender: TObject);
begin
  ConfigurarCores;
  ConfigurarNumpad;
  ConfigurarCarrinho;
  FFormaPag := fpDinheiro;
  FQtdItens := 0;
  SetLength(FItens, 0);
end;

procedure TViewPDV.FormShow(Sender: TObject);
begin
  IniciarNovaVenda;
  edtCodigoProd.SetFocus;
end;

procedure TViewPDV.ConfigurarCores;
begin
  Color                := CLR_CONTENT_BG;
  pnlEsquerdo.Color    := CLR_CARD_BG;
  pnlDireito.Color     := CLR_CARD_BG;
  pnlCarrinhoHeader.Color := CLR_SIDE_BG;
  pnlTotais.Color      := CLR_CONTENT_BG;
  pnlPagamento.Color   := CLR_CARD_BG;
  pnlNumpad.Color      := CLR_CONTENT_BG;

  lblCarrinhoTitulo.Font.Color := clWhite;
  lblCarrinhoTitulo.Font.Style := [fsBold];
  lblNumVenda.Font.Color := clWhite;

  lblTotal.Font.Color  := CLR_STATUS_OK;
  lblTotal.Font.Size   := FONT_SIZE_LG;
  lblTotal.Font.Style  := [fsBold];
  lblTotalLabel.Font.Style := [fsBold];

  btnFinalizar.Color := CLR_STATUS_OK;
  btnFinalizar.Font.Color := clWhite;
  btnFinalizar.Font.Style := [fsBold];

  lblNomeProd.Font.Size  := FONT_SIZE_LG;
  lblNomeProd.Font.Style := [fsBold];
  lblPrecoProd.Font.Color := CLR_SIDE_ACTIVE;
  lblPrecoProd.Font.Size  := FONT_SIZE_LG;
end;

procedure TViewPDV.ConfigurarNumpad;
var
  Btns: array[0..9] of TButton;
  I: Integer;
begin
  Btns[0] := btn0; Btns[1] := btn1; Btns[2] := btn2;
  Btns[3] := btn3; Btns[4] := btn4; Btns[5] := btn5;
  Btns[6] := btn6; Btns[7] := btn7; Btns[8] := btn8;
  Btns[9] := btn9;
  for I := 0 to 9 do
  begin
    Btns[I].Font.Size   := 18;
    Btns[I].Font.Style  := [fsBold];
    Btns[I].OnClick     := @NumpadClick;
  end;
  btnPonto.Font.Size  := 18; btnPonto.OnClick  := @NumpadClick;
  btnBacksp.Font.Size := 14; btnBacksp.OnClick := @NumpadClick;
  btnBacksp.Caption   := '⌫';
  btnLimpar.OnClick   := @NumpadClick;
  btnLimpar.Caption   := 'C';
  btnLimpar.Font.Color := CLR_STATUS_ERR;

  // Formas de pagamento
  btnDinheiro.Caption := '💵 Dinheiro'; btnDinheiro.Tag := 0; btnDinheiro.OnClick := @FormaPagClick;
  btnDebito.Caption   := '💳 Débito';   btnDebito.Tag   := 1; btnDebito.OnClick   := @FormaPagClick;
  btnCredito.Caption  := '💳 Crédito';  btnCredito.Tag  := 2; btnCredito.OnClick  := @FormaPagClick;
  btnPix.Caption      := '⚡ PIX';      btnPix.Tag      := 3; btnPix.OnClick      := @FormaPagClick;

  SelecionarFormaPag(fpDinheiro);
end;

procedure TViewPDV.ConfigurarCarrinho;
begin
  grdCarrinho.ColCount := 5;
  grdCarrinho.FixedRows := 1;
  grdCarrinho.RowCount  := 2;
  grdCarrinho.ColWidths[0] := 60;
  grdCarrinho.ColWidths[1] := 200;
  grdCarrinho.ColWidths[2] := 70;
  grdCarrinho.ColWidths[3] := 90;
  grdCarrinho.ColWidths[4] := 90;
  grdCarrinho.Cells[0,0] := 'Cód.';
  grdCarrinho.Cells[1,0] := 'Produto';
  grdCarrinho.Cells[2,0] := 'Qtd.';
  grdCarrinho.Cells[3,0] := 'Unit.';
  grdCarrinho.Cells[4,0] := 'Total';
  grdCarrinho.Options := grdCarrinho.Options + [goRowSelect, goColSizing];
  grdCarrinho.FixedColor := CLR_SIDE_BG;
  grdCarrinho.Font.Name := FONT_DEFAULT;
end;

procedure TViewPDV.IniciarNovaVenda;
begin
  LimparCarrinho;
  FNumVenda := ProximoNumVenda;
  lblNumVenda.Caption := 'Venda #' + IntToStr(FNumVenda);
  edtCodigoProd.Clear;
  edtQtd.Text := '1';
  lblNomeProd.Caption  := '— selecione um produto —';
  lblPrecoProd.Caption := 'R$ 0,00';
  lblEstoqueProd.Caption := '';
  AtualizarTotais;
end;

function TViewPDV.ProximoNumVenda: Integer;
begin
  // TODO: Buscar próximo número de venda via Generator ou SELECT MAX
  // Exemplo: SELECT GEN_ID(GEN_VENDAS, 1) FROM RDB$DATABASE
  Result := Random(9000) + 1000;
end;

procedure TViewPDV.LimparCarrinho;
begin
  FQtdItens := 0;
  SetLength(FItens, 0);
  AtualizarGradeCarrinho;
  AtualizarTotais;
end;

procedure TViewPDV.BuscarProduto(const ACodigo: string);
begin
  // ============================================================
  // TODO: Implemente a busca real de produto no banco
  // Exemplo:
  // var Q: TIBQuery;
  // Q := TIBQuery.Create(nil);
  // Q.Database := DMConexao.IBDatabase1; Q.Transaction := DMConexao.IBTransaction1;
  // Q.SQL.Text := 'SELECT * FROM PRODUTOS WHERE CODIGO = :COD OR DESCRICAO CONTAINING :COD';
  // Q.ParamByName('COD').AsString := ACodigo;
  // Q.Open;
  // if not Q.EOF then begin
  //   lblNomeProd.Caption  := Q.FieldByName('DESCRICAO').AsString;
  //   lblPrecoProd.Caption := FormatCurr('R$ #,##0.00', Q.FieldByName('PRECO').AsCurrency);
  //   lblEstoqueProd.Caption := 'Estoque: ' + Q.FieldByName('ESTOQUE').AsString;
  // end;
  // Q.Free;
  // ============================================================
  lblNomeProd.Caption := 'Produto #' + ACodigo + ' (exemplo)';
  lblPrecoProd.Caption := 'R$ 10,00';
  lblEstoqueProd.Caption := 'Estoque: 100 un.';
end;

procedure TViewPDV.AdicionarAoCarrinho;
var
  Qtd: Double;
  Cod: Integer;
begin
  if lblNomeProd.Caption = '— selecione um produto —' then
  begin
    ShowMessage('Selecione um produto primeiro!');
    edtCodigoProd.SetFocus;
    Exit;
  end;
  Qtd := StrToFloatDef(StringReplace(edtQtd.Text, ',', '.', [rfReplaceAll]), 1);
  if Qtd <= 0 then Qtd := 1;
  Cod := StrToIntDef(edtCodigoProd.Text, 0);

  Inc(FQtdItens);
  SetLength(FItens, FQtdItens);
  FItens[FQtdItens - 1].Codigo    := Cod;
  FItens[FQtdItens - 1].Descricao := lblNomeProd.Caption;
  FItens[FQtdItens - 1].PrecoUnit := StrToFloatDef(
    StringReplace(StringReplace(lblPrecoProd.Caption, 'R$ ', '', [rfReplaceAll]), '.', '', [rfReplaceAll])
    .Replace(',', '.'), 0);
  FItens[FQtdItens - 1].Quantidade := Qtd;
  FItens[FQtdItens - 1].Desconto   := 0;

  AtualizarGradeCarrinho;
  AtualizarTotais;

  edtCodigoProd.Clear;
  edtQtd.Text := '1';
  lblNomeProd.Caption := '— selecione um produto —';
  lblPrecoProd.Caption := 'R$ 0,00';
  edtCodigoProd.SetFocus;
end;

procedure TViewPDV.AtualizarGradeCarrinho;
var
  I: Integer;
begin
  if FQtdItens = 0 then
    grdCarrinho.RowCount := 2
  else
    grdCarrinho.RowCount := FQtdItens + 1;

  for I := 0 to FQtdItens - 1 do
  begin
    grdCarrinho.Cells[0, I+1] := IntToStr(FItens[I].Codigo);
    grdCarrinho.Cells[1, I+1] := FItens[I].Descricao;
    grdCarrinho.Cells[2, I+1] := FormatFloat('#,##0.##', FItens[I].Quantidade);
    grdCarrinho.Cells[3, I+1] := FormatCurr('R$ #,##0.00', FItens[I].PrecoUnit);
    grdCarrinho.Cells[4, I+1] := FormatCurr('R$ #,##0.00', FItens[I].Total);
  end;
end;

function TViewPDV.Subtotal: Currency;
var I: Integer;
begin Result := 0; for I := 0 to FQtdItens-1 do Result := Result + FItens[I].PrecoUnit * FItens[I].Quantidade; end;
function TViewPDV.TotalDescontos: Currency;
var I: Integer;
begin Result := 0; for I := 0 to FQtdItens-1 do Result := Result + FItens[I].Desconto; end;
function TViewPDV.TotalVenda: Currency;
begin Result := Subtotal - TotalDescontos; end;

procedure TViewPDV.AtualizarTotais;
var
  Recebido, Troco: Currency;
begin
  lblSubtotal.Caption := FormatCurr('R$ #,##0.00', Subtotal);
  lblDesconto.Caption := FormatCurr('R$ #,##0.00', TotalDescontos);
  lblTotal.Caption    := FormatCurr('R$ #,##0.00', TotalVenda);
  Recebido := StrToFloatDef(
    StringReplace(edtRecebido.Text, ',', '.', [rfReplaceAll]), 0);
  Troco := Recebido - TotalVenda;
  if Troco >= 0 then
    edtTroco.Text := FormatCurr('#,##0.00', Troco)
  else
    edtTroco.Text := '—';
end;

procedure TViewPDV.FinalizarVenda;
begin
  if FQtdItens = 0 then
  begin
    ShowMessage('Adicione itens ao carrinho antes de finalizar.');
    Exit;
  end;
  if TotalVenda <= 0 then
  begin
    ShowMessage('Total inválido.');
    Exit;
  end;

  // ============================================================
  // TODO: Implementar gravação da venda no banco
  // Sequência recomendada:
  // 1. Gerar ID da venda via GEN_ID
  // 2. INSERT em VENDAS (cabeçalho)
  // 3. INSERT em ITENS_VENDA (loop dos itens)
  // 4. UPDATE PRODUTOS (baixar estoque)
  // 5. CommitRetaining
  // ============================================================

  ShowMessage(Format('Venda #%d finalizada! Total: %s',
    [FNumVenda, FormatCurr('R$ #,##0.00', TotalVenda)]));
  IniciarNovaVenda;
end;

procedure TViewPDV.CancelarItemSelecionado;
var
  Linha, I: Integer;
begin
  Linha := grdCarrinho.Row - 1;
  if (Linha < 0) or (Linha >= FQtdItens) then Exit;
  if MessageDlg('Remover item do carrinho?', mtConfirmation, [mbYes, mbNo], 0) <> mrYes then Exit;
  for I := Linha to FQtdItens - 2 do FItens[I] := FItens[I + 1];
  Dec(FQtdItens);
  SetLength(FItens, FQtdItens);
  AtualizarGradeCarrinho;
  AtualizarTotais;
end;

procedure TViewPDV.SelecionarFormaPag(AForma: TFormaPagamento);
const
  Nomes: array[TFormaPagamento] of string = ('DINHEIRO', 'DÉBITO', 'CRÉDITO', 'PIX', 'OUTROS');
begin
  FFormaPag := AForma;
  lblFormaPag.Caption := '💳 Forma: ' + Nomes[AForma];
  // Troco só faz sentido com dinheiro
  edtRecebido.Enabled := AForma = fpDinheiro;
  if AForma <> fpDinheiro then begin edtRecebido.Text := ''; edtTroco.Text := ''; end;
end;

procedure TViewPDV.NumpadClick(Sender: TObject);
var
  Btn: TButton;
  C: string;
  Alvo: TEdit;
begin
  Btn := Sender as TButton;
  Alvo := edtCodigoProd; // padrão
  if edtQtd.Focused then Alvo := edtQtd
  else if edtRecebido.Focused then Alvo := edtRecebido;
  C := Btn.Caption;
  if C = '⌫' then
  begin
    if Length(Alvo.Text) > 0 then Alvo.Text := Copy(Alvo.Text, 1, Length(Alvo.Text) - 1);
  end
  else if C = 'C' then Alvo.Clear
  else Alvo.Text := Alvo.Text + C;
end;

procedure TViewPDV.FormaPagClick(Sender: TObject);
begin
  SelecionarFormaPag(TFormaPagamento((Sender as TButton).Tag));
end;

procedure TViewPDV.edtCodigoProdKeyPress(Sender: TObject; var Key: Char);
begin
  if Key = #13 then btnBuscarProdClick(Sender);
end;

procedure TViewPDV.btnBuscarProdClick(Sender: TObject);
begin
  if Trim(edtCodigoProd.Text) = '' then Exit;
  BuscarProduto(Trim(edtCodigoProd.Text));
end;

procedure TViewPDV.btnAdicionarClick(Sender: TObject);
begin
  AdicionarAoCarrinho;
end;

procedure TViewPDV.btnFinalizarClick(Sender: TObject);
begin
  FinalizarVenda;
end;

procedure TViewPDV.btnCancelarClick(Sender: TObject);
begin
  if FQtdItens > 0 then
    if MessageDlg('Cancelar a venda inteira?', mtWarning, [mbYes, mbNo], 0) <> mrYes then Exit;
  IniciarNovaVenda;
end;

procedure TViewPDV.btnCancelarItemClick(Sender: TObject);
begin
  CancelarItemSelecionado;
end;

procedure TViewPDV.edtRecebidoChange(Sender: TObject);
begin
  AtualizarTotais;
end;

procedure TViewPDV.grdCarrinhoKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);
begin
  if Key = VK_DELETE then CancelarItemSelecionado;
end;

end.
