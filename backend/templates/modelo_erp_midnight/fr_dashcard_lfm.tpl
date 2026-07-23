object TFrDashCard: TFrDashCard
  Left = 0
  Height = 140
  Top = 0
  Width = 240
  object pnlCard: TPanel
    Left = 0
    Height = 140
    Top = 0
    Width = 240
    Align = alClient
    BevelOuter = bvNone
    Color = clWhite
    OnMouseEnter = FrameMouseEnter
    OnMouseLeave = FrameMouseLeave
    OnPaint = pnlCardPaint
    object pnlCardBarra: TPanel
      Left = 0
      Height = 4
      Top = 0
      Width = 240
      Align = alTop
      BevelOuter = bvNone
      Color = 16609293
    end
    object pnlCardHeader: TPanel
      Left = 0
      Height = 36
      Top = 4
      Width = 240
      Align = alTop
      BevelOuter = bvNone
      Color = clWhite
      object lblTitulo: TLabel
        Left = 16
        Height = 20
        Top = 10
        Width = 180
        Caption = 'TÍTULO'
        Font.Color = 7829367
        Font.Height = -12
        Font.Name = 'Segoe UI'
        Transparent = True
      end
      object lblIcone: TLabel
        Left = 192
        Height = 36
        Top = 0
        Width = 40
        Alignment = taCenter
        Caption = '📊'
        Font.Height = -22
        Transparent = True
      end
    end
    object pnlCardBody: TPanel
      Left = 0
      Height = 100
      Top = 40
      Width = 240
      Align = alClient
      BevelOuter = bvNone
      Color = clWhite
      object lblValor: TLabel
        Left = 16
        Height = 44
        Top = 8
        Width = 200
        Caption = '0'
        Font.Color = 2236196
        Font.Height = -32
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
      object lblVariacao: TLabel
        Left = 16
        Height = 20
        Top = 58
        Width = 120
        Caption = ''
        Font.Height = -12
        Font.Name = 'Segoe UI'
        Transparent = True
      end
      object lblSubtitulo: TLabel
        Left = 16
        Height = 20
        Top = 78
        Width = 200
        Caption = ''
        Font.Color = 11382189
        Font.Height = -11
        Font.Name = 'Segoe UI'
        Transparent = True
      end
    end
  end
end
