object TViewPDV: TViewPDV
  Left = 0
  Height = 700
  Top = 0
  Width = 1000
  Caption = 'PDV — Ponto de Venda'
  ClientHeight = 700
  ClientWidth = 1000
  Color = 16053488
  Font.Name = 'Segoe UI'
  WindowState = wsMaximized
  OnCreate = FormCreate
  OnShow = FormShow
  object pnlEsquerdo: TPanel
    Left = 0
    Height = 700
    Top = 0
    Width = 420
    Align = alLeft
    BevelOuter = bvNone
    Color = clWhite
    object pnlBuscaProduto: TPanel
      Left = 0
      Height = 220
      Top = 0
      Width = 420
      Align = alTop
      BevelOuter = bvNone
      Color = clWhite
      object lblCodigoProd: TLabel
        Left = 8
        Height = 20
        Top = 8
        Width = 100
        Caption = 'Código/Barras:'
        Font.Name = 'Segoe UI'
        Transparent = True
      end
      object edtCodigoProd: TEdit
        Left = 8
        Height = 36
        Top = 28
        Width = 300
        Font.Height = -22
        Font.Name = 'Segoe UI'
        OnKeyPress = edtCodigoProdKeyPress
      end
      object btnBuscarProd: TButton
        Left = 316
        Height = 36
        Top = 28
        Width = 96
        Caption = '🔍'
        Font.Height = -20
        OnClick = btnBuscarProdClick
      end
      object lblNomeProd: TLabel
        Left = 8
        Height = 30
        Top = 72
        Width = 404
        Caption = '— selecione um produto —'
        Font.Height = -18
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
      object lblPrecoProd: TLabel
        Left = 8
        Height = 32
        Top = 108
        Width = 200
        Caption = 'R$ 0,00'
        Font.Color = 16609293
        Font.Height = -22
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
      object lblEstoqueProd: TLabel
        Left = 8
        Height = 20
        Top = 148
        Width = 200
        Caption = ''
        Font.Color = 7829367
        Font.Name = 'Segoe UI'
        Transparent = True
      end
      object lblQtd: TLabel
        Left = 8
        Height = 20
        Top = 176
        Width = 60
        Caption = 'Quantidade:'
        Font.Name = 'Segoe UI'
        Transparent = True
      end
      object edtQtd: TEdit
        Left = 72
        Height = 32
        Top = 172
        Width = 80
        Font.Height = -18
        Font.Name = 'Segoe UI'
        Text = '1'
      end
      object btnAdicionar: TBitBtn
        Left = 168
        Height = 36
        Top = 176
        Width = 200
        Caption = '➕  Adicionar ao Carrinho'
        Font.Height = -14
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Kind = bkCustom
        OnClick = btnAdicionarClick
      end
    end
    object pnlNumpad: TPanel
      Left = 0
      Height = 480
      Top = 220
      Width = 420
      Align = alClient
      BevelOuter = bvNone
      Color = 16053488
      object btn7: TButton
        Left = 8 Height = 64 Top = 8 Width = 86 Caption = '7' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn8: TButton
        Left = 102 Height = 64 Top = 8 Width = 86 Caption = '8' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn9: TButton
        Left = 196 Height = 64 Top = 8 Width = 86 Caption = '9' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn4: TButton
        Left = 8 Height = 64 Top = 80 Width = 86 Caption = '4' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn5: TButton
        Left = 102 Height = 64 Top = 80 Width = 86 Caption = '5' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn6: TButton
        Left = 196 Height = 64 Top = 80 Width = 86 Caption = '6' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn1: TButton
        Left = 8 Height = 64 Top = 152 Width = 86 Caption = '1' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn2: TButton
        Left = 102 Height = 64 Top = 152 Width = 86 Caption = '2' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn3: TButton
        Left = 196 Height = 64 Top = 152 Width = 86 Caption = '3' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btn0: TButton
        Left = 8 Height = 64 Top = 224 Width = 180 Caption = '0' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btnPonto: TButton
        Left = 196 Height = 64 Top = 224 Width = 86 Caption = '.' Font.Height = -24 Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btnBacksp: TButton
        Left = 290 Height = 64 Top = 8 Width = 122 Caption = '⌫' Font.Height = -24 Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btnLimpar: TButton
        Left = 290 Height = 64 Top = 80 Width = 122 Caption = 'C' Font.Height = -24 Font.Style = [fsBold] Font.Name = 'Segoe UI' OnClick = NumpadClick
      end
      object btnDinheiro: TButton
        Left = 8 Height = 48 Top = 296 Width = 96 Caption = '💵 Dinheiro' Font.Height = -12 Font.Name = 'Segoe UI' Tag = 0 OnClick = FormaPagClick
      end
      object btnDebito: TButton
        Left = 112 Height = 48 Top = 296 Width = 96 Caption = '💳 Débito' Font.Height = -12 Font.Name = 'Segoe UI' Tag = 1 OnClick = FormaPagClick
      end
      object btnCredito: TButton
        Left = 216 Height = 48 Top = 296 Width = 96 Caption = '💳 Crédito' Font.Height = -12 Font.Name = 'Segoe UI' Tag = 2 OnClick = FormaPagClick
      end
      object btnPix: TButton
        Left = 320 Height = 48 Top = 296 Width = 92 Caption = '⚡ PIX' Font.Height = -12 Font.Name = 'Segoe UI' Tag = 3 OnClick = FormaPagClick
      end
    end
  end
  object pnlDireito: TPanel
    Left = 420
    Height = 700
    Top = 0
    Width = 580
    Align = alClient
    BevelOuter = bvNone
    Color = clWhite
    object pnlCarrinhoHeader: TPanel
      Left = 0
      Height = 52
      Top = 0
      Width = 580
      Align = alTop
      BevelOuter = bvNone
      Color = 3023898
      object lblCarrinhoTitulo: TLabel
        Left = 12
        Height = 28
        Top = 12
        Width = 200
        Caption = '🛒  CARRINHO'
        Font.Color = clWhite
        Font.Height = -20
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
      object lblNumVenda: TLabel
        Left = 400
        Height = 20
        Top = 16
        Width = 160
        Alignment = taRightJustify
        Anchors = [akTop, akRight]
        Caption = 'Venda #0000'
        Font.Color = clSilver
        Font.Name = 'Segoe UI'
        Transparent = True
      end
    end
    object grdCarrinho: TStringGrid
      Left = 0
      Height = 380
      Top = 52
      Width = 580
      Align = alTop
      DefaultRowHeight = 30
      FixedCols = 0
      Font.Name = 'Segoe UI'
      Options = [goFixedVertLine, goFixedHorzLine, goVertLine, goHorzLine, goRowSelect, goColSizing]
      RowCount = 2
      OnKeyDown = grdCarrinhoKeyDown
    end
    object pnlTotais: TPanel
      Left = 0
      Height = 120
      Top = 432
      Width = 580
      Align = alTop
      BevelOuter = bvNone
      Color = 16053488
      object lblSubtotalLabel: TLabel Left = 12 Height = 24 Top = 8 Width = 100 Caption = 'Subtotal:' Font.Name = 'Segoe UI' Transparent = True end
      object lblSubtotal: TLabel Left = 400 Height = 24 Top = 8 Width = 172 Alignment = taRightJustify Anchors = [akTop, akRight] Caption = 'R$ 0,00' Font.Name = 'Segoe UI' Transparent = True end
      object lblDescontoLabel: TLabel Left = 12 Height = 24 Top = 40 Width = 100 Caption = 'Descontos:' Font.Name = 'Segoe UI' Transparent = True end
      object lblDesconto: TLabel Left = 400 Height = 24 Top = 40 Width = 172 Alignment = taRightJustify Anchors = [akTop, akRight] Caption = 'R$ 0,00' Font.Color = 255 Font.Name = 'Segoe UI' Transparent = True end
      object lblTotalLabel: TLabel Left = 12 Height = 34 Top = 74 Width = 100 Caption = 'TOTAL:' Font.Height = -24 Font.Name = 'Segoe UI' Font.Style = [fsBold] Transparent = True end
      object lblTotal: TLabel Left = 280 Height = 34 Top = 74 Width = 292 Alignment = taRightJustify Anchors = [akTop, akRight] Caption = 'R$ 0,00' Font.Color = 4569896 Font.Height = -26 Font.Name = 'Segoe UI' Font.Style = [fsBold] Transparent = True end
    end
    object pnlPagamento: TPanel
      Left = 0
      Height = 148
      Top = 552
      Width = 580
      Align = alBottom
      BevelOuter = bvNone
      Color = clWhite
      object lblFormaPag: TLabel
        Left = 8 Height = 24 Top = 8 Width = 200 Caption = '💳 Forma: DINHEIRO' Font.Style = [fsBold] Font.Name = 'Segoe UI' Transparent = True
      end
      object lblRecebidoLabel: TLabel
        Left = 8 Height = 20 Top = 40 Width = 80 Caption = 'Recebido:' Font.Name = 'Segoe UI' Transparent = True
      end
      object edtRecebido: TEdit
        Left = 96 Height = 28 Top = 36 Width = 140 Font.Height = -18 Font.Name = 'Segoe UI' OnChange = edtRecebidoChange
      end
      object lblTrocoLabel: TLabel
        Left = 246 Height = 20 Top = 40 Width = 50 Caption = 'Troco:' Font.Name = 'Segoe UI' Transparent = True
      end
      object edtTroco: TEdit
        Left = 300 Height = 28 Top = 36 Width = 140 Font.Height = -18 Font.Name = 'Segoe UI' ReadOnly = True
      end
      object btnFinalizar: TBitBtn
        Left = 8 Height = 60 Top = 76 Width = 200 Caption = '✓  FINALIZAR VENDA' Font.Height = -16 Font.Style = [fsBold] Font.Name = 'Segoe UI' Kind = bkCustom OnClick = btnFinalizarClick
      end
      object btnCancelarItem: TButton
        Left = 220 Height = 60 Top = 76 Width = 150 Caption = '🗑️ Rem. Item (Del)' Font.Name = 'Segoe UI' OnClick = btnCancelarItemClick
      end
      object btnCancelar: TBitBtn
        Left = 380 Height = 60 Top = 76 Width = 192 Caption = '✗  Cancelar Venda' Font.Height = -14 Font.Name = 'Segoe UI' Kind = bkCancel OnClick = btnCancelarClick
      end
    end
  end
end
