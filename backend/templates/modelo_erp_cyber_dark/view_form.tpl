unit uFrForm{{NOME_TABELA_PASCAL}};

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} | Tabela: {{NOME_TABELA}} }
{ CAMADA: VIEW — Formulário CRUD ERP (Dialog Modal, usa IController) }

interface

uses
  Classes, SysUtils, Variants, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, Buttons, DateTimePicker,
  uTheme,
  uModel{{NOME_TABELA_PASCAL}},
  uInterfaces{{NOME_TABELA_PASCAL}},
  uController{{NOME_TABELA_PASCAL}};

type
  { TFrForm{{NOME_TABELA_PASCAL}} }
  TFrForm{{NOME_TABELA_PASCAL}} = class(TForm)
    pnlTopo: TPanel;
      lblFormTitulo: TLabel;
      lblFormModo: TLabel;
    pnlBotoes: TPanel;
      btnSalvar: TBitBtn;
      btnCancelar: TBitBtn;
    ScrollBox1: TScrollBox;
{{LOOP_CAMPOS}}    lbl{{CAMPO_PASCAL}}: TLabel;
    edt{{CAMPO_PASCAL}}: TEdit;
{{/LOOP_CAMPOS}}
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure btnSalvarClick(Sender: TObject);
    procedure btnCancelarClick(Sender: TObject);
  private
    FController: IController{{NOME_TABELA_PASCAL}};
    FModel: TModel{{NOME_TABELA_PASCAL}};
    FModo: string;
    FPKID: {{PK_TIPO_PASCAL}};

    procedure CarregarDados;
    procedure GravarDados;
    procedure LimparCampos;
    procedure ConfigurarModo;
    procedure ConfigurarCores;
  public
    property Modo: string read FModo write FModo;
    property PKID: {{PK_TIPO_PASCAL}} read FPKID write FPKID;
  end;

implementation

{$R *.lfm}

{ TFrForm{{NOME_TABELA_PASCAL}} }

procedure TFrForm{{NOME_TABELA_PASCAL}}.FormCreate(Sender: TObject);
begin
  FController := CriarController{{NOME_TABELA_PASCAL}};
  FModel      := FController.NovoModel;  // já gera PK via Firebird Generator
  FModo       := 'Novo';
  ConfigurarCores;
end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.FormDestroy(Sender: TObject);
begin
  FreeAndNil(FModel);
end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.FormShow(Sender: TObject);
begin
  ConfigurarModo;
end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.ConfigurarCores;
begin
  Color          := CLR_CONTENT_BG;
  pnlTopo.Color  := CLR_SIDE_BG;
  pnlBotoes.Color := CLR_CARD_BG;
  ScrollBox1.Color := CLR_CARD_BG;

  lblFormTitulo.Font.Color := clWhite;
  lblFormTitulo.Font.Style := [fsBold];
  lblFormModo.Font.Color   := CLR_SIDE_ACTIVE;
  lblFormModo.Font.Style   := [fsBold];

  btnSalvar.Color     := CLR_STATUS_OK;
  btnSalvar.Font.Color := clWhite;
  btnSalvar.Font.Style := [fsBold];
end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.ConfigurarModo;
begin
  lblFormModo.Caption := FModo;
  case FModo of
    'Novo':
      begin
        Caption := 'Novo — {{NOME_TABELA_PASCAL}}';
        lblFormTitulo.Caption := 'Novo registro';
        LimparCampos;
      end;
    'Editar':
      begin
        Caption := 'Editar — {{NOME_TABELA_PASCAL}}';
        lblFormTitulo.Caption := 'Editando registro';
        CarregarDados;
      end;
    'Visualizar':
      begin
        Caption := 'Visualizar — {{NOME_TABELA_PASCAL}}';
        lblFormTitulo.Caption := 'Visualizando';
        CarregarDados;
        btnSalvar.Visible := False;
      end;
  end;
end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.CarregarDados;
var
  M: TModel{{NOME_TABELA_PASCAL}};
begin
  M := FController.BuscarPorId(FPKID);
  if not Assigned(M) then
  begin
    ShowMessage('Registro não encontrado.');
    ModalResult := mrCancel;
    Exit;
  end;
  FModel.Assign(M);
  M.Free;

  // Carrega valores nos campos visuais
{{LOOP_CAMPOS}}  edt{{CAMPO_PASCAL}}.Text := VarToStr(FModel.{{CAMPO_PASCAL}});
{{/LOOP_CAMPOS}}end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.GravarDados;
begin
  // Grava valores dos campos visuais no model
{{LOOP_CAMPOS}}  // {{CAMPO_CAPTION}}
  FModel.{{CAMPO_PASCAL}} := edt{{CAMPO_PASCAL}}.Text;
{{/LOOP_CAMPOS}}end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.LimparCampos;
begin
  FModel.Clear;
{{LOOP_CAMPOS}}  edt{{CAMPO_PASCAL}}.Clear;
{{/LOOP_CAMPOS}}end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.btnSalvarClick(Sender: TObject);
var
  Erro: string;
begin
  GravarDados;
  Erro := FController.Salvar(FModel);
  if Erro <> '' then
  begin
    ShowMessage('Não foi possível salvar:'#13#10 + Erro);
    Exit;
  end;
  ModalResult := mrOk;
end;

procedure TFrForm{{NOME_TABELA_PASCAL}}.btnCancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

end.
