object TfrmDashboard: TfrmDashboard
  Left = 0
  Height = 640
  Top = 0
  Width = 1040
  BorderStyle = bsNone
  Caption = 'Dashboard'
  ClientHeight = 640
  ClientWidth = 1040
  Color = 16053488
  Font.Name = 'Segoe UI'
  OnCreate = FormCreate
  OnShow = FormShow
  object scbDash: TScrollBox
    Left = 0
    Height = 640
    Top = 0
    Width = 1040
    Align = alClient
    BorderStyle = bsNone
    Color = 16053488
    object pnlKPIs: TPanel
      Left = 0
      Height = 160
      Top = 0
      Width = 1040
      Align = alTop
      BevelOuter = bvNone
      Color = 16053488
      object cardTotal1: TFrDashCard
        Left = 8
        Height = 140
        Top = 10
        Width = 240
      end
      object cardTotal2: TFrDashCard
        Left = 264
        Height = 140
        Top = 10
        Width = 240
      end
      object cardTotal3: TFrDashCard
        Left = 520
        Height = 140
        Top = 10
        Width = 240
      end
      object cardTotal4: TFrDashCard
        Left = 776
        Height = 140
        Top = 10
        Width = 240
      end
    end
    object pnlAtividade: TPanel
      Left = 8
      Height = 280
      Top = 168
      Width = 500
      BevelOuter = bvNone
      Color = clWhite
      object lblAtivTitulo: TLabel
        Left = 12
        Height = 24
        Top = 8
        Width = 200
        Caption = 'Atividade Recente'
        Font.Height = -16
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
      object grdAtividade: TStringGrid
        Left = 8
        Height = 228
        Top = 40
        Width = 484
        Anchors = [akTop, akLeft, akRight, akBottom]
        DefaultRowHeight = 26
        FixedCols = 0
        Font.Name = 'Segoe UI'
        RowCount = 2
      end
    end
    object pnlGraficos: TPanel
      Left = 524
      Height = 280
      Top = 168
      Width = 508
      BevelOuter = bvNone
      Color = clWhite
      object lblGrafTitulo: TLabel
        Left = 12
        Height = 24
        Top = 8
        Width = 240
        Caption = 'Desempenho Semanal'
        Font.Height = -16
        Font.Name = 'Segoe UI'
        Font.Style = [fsBold]
        Transparent = True
      end
      object imgGrafico: TImage
        Left = 8
        Height = 228
        Top = 40
        Width = 492
        Anchors = [akTop, akLeft, akRight, akBottom]
      end
    end
  end
  object tmrRefresh: TTimer
    Interval = 60000
    OnTimer = tmrRefreshTimer
    Left = 8
    Top = 8
  end
end
