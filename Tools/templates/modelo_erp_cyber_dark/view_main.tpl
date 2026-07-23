unit uViewMain;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} — Formulário principal ERP }
{ Layout: Sidebar esquerda (recolível) + Header + Área de conteúdo }

interface

uses
  Classes, SysUtils, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, Buttons, ComCtrls,
  uTheme,
  uFrSidebar,
  uViewDashboard
  { Adicione aqui as units dos seus Frames de CRUD };

type
  { TfrmMain — Formulário principal do sistema }
  TfrmMain = class(TForm)
    pnlHeader: TPanel;
      lblSistemaNome: TLabel;
      lblUsuario: TLabel;
      lblDataHora: TLabel;
      btnNotificacoes: TSpeedButton;
    pnlBody: TPanel;
      frSidebar: TFrSidebar;
      pnlConteudo: TPanel;
        pnlConteudoHeader: TPanel;
          lblConteudoTitulo: TLabel;
          lblConteudoBreadcrumb: TLabel;
        pnlConteudoBody: TPanel;
    tmrRelogio: TTimer;

    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure tmrRelogioTimer(Sender: TObject);
    procedure NavegacaoHandler(const ATitulo: string; ATag: Integer);
  private
    FFrameAtual: TFrame;  // Frame de conteúdo atualmente visível

    procedure ConfigurarInterface;
    procedure ConfigurarSidebar;
    procedure ExibirFrame(AFrame: TFrame; const ATitulo: string);
    procedure LimparConteudo;
    procedure ExibirDashboard;
    procedure ConfigurarCores;
  public
    property FrameAtual: TFrame read FFrameAtual;
  end;

var
  frmMain: TfrmMain;

implementation

{$R *.lfm}

uses
  uDMConexao;

{ TfrmMain }

procedure TfrmMain.FormCreate(Sender: TObject);
begin
  ConfigurarCores;
  ConfigurarInterface;
  ConfigurarSidebar;
  tmrRelogio.Enabled := True;
end;

procedure TfrmMain.FormDestroy(Sender: TObject);
begin
  LimparConteudo;
end;

procedure TfrmMain.FormShow(Sender: TObject);
begin
  ExibirDashboard;
end;

procedure TfrmMain.ConfigurarCores;
begin
  Color                     := CLR_CONTENT_BG;
  pnlHeader.Color           := CLR_CARD_BG;
  pnlBody.Color             := CLR_CONTENT_BG;
  pnlConteudo.Color         := CLR_CONTENT_BG;
  pnlConteudoHeader.Color   := CLR_CARD_BG;
  pnlConteudoBody.Color     := CLR_CONTENT_BG;

  lblSistemaNome.Font.Color := CLR_TEXT_PRIMARY;
  lblSistemaNome.Font.Style := [fsBold];
  lblConteudoTitulo.Font.Color    := CLR_TEXT_PRIMARY;
  lblConteudoTitulo.Font.Style    := [fsBold];
  lblConteudoBreadcrumb.Font.Color := CLR_TEXT_SECONDARY;
end;

procedure TfrmMain.ConfigurarInterface;
begin
  Caption := '{{NOME_SISTEMA}}';
  lblSistemaNome.Caption := '{{NOME_SISTEMA}}';

  // Maximiza automaticamente
  WindowState := wsMaximized;
end;

procedure TfrmMain.ConfigurarSidebar;
var
  Itens: array of TItemMenuSidebar;
begin
  // ============================================================
  // Defina aqui os itens do menu lateral do seu sistema
  // ATag identifica qual frame exibir em NavegacaoHandler
  // ============================================================
  SetLength(Itens, 7);
  Itens[0].Icone := ICO_DASHBOARD;  Itens[0].Titulo := 'Dashboard'; Itens[0].Tag := 0;
  // Adicione os módulos abaixo conforme suas tabelas:
  Itens[1].Icone := ICO_CLIENTES;   Itens[1].Titulo := 'Clientes';  Itens[1].Tag := 1;
  Itens[2].Icone := ICO_PRODUTOS;   Itens[2].Titulo := 'Produtos';  Itens[2].Tag := 2;
  Itens[3].Icone := ICO_PEDIDOS;    Itens[3].Titulo := 'Pedidos';   Itens[3].Tag := 3;
  Itens[4].Icone := ICO_PDV;        Itens[4].Titulo := 'PDV';       Itens[4].Tag := 4; Itens[4].Separador := True;
  Itens[5].Icone := ICO_RELATORIOS; Itens[5].Titulo := 'Relatórios';Itens[5].Tag := 5; Itens[5].Separador := True;
  Itens[6].Icone := ICO_CONFIG;     Itens[6].Titulo := 'Config.';   Itens[6].Tag := 99;Itens[6].Separador := True;

  frSidebar.OnNavegar := @NavegacaoHandler;
  frSidebar.Setup('{{NOME_SISTEMA}}', Itens);
end;

procedure TfrmMain.NavegacaoHandler(const ATitulo: string; ATag: Integer);
begin
  // ============================================================
  // TODO: Instancie e exiba o frame correto para cada Tag
  // Exemplo:
  // case ATag of
  //   0: ExibirDashboard;
  //   1: ExibirFrame(TFrListaClientes.Create(pnlConteudoBody), 'Clientes');
  //   2: ExibirFrame(TFrListaProdutos.Create(pnlConteudoBody), 'Produtos');
  //   4: ExibirFrame(TViewPDV.Create(pnlConteudoBody), 'PDV');
  // end;
  // ============================================================
  lblConteudoTitulo.Caption     := ATitulo;
  lblConteudoBreadcrumb.Caption := '{{NOME_SISTEMA}} › ' + ATitulo;

  case ATag of
    0: ExibirDashboard;
    else
    begin
      LimparConteudo;
      // TODO: adicione seus frames aqui
    end;
  end;
end;

procedure TfrmMain.ExibirDashboard;
var
  FrDash: TfrmDashboard;
begin
  LimparConteudo;
  lblConteudoTitulo.Caption     := 'Dashboard';
  lblConteudoBreadcrumb.Caption := '{{NOME_SISTEMA}} › Dashboard';
  FrDash := TfrmDashboard.Create(pnlConteudoBody);
  FrDash.Parent := pnlConteudoBody;
  FrDash.Align  := alClient;
  FrDash.BorderStyle := bsNone;
  FrDash.Show;
  FFrameAtual := nil;
end;

procedure TfrmMain.ExibirFrame(AFrame: TFrame; const ATitulo: string);
begin
  LimparConteudo;
  lblConteudoTitulo.Caption     := ATitulo;
  lblConteudoBreadcrumb.Caption := '{{NOME_SISTEMA}} › ' + ATitulo;
  AFrame.Parent := pnlConteudoBody;
  AFrame.Align  := alClient;
  AFrame.Visible := True;
  FFrameAtual := AFrame;
end;

procedure TfrmMain.LimparConteudo;
var
  I: Integer;
  C: TControl;
begin
  for I := pnlConteudoBody.ControlCount - 1 downto 0 do
  begin
    C := pnlConteudoBody.Controls[I];
    C.Free;
  end;
  FFrameAtual := nil;
end;

procedure TfrmMain.tmrRelogioTimer(Sender: TObject);
begin
  lblDataHora.Caption := FormatDateTime('ddd, dd/mm/yyyy  hh:nn', Now);
end;

end.
