object TfrmForm{{NOME_TABELA_PASCAL}}: TfrmForm{{NOME_TABELA_PASCAL}}
  Left = 150
  Height = 520
  Top = 100
  Width = 520
  BorderStyle = bsDialog
  Caption = 'Cadastro — {{NOME_TABELA_PASCAL}}'
  ClientHeight = 520
  ClientWidth = 520
  Font.Height = -13
  Font.Name = 'Segoe UI'
  Position = poMainFormCenter
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  OnShow = FormShow
  object pnlTopo: TPanel
    Left = 0
    Height = 48
    Top = 0
    Width = 520
    Align = alTop
    BevelOuter = bvNone
    Color = 3355443
    object lblFormTitulo: TLabel
      Left = 12
      Height = 28
      Top = 10
      Width = 300
      Caption = '{{NOME_TABELA_PASCAL}} — Cadastro'
      Font.Color = clWhite
      Font.Height = -18
      Font.Style = [fsBold]
    end
  end
  object pnlBotoes: TPanel
    Left = 0
    Height = 52
    Top = 468
    Width = 520
    Align = alBottom
    BevelOuter = bvNone
    object btnSalvar: TBitBtn
      Left = 280
      Height = 36
      Top = 8
      Width = 110
      Caption = '✓  Salvar'
      Font.Style = [fsBold]
      Kind = bkOk
      OnClick = btnSalvarClick
    end
    object btnCancelar: TBitBtn
      Left = 400
      Height = 36
      Top = 8
      Width = 110
      Caption = '✗  Cancelar'
      Kind = bkCancel
      OnClick = btnCancelarClick
    end
  end
  object ScrollBox1: TScrollBox
    Left = 0
    Height = 420
    Top = 48
    Width = 520
    Align = alClient
    BorderStyle = bsNone
{{LOOP_CAMPOS}}    object lbl{{CAMPO_PASCAL}}: TLabel
      Left = 12
      Height = 20
      Top = {{CAMPO_TOP}}
      Width = 140
      Caption = '{{CAMPO_CAPTION}}:'
    end
    object edt{{CAMPO_PASCAL}}: {{CAMPO_COMPONENTE}}
      Left = 160
      Height = 28
      Top = {{CAMPO_TOP}}
      Width = 340
    end
{{/LOOP_CAMPOS}}  end
end
