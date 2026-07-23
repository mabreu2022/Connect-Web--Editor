object TFrLista{{NOME_TABELA_PASCAL}}: TFrLista{{NOME_TABELA_PASCAL}}
  Left = 0
  Height = 650
  Top = 0
  Width = 1000
  object pnlHeader: TPanel
    Left = 0
    Height = 96
    Top = 0
    Width = 1000
    Align = alTop
    BevelOuter = bvNone
    Color = clWhite
    object pnlBusca: TPanel
      Left = 0
      Height = 48
      Top = 0
      Width = 1000
      Align = alTop
      BevelOuter = bvNone
      Color = clWhite
      object edtBusca: TEdit
        Left = 8
        Height = 32
        Top = 8
        Width = 360
        Font.Height = -14
        Font.Name = 'Segoe UI'
        TextHint = 'Buscar...'
        OnKeyPress = edtBuscaKeyPress
      end
      object btnBuscar: TButton
        Left = 376
        Height = 32
        Top = 8
        Width = 100
        Caption = '🔍 Buscar'
        Font.Name = 'Segoe UI'
        OnClick = btnBuscarClick
      end
      object btnLimpar: TButton
        Left = 484
        Height = 32
        Top = 8
        Width = 80
        Caption = 'Limpar'
        Font.Name = 'Segoe UI'
        OnClick = btnLimparClick
      end
      object lblTotal: TLabel
        Left = 880
        Height = 20
        Top = 14
        Width = 120
        Alignment = taRightJustify
        Anchors = [akTop, akRight]
        Caption = '0 registros'
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
    end
    object pnlAcoes: TPanel
      Left = 0
      Height = 48
      Top = 48
      Width = 1000
      Align = alTop
      BevelOuter = bvNone
      Color = clWhite
      object btnNovo: TButton
        Left = 8
        Height = 34
        Top = 7
        Width = 100
        Caption = '➕ Novo'
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        OnClick = btnNovoClick
      end
      object btnEditar: TButton
        Left = 116
        Height = 34
        Top = 7
        Width = 100
        Caption = '✏️ Editar'
        Font.Name = 'Segoe UI'
        OnClick = btnEditarClick
      end
      object btnExcluir: TButton
        Left = 224
        Height = 34
        Top = 7
        Width = 100
        Caption = '🗑️ Excluir'
        Font.Name = 'Segoe UI'
        OnClick = btnExcluirClick
      end
      object btnAtualizar: TButton
        Left = 332
        Height = 34
        Top = 7
        Width = 100
        Caption = '🔄 Refresh'
        Font.Name = 'Segoe UI'
        OnClick = btnAtualizarClick
      end
    end
  end
  object grdLista: TStringGrid
    Left = 0
    Height = 530
    Top = 96
    Width = 1000
    Align = alClient
    DefaultRowHeight = 28
    FixedCols = 0
    Font.Name = 'Segoe UI'
    Options = [goFixedVertLine, goFixedHorzLine, goVertLine, goHorzLine, goRangeSelect, goColSizing, goRowSelect]
    OnDblClick = grdListaDblClick
    RowCount = 2
  end
  object pnlRodape: TPanel
    Left = 0
    Height = 24
    Top = 626
    Width = 1000
    Align = alBottom
    BevelOuter = bvNone
    Color = clWhite
    object lblRodapeTxt: TLabel
      Left = 8
      Height = 16
      Top = 4
      Width = 400
      Caption = ''
      Font.Color = 7829367
      Font.Height = -11
      Font.Name = 'Segoe UI'
      Transparent = True
    end
  end
end
