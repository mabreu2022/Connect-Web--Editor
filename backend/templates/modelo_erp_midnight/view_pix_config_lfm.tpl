object TViewPixConfig: TViewPixConfig
  Left = 120
  Height = 760
  Top = 40
  Width = 700
  BorderStyle = bsDialog
  Caption = '⚡ Configuração PIX — Chave de Recebimento'
  ClientHeight = 760
  ClientWidth = 700
  Color = 1710622
  Font.Height = -13
  Font.Name = 'Segoe UI'
  Position = poMainFormCenter
  OnCreate = FormCreate
  OnShow = FormShow
  object pnlHeader: TPanel
    Left = 0
    Height = 80
    Top = 0
    Width = 700
    Align = alTop
    BevelOuter = bvNone
    Color = 2984043
    object lblHeaderIcon: TLabel
      Left = 12
      Height = 52
      Top = 14
      Width = 52
      Caption = '⚡'
      Font.Color = clWhite
      Font.Height = -40
      Font.Name = 'Segoe UI'
      Transparent = True
    end
    object lblHeaderTitulo: TLabel
      Left = 68
      Height = 26
      Top = 10
      Width = 400
      Caption = 'Configuração PIX'
      Font.Color = clWhite
      Font.Height = -20
      Font.Name = 'Segoe UI'
      Font.Style = [fsBold]
      Transparent = True
    end
    object lblHeaderDesc: TLabel
      Left = 68
      Height = 20
      Top = 40
      Width = 600
      Caption = 'Configure a chave PIX para receber pagamentos no PDV. Dados salvos em {{NOME_SISTEMA}}.ini'
      Font.Color = 11206570
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Transparent = True
    end
  end
  object pnlBotoes: TPanel
    Left = 0
    Height = 60
    Top = 700
    Width = 700
    Align = alBottom
    BevelOuter = bvNone
    Color = 1710622
    object btnCancelar: TBitBtn
      Left = 8
      Height = 44
      Top = 8
      Width = 120
      Caption = 'Cancelar'
      Font.Name = 'Segoe UI'
      Kind = bkCancel
      OnClick = btnCancelarClick
    end
    object btnSalvar: TBitBtn
      Left = 556
      Height = 44
      Top = 8
      Width = 136
      Anchors = [akTop, akRight]
      Caption = '✓  Salvar Configuração'
      Font.Color = clWhite
      Font.Height = -14
      Font.Name = 'Segoe UI'
      Font.Style = [fsBold]
      Kind = bkOk
      OnClick = btnSalvarClick
    end
  end
  object pnlForm: TPanel
    Left = 0
    Height = 620
    Top = 80
    Width = 700
    Align = alClient
    BevelOuter = bvNone
    Color = 2302735
    object pnlPixAtivo: TPanel
      Left = 0
      Height = 56
      Top = 0
      Width = 700
      Align = alTop
      BevelOuter = bvNone
      Color = 1713706
      object chkPixAtivo: TCheckBox
        Left = 12
        Height = 28
        Top = 6
        Width = 200
        Caption = 'Habilitar PIX no PDV'
        Font.Color = clWhite
        Font.Height = -15
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        OnChange = chkPixAtivoChange
      end
      object lblPixAtivoDesc: TLabel
        Left = 12
        Height = 18
        Top = 34
        Width = 676
        Caption = 'Marque para exibir o botão PIX na tela de pagamento do PDV'
        Font.Color = 9868950
        Font.Height = -12
        Font.Name = 'Segoe UI'
        Transparent = True
      end
    end
    object pnlSep1: TPanel
      Left = 0
      Height = 2
      Top = 56
      Width = 700
      Align = alTop
      BevelOuter = bvNone
      Color = 3817280
    end
    object lblTipoChave: TLabel
      Left = 12 Height = 18 Top = 68 Width = 120 Caption = 'Tipo de Chave PIX:' Font.Name = 'Segoe UI' Transparent = True Font.Color = clWhite
    end
    object cmbTipoChave: TComboBox
      Left = 12 Height = 28 Top = 86 Width = 300 Font.Height = -13 Font.Name = 'Segoe UI' Style = csDropDownList OnChange = cmbTipoChaveChange
    end
    object lblChavePIX: TLabel
      Left = 12 Height = 18 Top = 124 Width = 120 Caption = 'Chave PIX *:' Font.Name = 'Segoe UI' Transparent = True Font.Color = clWhite
    end
    object edtChavePIX: TEdit
      Left = 12 Height = 30 Top = 142 Width = 540 Font.Height = -14 Font.Name = 'Segoe UI' OnChange = edtChavePIXChange
    end
    object lblChaveDica: TLabel
      Left = 12 Height = 18 Top = 176 Width = 676
      Caption = 'Ex: 00000000000 (CPF, somente números)' Font.Height = -11 Font.Name = 'Segoe UI' Transparent = True Font.Color = 9868950
    end
    object lblNomeRecebedor: TLabel
      Left = 12 Height = 18 Top = 202 Width = 200 Caption = 'Nome do Recebedor * (máx. 25):' Font.Name = 'Segoe UI' Transparent = True Font.Color = clWhite
    end
    object edtNomeRecebedor: TEdit
      Left = 12 Height = 30 Top = 220 Width = 360 Font.Height = -13 Font.Name = 'Segoe UI' OnChange = edtNomeRecebedorChange
    end
    object lblNomeDica: TLabel
      Left = 380 Height = 30 Top = 220 Width = 200 Caption = '0/25 chars (limite BCB)' Font.Height = -11 Font.Name = 'Segoe UI' Transparent = True Font.Color = 9868950 Layout = tlCenter
    end
    object lblCidade: TLabel
      Left = 12 Height = 18 Top = 258 Width = 140 Caption = 'Cidade * (máx. 15):' Font.Name = 'Segoe UI' Transparent = True Font.Color = clWhite
    end
    object edtCidade: TEdit
      Left = 12 Height = 30 Top = 276 Width = 220 Font.Height = -13 Font.Name = 'Segoe UI'
    end
    object lblCNPJ: TLabel
      Left = 250 Height = 18 Top = 258 Width = 120 Caption = 'CNPJ (opcional):' Font.Name = 'Segoe UI' Transparent = True Font.Color = clWhite
    end
    object edtCNPJ: TEdit
      Left = 250 Height = 30 Top = 276 Width = 200 Font.Height = -13 Font.Name = 'Segoe UI'
    end
    object lblDescricao: TLabel
      Left = 12 Height = 18 Top = 314 Width = 200 Caption = 'Descrição Padrão (opcional):' Font.Name = 'Segoe UI' Transparent = True Font.Color = clWhite
    end
    object edtDescricao: TEdit
      Left = 12 Height = 30 Top = 332 Width = 540 Font.Height = -13 Font.Name = 'Segoe UI'
    end
    object lblExpiracao: TLabel
      Left = 12 Height = 18 Top = 370 Width = 180 Caption = 'QR Code expira em:' Font.Name = 'Segoe UI' Transparent = True Font.Color = clWhite
    end
    object spnExpiracao: TSpinEdit
      Left = 12 Height = 30 Top = 388 Width = 100 Font.Height = -13 MinValue = 30 MaxValue = 3600 Value = 300
    end
    object lblExpiracaoSufixo: TLabel
      Left = 120 Height = 30 Top = 388 Width = 200 Caption = 'segundos (30–3600)' Font.Name = 'Segoe UI' Transparent = True Font.Color = 9868950 Layout = tlCenter
    end
    object pnlSep2: TPanel
      Left = 0 Height = 2 Top = 428 Width = 700 BevelOuter = bvNone Color = 3817280
    end
    object pnlPreview: TPanel
      Left = 8 Height = 80 Top = 434 Width = 684
      BevelOuter = bvNone Color = 2039583
      object lblPreviewTitulo: TLabel
        Left = 8 Height = 18 Top = 4 Width = 200 Caption = 'Pré-visualização:' Font.Color = 11184810 Font.Style = [fsBold] Font.Name = 'Segoe UI' Transparent = True
      end
      object lblPreviewChave: TLabel
        Left = 8 Height = 22 Top = 22 Width = 660 Caption = '(informe a chave PIX)' Font.Color = 4587627 Font.Height = -14 Font.Name = 'Consolas' Font.Style = [fsBold] Transparent = True
      end
      object lblPreviewNome: TLabel
        Left = 8 Height = 18 Top = 46 Width = 400 Caption = '(informe o nome do recebedor)' Font.Color = 13421772 Font.Name = 'Segoe UI' Transparent = True
      end
      object lblPreviewValidacao: TLabel
        Left = 8 Height = 18 Top = 64 Width = 500 Caption = '' Font.Color = 16736580 Font.Name = 'Segoe UI' Font.Style = [fsBold] Transparent = True
      end
    end
    object pnlTeste: TPanel
      Left = 8 Height = 114 Top = 522 Width = 684
      BevelOuter = bvNone Color = 2039583
      object lblTesteValor: TLabel
        Left = 8 Height = 18 Top = 4 Width = 200 Caption = 'Testar com valor (R$):' Font.Color = 11184810 Font.Name = 'Segoe UI' Transparent = True
      end
      object edtTesteValor: TEdit
        Left = 8 Height = 28 Top = 22 Width = 120 Font.Name = 'Segoe UI' Text = '1,00'
      end
      object btnTestarPayload: TButton
        Left = 136 Height = 28 Top = 22 Width = 140 Caption = '▶ Gerar Payload de Teste' Font.Name = 'Segoe UI' OnClick = btnTestarPayloadClick
      end
      object mmoTestePayload: TMemo
        Left = 8 Height = 68 Top = 54 Width = 668
        BorderStyle = bsNone Font.Name = 'Consolas' Font.Height = -11 ReadOnly = True ScrollBars = ssVertical WordWrap = False
      end
    end
  end
end
