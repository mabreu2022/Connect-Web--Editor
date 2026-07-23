object TFrForm{{NOME_TABELA_PASCAL}}: TFrForm{{NOME_TABELA_PASCAL}}
  Left = 150
  Height = 540
  Top = 80
  Width = 560
  BorderStyle = bsDialog
  Caption = '{{NOME_TABELA_PASCAL}}'
  ClientHeight = 540
  ClientWidth = 560
  Color = 16053488
  Font.Height = -13
  Font.Name = 'Segoe UI'
  Position = poMainFormCenter
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  OnShow = FormShow
  object pnlTopo: TPanel
    Left = 0
    Height = 52
    Top = 0
    Width = 560
    Align = alTop
    BevelOuter = bvNone
    Color = 3023898
    object lblFormTitulo: TLabel
      Left = 16
      Height = 30
      Top = 11
      Width = 350
      Caption = '{{NOME_TABELA_PASCAL}}'
      Font.Color = clWhite
      Font.Height = -20
      Font.Name = 'Segoe UI'
      Font.Style = [fsBold]
      Transparent = True
    end
    object lblFormModo: TLabel
      Left = 400
      Height = 20
      Top = 16
      Width = 100
      Alignment = taRightJustify
      Caption = 'Novo'
      Font.Color = 16609293
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Font.Style = [fsBold]
      Transparent = True
    end
  end
  object pnlBotoes: TPanel
    Left = 0
    Height = 56
    Top = 484
    Width = 560
    Align = alBottom
    BevelOuter = bvNone
    Color = clWhite
    object btnSalvar: TBitBtn
      Left = 320
      Height = 40
      Top = 8
      Width = 110
      Caption = '✓  Salvar'
      Font.Height = -14
      Font.Name = 'Segoe UI'
      Font.Style = [fsBold]
      Kind = bkOk
      OnClick = btnSalvarClick
    end
    object btnCancelar: TBitBtn
      Left = 440
      Height = 40
      Top = 8
      Width = 110
      Caption = '✗  Cancelar'
      Font.Height = -14
      Font.Name = 'Segoe UI'
      Kind = bkCancel
      OnClick = btnCancelarClick
    end
  end
  object ScrollBox1: TScrollBox
    Left = 0
    Height = 432
    Top = 52
    Width = 560
    Align = alClient
    BorderStyle = bsNone
    Color = clWhite
  end
end
