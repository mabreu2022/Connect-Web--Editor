unit uFrSidebar;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} }
{ Componente: TFrSidebar — Menu lateral recolível animado }

interface

uses
  Classes, SysUtils, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, Buttons, LCLType, LCLIntf,
  uTheme;

type
  { Callback de navegação: ATag identifica qual conteúdo carregar }
  TEventoNavegacao = procedure(const ATitulo: string; ATag: Integer) of object;

  { Registro de item de menu }
  TItemMenuSidebar = record
    Icone: string;    // Emoji/char Unicode
    Titulo: string;   // Texto exibido
    Tag: Integer;     // ID da rota
    Separador: Boolean;
  end;

  { TFrSidebar — Frame do menu lateral }
  TFrSidebar = class(TFrame)
    pnlSidebar: TPanel;
      pnlLogo: TPanel;
        lblLogoIcon: TLabel;
        lblLogoNome: TLabel;
        imgLogo: TImage;
      pnlMenuScroll: TPanel;
      pnlRodape: TPanel;
        btnToggle: TSpeedButton;
    tmrAnimate: TTimer;

    procedure tmrAnimateTimer(Sender: TObject);
    procedure pnlSidebarPaint(Sender: TObject);
    procedure btnToggleClick(Sender: TObject);
  private
    FColapsado: Boolean;
    FLarguraAlvo: Integer;
    FItemAtivo: Integer;
    FOnNavegar: TEventoNavegacao;
    FBotoes: TList;      // Lista de TPanels criados dinamicamente
    FLabelsIcon: TList;  // Labels de ícone dos botões
    FLabelsText: TList;  // Labels de texto dos botões
    FItens: array of TItemMenuSidebar;
    FQtdItens: Integer;

    procedure BotaoClick(Sender: TObject);
    procedure BotaoMouseEnter(Sender: TObject);
    procedure BotaoMouseLeave(Sender: TObject);
    procedure AtualizarLarguraBotoes;
    procedure SetItemAtivo(AIndex: Integer);
    procedure ConfigurarCores;
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;

    { Configura o sidebar com nome do sistema e itens do menu }
    procedure Setup(const ANomeSistema: string; const AItens: array of TItemMenuSidebar);

    { Adiciona um item de menu dinamicamente }
    procedure AdicionarItem(const AIcone, ATitulo: string; ATag: Integer; ASeparador: Boolean = False);

    { Anima colapsar/expandir }
    procedure Alternar;
    procedure Colapsar;
    procedure Expandir;

    property Colapsado: Boolean read FColapsado;
    property ItemAtivo: Integer read FItemAtivo write SetItemAtivo;
    property OnNavegar: TEventoNavegacao read FOnNavegar write FOnNavegar;
  end;

implementation

{$R *.lfm}

{ TFrSidebar }

constructor TFrSidebar.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FBotoes    := TList.Create;
  FLabelsIcon := TList.Create;
  FLabelsText := TList.Create;
  FColapsado  := False;
  FItemAtivo  := 0;
  FQtdItens   := 0;
  SetLength(FItens, 0);
  ConfigurarCores;
end;

destructor TFrSidebar.Destroy;
begin
  FBotoes.Free;
  FLabelsIcon.Free;
  FLabelsText.Free;
  inherited Destroy;
end;

procedure TFrSidebar.ConfigurarCores;
begin
  pnlSidebar.Color    := CLR_SIDE_BG;
  pnlLogo.Color       := CLR_SIDE_LOGO;
  pnlMenuScroll.Color := CLR_SIDE_BG;
  pnlRodape.Color     := CLR_SIDE_BG;

  lblLogoIcon.Font.Color := clWhite;
  lblLogoNome.Font.Color := clWhite;

  btnToggle.Font.Color  := clWhite;
  btnToggle.Color       := CLR_SIDE_BG;
end;

procedure TFrSidebar.Setup(const ANomeSistema: string;
  const AItens: array of TItemMenuSidebar);
var
  I: Integer;
  LogoPath, AppPath: string;
