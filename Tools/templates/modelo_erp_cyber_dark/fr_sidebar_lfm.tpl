object TFrSidebar: TFrSidebar
  Left = 0
  Height = 768
  Top = 0
  Width = 220
  object pnlSidebar: TPanel
    Left = 0
    Height = 768
    Top = 0
    Width = 220
    Align = alClient
    BevelOuter = bvNone
    Color = 3023898
    OnPaint = pnlSidebarPaint
    object pnlLogo: TPanel
      Left = 0
      Height = 72
      Top = 0
      Width = 220
      Align = alTop
      BevelOuter = bvNone
      Color = 2697513
      object lblLogoIcon: TLabel
        Left = 12
        Height = 40
        Top = 16
        Width = 40
        Caption = '🏢'
        Font.Height = -28
        Font.Color = clWhite
        Font.Name = 'Segoe UI'
        Transparent = True
      end
      object imgLogo: TImage
        Left = 12
        Height = 40
        Top = 16
        Width = 40
        Center = True
        Proportional = True
        Stretch = True
        Visible = False
      end
      object lblLogoNome: TLabel
        Left = 56
        Height = 24
        Top = 24
        Width = 155
        Caption = '{{NOME_SISTEMA}}'
        Font.Color = clWhite
        Font.Height = -15
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
    end
    object pnlMenuScroll: TPanel
      Left = 0
      Height = 640
      Top = 72
      Width = 220
      Align = alClient
      BevelOuter = bvNone
      Color = 3023898
    end
    object pnlRodape: TPanel
      Left = 0
      Height = 56
      Top = 712
      Width = 220
      Align = alBottom
      BevelOuter = bvNone
      Color = 3023898
      object btnToggle: TSpeedButton
        Left = 8
        Height = 40
        Top = 8
        Width = 204
        Caption = '☰  Recolher menu'
        Font.Color = clWhite
        Font.Height = -14
        Font.Name = 'Segoe UI'
        Flat = True
        OnClick = btnToggleClick
      end
    end
  end
  object tmrAnimate: TTimer
    Enabled = False
    Interval = 12
    OnTimer = tmrAnimateTimer
    Left = 8
    Top = 8
  end
end
