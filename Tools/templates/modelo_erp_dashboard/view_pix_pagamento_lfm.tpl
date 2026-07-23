object TViewPixPagamento: TViewPixPagamento
  Left = 100
  Height = 680
  Top = 60
  Width = 560
  BorderStyle = bsDialog
  Caption = 'Cobrança PIX'
  ClientHeight = 680
  ClientWidth = 560
  Color = 1710622
  Font.Height = -13
  Font.Name = 'Segoe UI'
  Position = poMainFormCenter
  KeyPreview = True
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  OnShow = FormShow
  object pnlTopo: TPanel
    Left = 0
    Height = 104
    Top = 0
    Width = 560
    Align = alTop
    BevelOuter = bvNone
    Color = 2984043
    object pnlIconPix: TPanel
      Left = 0
      Height = 104
      Top = 0
      Width = 100
      Align = alLeft
      BevelOuter = bvNone
      Color = 2984043
      object lblIconPix: TLabel
        Left = 20
        Height = 64
        Top = 20
        Width = 64
        Caption = '⚡'
        Font.Color = clWhite
        Font.Height = -48
        Font.Name = 'Segoe UI'
        Transparent = True
      end
    end
    object pnlTopoInfo: TPanel
      Left = 100
      Height = 104
      Top = 0
      Width = 460
      Align = alClient
      BevelOuter = bvNone
      Color = 2984043
      object lblTituloCobranca: TLabel
        Left = 8
        Height = 22
        Top = 10
        Width = 440
        Caption = 'PIX — Chave: '
        Font.Color = clWhite
        Font.Height = -15
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
      object lblValor: TLabel
        Left = 8
        Height = 44
        Top = 32
        Width = 300
        Caption = 'R$ 0,00'
        Font.Color = clWhite
        Font.Height = -32
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
      object lblStatus: TLabel
        Left = 8
        Height = 22
        Top = 78
        Width = 440
        Caption = '⏳  Aguardando pagamento...'
        Font.Color = 11206570
        Font.Height = -14
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
    end
  end
  object pnlCorpo: TPanel
    Left = 0
    Height = 408
    Top = 104
    Width = 560
    Align = alTop
    BevelOuter = bvNone
    Color = 3224372
    object imgQRCode: TImage
      Left = 100
      Height = 300
      Top = 8
      Width = 360
      Center = True
      Stretch = False
      OnPaint = imgQRCodePaint
    end
    object pnlSep: TPanel
      Left = 0
      Height = 2
      Top = 316
      Width = 560
      Align = alTop
      BevelOuter = bvNone
      Color = 3817280
    end
    object pnlCopiaECola: TPanel
      Left = 0
      Height = 90
      Top = 318
      Width = 560
      Align = alTop
      BevelOuter = bvNone
      Color = 2302735
      object lblCopiaLegenda: TLabel
        Left = 8
        Height = 18
        Top = 6
        Width = 480
        Caption = '💡 Copia e Cola (escaneie o QR ou copie o código):'
        Font.Color = 11184810
        Font.Height = -12
        Font.Name = 'Segoe UI'
        Transparent = True
      end
      object edtPayload: TEdit
        Left = 8
        Height = 32
        Top = 26
        Width = 420
        Anchors = [akTop, akLeft, akRight]
        Color = 2039583
        Font.Color = 9187071
        Font.Height = -12
        Font.Name = 'Consolas'
        ReadOnly = True
      end
      object btnCopiar: TButton
        Left = 436
        Height = 32
        Top = 26
        Width = 116
        Anchors = [akTop, akRight]
        Caption = '📋 Copiar'
        Font.Color = clWhite
        Font.Height = -13
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        OnClick = btnCopiarClick
      end
    end
  end
  object pnlTimer: TPanel
    Left = 0
    Height = 68
    Top = 512
    Width = 560
    Align = alTop
    BevelOuter = bvNone
    Color = 1710622
    object pbTimer: TProgressBar
      Left = 8
      Height = 20
      Top = 8
      Width = 544
      Anchors = [akTop, akLeft, akRight]
      Max = 300
      Position = 300
    end
    object lblTempoRestante: TLabel
      Left = 8
      Height = 20
      Top = 32
      Width = 200
      Caption = '⏱  Expira em  5:00'
      Font.Color = 17101
      Font.Height = -14
      Font.Name = 'Segoe UI'
      Font.Style = [fsBold]
      Transparent = True
    end
    object lblInstrucoes: TLabel
      Left = 220
      Height = 20
      Top = 32
      Width = 330
      Alignment = taRightJustify
      Anchors = [akTop, akRight]
      Caption = 'Abra seu banco → PIX → Pagar → Escaneie ou cole'
      Font.Color = 11184810
      Font.Height = -11
      Font.Name = 'Segoe UI'
      Transparent = True
    end
  end
  object pnlBotoes: TPanel
    Left = 0
    Height = 68
    Top = 580
    Width = 560
    Align = alBottom
    BevelOuter = bvNone
    Color = 1710622
    object btnCancelar: TBitBtn
      Left = 8
      Height = 52
      Top = 8
      Width = 140
      Caption = '✕  Cancelar'
      Font.Color = clWhite
      Font.Height = -14
      Font.Name = 'Segoe UI'
      Kind = bkCancel
      OnClick = btnCancelarClick
    end
    object btnConfirmar: TBitBtn
      Left = 380
      Height = 52
      Top = 8
      Width = 172
      Anchors = [akTop, akRight]
      Caption = '✓  Confirmar Recebimento'
      Font.Color = clWhite
      Font.Height = -14
      Font.Name = 'Segoe UI'
      Font.Style = [fsBold]
      Kind = bkOk
      OnClick = btnConfirmarClick
    end
  end
  object tmrContagem: TTimer
    Enabled = False
    Interval = 1000
    OnTimer = tmrContagemTimer
    Left = 520
    Top = 8
  end
  object tmrExpirar: TTimer
    Enabled = False
    Interval = 800
    OnTimer = tmrExpirarTimer
    Left = 520
    Top = 40
  end
end