begin
  lblLogoNome.Caption := ANomeSistema;
  lblLogoIcon.Caption := '🏢';
  
  // Tenta carregar a logomarca de forma dinâmica
  AppPath := ExtractFilePath(ParamStr(0));
  LogoPath := AppPath + 'view' + PathDelim + 'images' + PathDelim + 'logo.png';
  if not FileExists(LogoPath) then
    LogoPath := AppPath + 'view' + PathDelim + 'images' + PathDelim + 'logo.jpg';
  if not FileExists(LogoPath) then
    LogoPath := AppPath + 'view' + PathDelim + 'images' + PathDelim + 'logo.jpeg';
  if not FileExists(LogoPath) then
    LogoPath := AppPath + 'view' + PathDelim + 'images' + PathDelim + 'logo.bmp';
  if not FileExists(LogoPath) then
    LogoPath := AppPath + 'images' + PathDelim + 'logo.png';
  if not FileExists(LogoPath) then
    LogoPath := AppPath + 'images' + PathDelim + 'logo.jpg';

  if FileExists(LogoPath) then
  begin
    try
      imgLogo.Picture.LoadFromFile(LogoPath);
      imgLogo.Visible := True;
      lblLogoIcon.Visible := False;
    except
      imgLogo.Visible := False;
      lblLogoIcon.Visible := True;
    end;
  end
  else
  begin
    imgLogo.Visible := False;
    lblLogoIcon.Visible := True;
  end;

  for I := 0 to High(AItens) do
    AdicionarItem(AItens[I].Icone, AItens[I].Titulo, AItens[I].Tag, AItens[I].Separador);
  if FQtdItens > 0 then SetItemAtivo(0);
end;

procedure TFrSidebar.AdicionarItem(const AIcone, ATitulo: string; ATag: Integer;
  ASeparador: Boolean = False);
var
  Btn, SepPanel: TPanel;
  LblIcon, LblTxt: TLabel;
  TopPos: Integer;
begin
  if ASeparador and (FQtdItens > 0) then
  begin
    SepPanel := TPanel.Create(Self);
    SepPanel.Parent     := pnlMenuScroll;
    SepPanel.Height     := 1;
    SepPanel.Color      := CLR_SIDE_HOVER;
    SepPanel.BevelOuter := bvNone;
    SepPanel.Align      := alTop;
    SepPanel.Top        := 0;  // alTop stacks automatically
  end;

  TopPos := FQtdItens * 44;

  Btn := TPanel.Create(Self);
  Btn.Parent     := pnlMenuScroll;
  Btn.Height     := 44;
  Btn.Align      := alTop;
  Btn.Top        := TopPos;
  Btn.BevelOuter := bvNone;
  Btn.Color      := CLR_SIDE_BG;
  Btn.Cursor     := crHandPoint;
  Btn.Tag        := ATag;
  Btn.OnClick    := @BotaoClick;
  Btn.OnMouseEnter := @BotaoMouseEnter;
  Btn.OnMouseLeave := @BotaoMouseLeave;

  LblIcon := TLabel.Create(Btn);
  LblIcon.Parent     := Btn;
  LblIcon.Caption    := AIcone;
  LblIcon.Left       := 16;
  LblIcon.Top        := 12;
  LblIcon.Width      := 28;
  LblIcon.Font.Size  := 16;
  LblIcon.Font.Color := clWhite;
  LblIcon.Transparent := True;
  LblIcon.Tag        := ATag;
  LblIcon.OnClick    := @BotaoClick;
  LblIcon.Cursor     := crHandPoint;

  LblTxt := TLabel.Create(Btn);
  LblTxt.Parent      := Btn;
  LblTxt.Caption     := ATitulo;
  LblTxt.Left        := 54;
  LblTxt.Top         := 14;
  LblTxt.Font.Size   := FONT_SIZE_MD;
  LblTxt.Font.Color  := clWhite;
  LblTxt.Transparent := True;
  LblTxt.Tag         := ATag;
  LblTxt.OnClick     := @BotaoClick;
  LblTxt.Cursor      := crHandPoint;

  FBotoes.Add(Btn);
  FLabelsIcon.Add(LblIcon);
  FLabelsText.Add(LblTxt);
  Inc(FQtdItens);

  // Armazena metadata do item
  SetLength(FItens, FQtdItens);
  FItens[FQtdItens - 1].Icone  := AIcone;
  FItens[FQtdItens - 1].Titulo := ATitulo;
  FItens[FQtdItens - 1].Tag    := ATag;
