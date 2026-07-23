object TfrmLista{{NOME_TABELA_PASCAL}}: TfrmLista{{NOME_TABELA_PASCAL}}
  Left = 100
  Height = 600
  Top = 80
  Width = 900
  Caption = 'Manutenção de {{NOME_TABELA_PASCAL}}'
  ClientHeight = 600
  ClientWidth = 900
  Font.Height = -13
  Font.Name = 'Segoe UI'
  Position = poMainFormCenter
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  OnShow = FormShow
  object pnlTopo: TPanel
    Left = 0
    Height = 56
    Top = 0
    Width = 900
    Align = alTop
    BevelOuter = bvNone
    Color = 3355443
    object lblTitulo: TLabel
      Left = 12
      Height = 32
      Top = 12
      Width = 300
      Caption = 'Manutenção de {{NOME_TABELA_PASCAL}}'
      Font.Color = clWhite
      Font.Height = -20
      Font.Style = [fsBold]
    end
  end
  object pnlBusca: TPanel
    Left = 0
    Height = 44
    Top = 56
    Width = 900
    Align = alTop
    BevelOuter = bvNone
    object lblBusca: TLabel
      Left = 8
      Height = 20
      Top = 12
      Width = 50
      Caption = 'Buscar:'
    end
    object edtBusca: TEdit
      Left = 64
      Height = 28
      Top = 8
      Width = 360
      OnKeyPress = edtBuscaKeyPress
    end
    object btnBuscar: TButton
      Left = 432
      Height = 28
      Top = 8
      Width = 80
      Caption = 'Buscar'
      OnClick = btnBuscarClick
    end
    object btnLimparBusca: TButton
      Left = 520
      Height = 28
      Top = 8
      Width = 80
      Caption = 'Limpar'
      OnClick = btnLimparBuscaClick
    end
    object lblTotal: TLabel
      Left = 750
      Height = 20
      Top = 12
      Width = 120
      Alignment = taRightJustify
      Anchors = [akTop, akRight]
      Caption = '0 registros'
    end
  end
  object pnlBotoesAcao: TPanel
    Left = 0
    Height = 44
    Top = 100
    Width = 900
    Align = alTop
    BevelOuter = bvNone
    object btnNovo: TBitBtn
      Left = 8
      Height = 34
      Top = 5
      Width = 100
      Caption = 'Novo'
      Font.Style = [fsBold]
      Kind = bkCustom
      OnClick = btnNovoClick
    end
    object btnEditar: TBitBtn
      Left = 116
      Height = 34
      Top = 5
      Width = 100
      Caption = 'Editar'
      Kind = bkCustom
      OnClick = btnEditarClick
    end
    object btnExcluir: TBitBtn
      Left = 224
      Height = 34
      Top = 5
      Width = 100
      Caption = 'Excluir'
      Kind = bkCustom
      OnClick = btnExcluirClick
    end
    object btnAtualizar: TButton
      Left = 332
      Height = 34
      Top = 5
      Width = 100
      Caption = 'Atualizar'
      OnClick = btnAtualizarClick
    end
  end
  object grdLista: TStringGrid
    Left = 0
    Height = 478
    Top = 144
    Width = 900
    Align = alClient
    ColCount = 3
    DefaultRowHeight = 24
    FixedCols = 0
    Font.Height = -12
    Options = [goFixedVertLine, goFixedHorzLine, goVertLine, goHorzLine, goRangeSelect, goColSizing, goRowSelect]
    OnDblClick = grdListaDblClick
    RowCount = 2
  end
  object StatusBar1: TStatusBar
    Left = 0
    Height = 24
    Top = 576
    Width = 900
    Panels = <>
    SimplePanel = True
  end
end
