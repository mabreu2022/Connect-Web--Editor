object TfrmMain: TfrmMain
  Left = 0
  Height = 768
  Top = 0
  Width = 1280
  Caption = '{{NOME_SISTEMA}}'
  ClientHeight = 768
  ClientWidth = 1280
  Color = 16053488
  Font.Name = 'Segoe UI'
  Font.Height = -13
  Position = poScreenCenter
  WindowState = wsMaximized
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  OnShow = FormShow
  object pnlHeader: TPanel
    Left = 0
    Height = 56
    Top = 0
    Width = 1280
    Align = alTop
    BevelOuter = bvNone
    Color = clWhite
    object lblSistemaNome: TLabel
      Left = 16
      Height = 28
      Top = 14
      Width = 300
      Caption = '{{NOME_SISTEMA}}'
      Font.Height = -20
      Font.Name = 'Segoe UI'
      Font.Style = [fsBold]
      Font.Color = 2236196
      Transparent = True
    end
    object lblDataHora: TLabel
      Left = 900
      Height = 20
      Top = 18
      Width = 240
      Alignment = taRightJustify
      Anchors = [akTop, akRight]
      Caption = ''
      Font.Color = 7829367
      Font.Height = -12
      Font.Name = 'Segoe UI'
      Transparent = True
    end
    object lblUsuario: TLabel
      Left = 1150
      Height = 20
      Top = 18
      Width = 120
      Alignment = taRightJustify
      Anchors = [akTop, akRight]
      Caption = 'SYSDBA'
      Font.Color = 16609293
      Font.Height = -12
      Font.Style = [fsBold]
      Font.Name = 'Segoe UI'
      Transparent = True
    end
    object btnNotificacoes: TSpeedButton
      Left = 1240
      Height = 40
      Top = 8
      Width = 40
      Anchors = [akTop, akRight]
      Caption = '🔔'
      Flat = True
      Font.Height = -18
    end
  end
  object pnlBody: TPanel
    Left = 0
    Height = 712
    Top = 56
    Width = 1280
    Align = alClient
    BevelOuter = bvNone
    Color = 16053488
    object frSidebar: TFrSidebar
      Left = 0
      Height = 712
      Top = 0
      Width = 220
      Align = alLeft
    end
    object pnlConteudo: TPanel
      Left = 220
      Height = 712
      Top = 0
      Width = 1060
      Align = alClient
      BevelOuter = bvNone
      Color = 16053488
      object pnlConteudoHeader: TPanel
        Left = 0
        Height = 56
        Top = 0
        Width = 1060
        Align = alTop
        BevelOuter = bvNone
        Color = clWhite
        object lblConteudoTitulo: TLabel
          Left = 20
          Height = 26
          Top = 8
          Width = 300
          Caption = 'Dashboard'
          Font.Color = 2236196
          Font.Height = -19
          Font.Name = 'Segoe UI'
          Font.Style = [fsBold]
          Transparent = True
        end
        object lblConteudoBreadcrumb: TLabel
          Left = 20
          Height = 18
          Top = 36
          Width = 300
          Caption = '{{NOME_SISTEMA}} › Dashboard'
          Font.Color = 7829367
          Font.Height = -11
          Font.Name = 'Segoe UI'
          Transparent = True
        end
      end
      object pnlConteudoBody: TPanel
        Left = 0
        Height = 656
        Top = 56
        Width = 1060
        Align = alClient
        BevelOuter = bvNone
        Color = 16053488
      end
    end
  end
  object tmrRelogio: TTimer
    Interval = 30000
    OnTimer = tmrRelogioTimer
    Left = 8
    Top = 8
  end
end