end;

procedure TFrSidebar.BotaoClick(Sender: TObject);
var
  LTag, I: Integer;
begin
  LTag := (Sender as TControl).Tag;
  // Encontra o índice pelo Tag
  for I := 0 to FBotoes.Count - 1 do
    if TPanel(FBotoes[I]).Tag = LTag then
    begin
      SetItemAtivo(I);
      Break;
    end;
  if Assigned(FOnNavegar) then
    FOnNavegar(FItens[FItemAtivo].Titulo, LTag);
end;

procedure TFrSidebar.BotaoMouseEnter(Sender: TObject);
var
  Btn: TPanel;
begin
  Btn := Sender as TPanel;
  if TPanel(FBotoes[FItemAtivo]).Tag <> Btn.Tag then
    Btn.Color := CLR_SIDE_HOVER;
end;

procedure TFrSidebar.BotaoMouseLeave(Sender: TObject);
var
  Btn: TPanel;
begin
  Btn := Sender as TPanel;
  if TPanel(FBotoes[FItemAtivo]).Tag <> Btn.Tag then
    Btn.Color := CLR_SIDE_BG;
end;

procedure TFrSidebar.SetItemAtivo(AIndex: Integer);
var
  I: Integer;
begin
  if AIndex < 0 then Exit;
  // Desativa todos
  for I := 0 to FBotoes.Count - 1 do
    TPanel(FBotoes[I]).Color := CLR_SIDE_BG;
  // Ativa o selecionado
  FItemAtivo := AIndex;
  TPanel(FBotoes[AIndex]).Color := CLR_SIDE_ACTIVE;
end;

procedure TFrSidebar.AtualizarLarguraBotoes;
var
  I: Integer;
  Visivel: Boolean;
begin
  Visivel := not FColapsado;
  lblLogoNome.Visible := Visivel;
  for I := 0 to FLabelsText.Count - 1 do
    TLabel(FLabelsText[I]).Visible := Visivel;
end;

procedure TFrSidebar.Alternar;
begin
  if FColapsado then Expandir else Colapsar;
end;

procedure TFrSidebar.Colapsar;
begin
  FColapsado    := True;
  FLarguraAlvo  := DIM_SIDEBAR_COLLAPSED;
  tmrAnimate.Enabled := True;
end;

procedure TFrSidebar.Expandir;
begin
  FColapsado    := False;
  FLarguraAlvo  := DIM_SIDEBAR_EXPANDED;
  tmrAnimate.Enabled := True;
end;

procedure TFrSidebar.tmrAnimateTimer(Sender: TObject);
var
  Diff, Passo: Integer;
begin
  Diff := FLarguraAlvo - pnlSidebar.Width;
  if Abs(Diff) <= DIM_ANIM_STEP then
  begin
    pnlSidebar.Width   := FLarguraAlvo;
    Width              := FLarguraAlvo;
    tmrAnimate.Enabled := False;
    AtualizarLarguraBotoes;
  end
  else
  begin
    if Diff > 0 then Passo := DIM_ANIM_STEP else Passo := -DIM_ANIM_STEP;
    pnlSidebar.Width := pnlSidebar.Width + Passo;
    Width            := pnlSidebar.Width;
  end;
end;

procedure TFrSidebar.pnlSidebarPaint(Sender: TObject);
begin
  // Borda direita discreta (separador visual)
  with pnlSidebar.Canvas do
  begin
    Pen.Color := CLR_SIDE_HOVER;
    Pen.Width := 1;
    MoveTo(pnlSidebar.Width - 1, 0);
    LineTo(pnlSidebar.Width - 1, pnlSidebar.Height);
  end;
end;

procedure TFrSidebar.btnToggleClick(Sender: TObject);
begin
  Alternar;
end;

end.
