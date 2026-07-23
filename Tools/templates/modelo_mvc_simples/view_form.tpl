unit uView{{NOME_TABELA_PASCAL}}Form;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} | Tabela: {{NOME_TABELA}} }
{ CAMADA: VIEW — Formulário CRUD. Apenas chama o Controller. }

interface

uses
  Classes, SysUtils, Variants, Forms, Controls, Graphics, Dialogs,
  StdCtrls, ExtCtrls, Buttons, DateTimePicker,
  uController{{NOME_TABELA_PASCAL}},
  uModel{{NOME_TABELA_PASCAL}};

type
  TModoFormulario = (mNovo, mEdicao, mVisualizacao);

  { TfrmForm{{NOME_TABELA_PASCAL}} }
  TfrmForm{{NOME_TABELA_PASCAL}} = class(TForm)
    pnlTopo: TPanel;
    lblFormTitulo: TLabel;
    pnlBotoes: TPanel;
    btnSalvar: TBitBtn;
    btnCancelar: TBitBtn;
    ScrollBox1: TScrollBox;

    // Campos visuais gerados
{{LOOP_CAMPOS}}    lbl{{CAMPO_PASCAL}}: TLabel;
    {{CAMPO_COMPONENTE_VAR}};
{{/LOOP_CAMPOS}}

    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure btnSalvarClick(Sender: TObject);
    procedure btnCancelarClick(Sender: TObject);

  private
    FController: TController{{NOME_TABELA_PASCAL}};
    FModel: TModel{{NOME_TABELA_PASCAL}};
    FModo: TModoFormulario;
    FPKID: {{PK_TIPO_PASCAL}};

    procedure CarregarDados;
    procedure GravarDados;
    procedure LimparCampos;
    procedure ConfigurarModo;
    procedure HabilitarCampos(AHabilitar: Boolean);
  public
    property Modo: TModoFormulario read FModo write FModo;
    property PKID: {{PK_TIPO_PASCAL}} read FPKID write FPKID;
  end;

implementation

{$R *.lfm}

{ TfrmForm{{NOME_TABELA_PASCAL}} }

procedure TfrmForm{{NOME_TABELA_PASCAL}}.FormCreate(Sender: TObject);
begin
  FController := TController{{NOME_TABELA_PASCAL}}.Create;
  FModel      := TModel{{NOME_TABELA_PASCAL}}.Create;
  FModo       := mNovo;
end;

procedure TfrmForm{{NOME_TABELA_PASCAL}}.FormDestroy(Sender: TObject);
begin
  FreeAndNil(FModel);
  FreeAndNil(FController);
end;

procedure TfrmForm{{NOME_TABELA_PASCAL}}.FormShow(Sender: TObject);
begin
  ConfigurarModo;
end;

procedure TfrmForm{{NOME_TABELA_PASCAL}}.ConfigurarModo;
begin
  case FModo of
    mNovo:
      begin
        Caption := 'Novo registro — {{NOME_TABELA_PASCAL}}';
        lblFormTitulo.Caption := 'Novo registro';
        LimparCampos;
        HabilitarCampos(True);
      end;
    mEdicao:
      begin
        Caption := 'Editar — {{NOME_TABELA_PASCAL}}';
        lblFormTitulo.Caption := 'Editando registro';
        CarregarDados;
        HabilitarCampos(True);
      end;
    mVisualizacao:
      begin
        Caption := 'Visualizar — {{NOME_TABELA_PASCAL}}';
        lblFormTitulo.Caption := 'Visualizando registro';
        CarregarDados;
        HabilitarCampos(False);
        btnSalvar.Visible := False;
      end;
  end;
end;

procedure TfrmForm{{NOME_TABELA_PASCAL}}.CarregarDados;
var
  Model: TModel{{NOME_TABELA_PASCAL}};
begin
  Model := FController.BuscarPorId(FPKID);
  if not Assigned(Model) then
  begin
    ShowMessage('Registro não encontrado.');
    ModalResult := mrCancel;
    Exit;
  end;
  FModel.Assign(Model);
  Model.Free;

  // Carrega campos visuais a partir do model
{{LOOP_CAMPOS}}  // {{CAMPO_CAPTION}}
  {{COMPONENTE_LOAD}}
{{/LOOP_CAMPOS}}end;

procedure TfrmForm{{NOME_TABELA_PASCAL}}.GravarDados;
begin
  // Grava campos visuais no model
{{LOOP_CAMPOS}}  // {{CAMPO_CAPTION}}
  {{COMPONENTE_SAVE}}
{{/LOOP_CAMPOS}}end;

procedure TfrmForm{{NOME_TABELA_PASCAL}}.LimparCampos;
begin
  FModel.Clear;
{{LOOP_CAMPOS}}  {{COMPONENTE_CLEAR}}
{{/LOOP_CAMPOS}}end;

procedure TfrmForm{{NOME_TABELA_PASCAL}}.HabilitarCampos(AHabilitar: Boolean);
begin
{{LOOP_CAMPOS}}  {{CAMPO_COMPONENTE_VAR_NAME}}.Enabled := AHabilitar;
{{/LOOP_CAMPOS}}end;

procedure TfrmForm{{NOME_TABELA_PASCAL}}.btnSalvarClick(Sender: TObject);
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

procedure TfrmForm{{NOME_TABELA_PASCAL}}.btnCancelarClick(Sender: TObject);
begin
  ModalResult := mrCancel;
end;

end.
