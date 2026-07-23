unit uView{{NOME_TABELA_PASCAL}}Lista;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} | Tabela: {{NOME_TABELA}} }
{ CAMADA: VIEW — Listagem. Apenas chama o Controller, NUNCA o DAO. }

interface

uses
  Classes, SysUtils, Variants, Math, Forms, Controls, Graphics, Dialogs,
  StdCtrls, ExtCtrls, Grids, Buttons, ComCtrls, Contnrs,
  uController{{NOME_TABELA_PASCAL}},
  uModel{{NOME_TABELA_PASCAL}};

type
  { TfrmLista{{NOME_TABELA_PASCAL}} }
  TfrmLista{{NOME_TABELA_PASCAL}} = class(TForm)
    pnlTopo: TPanel;
    lblTitulo: TLabel;
    pnlBusca: TPanel;
    edtBusca: TEdit;
    lblBusca: TLabel;
    btnBuscar: TButton;
    btnLimparBusca: TButton;
    pnlBotoesAcao: TPanel;
    btnNovo: TBitBtn;
    btnEditar: TBitBtn;
    btnExcluir: TBitBtn;
    btnAtualizar: TButton;
    lblTotal: TLabel;
    grdLista: TStringGrid;
    StatusBar1: TStatusBar;

    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure btnNovoClick(Sender: TObject);
    procedure btnEditarClick(Sender: TObject);
    procedure btnExcluirClick(Sender: TObject);
    procedure btnAtualizarClick(Sender: TObject);
    procedure btnBuscarClick(Sender: TObject);
    procedure btnLimparBuscaClick(Sender: TObject);
    procedure edtBuscaKeyPress(Sender: TObject; var Key: Char);
    procedure grdListaDblClick(Sender: TObject);
  private
    FController: TController{{NOME_TABELA_PASCAL}};
    FLista: TObjectList;

    procedure CarregarGrade;
    procedure CarregarGradeComLista(ALista: TObjectList);
    procedure ConfigurarColunas;
    function LinhaSelecionada: Integer;
    function PKSelecionada: {{PK_TIPO_PASCAL}};
    procedure AtualizarStatusBar;
  end;

var
  frmLista{{NOME_TABELA_PASCAL}}: TfrmLista{{NOME_TABELA_PASCAL}};

implementation

{$R *.lfm}

uses
  uView{{NOME_TABELA_PASCAL}}Form;

{ TfrmLista{{NOME_TABELA_PASCAL}} }

procedure TfrmLista{{NOME_TABELA_PASCAL}}.FormCreate(Sender: TObject);
begin
  FController := TController{{NOME_TABELA_PASCAL}}.Create;
  FLista := nil;
  ConfigurarColunas;
  lblTitulo.Caption := 'Manutenção de {{NOME_TABELA_PASCAL}}';
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.FormDestroy(Sender: TObject);
begin
  FreeAndNil(FLista);
  FreeAndNil(FController);
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.FormShow(Sender: TObject);
begin
  CarregarGrade;
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.ConfigurarColunas;
begin
  grdLista.RowCount   := 2;
  grdLista.ColCount   := {{TOTAL_CAMPOS}};
  grdLista.FixedRows  := 1;
  grdLista.Options    := grdLista.Options + [goRowSelect, goColSizing];

  // Cabeçalhos
{{LOOP_CAMPOS}}  grdLista.Cells[{{CAMPO_INDEX}}, 0] := '{{CAMPO_CAPTION}}';
{{/LOOP_CAMPOS}}end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.CarregarGrade;
var
  Lista: TObjectList;
begin
  Lista := FController.Listar;
  FreeAndNil(FLista);
  FLista := Lista;
  CarregarGradeComLista(FLista);
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.CarregarGradeComLista(ALista: TObjectList);
var
  I: Integer;
  Model: TModel{{NOME_TABELA_PASCAL}};
begin
  if ALista.Count = 0 then
    grdLista.RowCount := 2
  else
    grdLista.RowCount := ALista.Count + 1;

  for I := 0 to ALista.Count - 1 do
  begin
    Model := TModel{{NOME_TABELA_PASCAL}}(ALista[I]);
{{LOOP_CAMPOS}}    grdLista.Cells[{{CAMPO_INDEX}}, I + 1] := VarToStr(Model.{{CAMPO_PASCAL}});
{{/LOOP_CAMPOS}}  end;

  AtualizarStatusBar;
end;

function TfrmLista{{NOME_TABELA_PASCAL}}.LinhaSelecionada: Integer;
begin
  Result := grdLista.Row;
end;

function TfrmLista{{NOME_TABELA_PASCAL}}.PKSelecionada: {{PK_TIPO_PASCAL}};
var
  Linha: Integer;
begin
  Result := Default({{PK_TIPO_PASCAL}});
  Linha := LinhaSelecionada;
  if (Linha < 1) or (Linha >= grdLista.RowCount) then Exit;
  if Assigned(FLista) and (Linha - 1 < FLista.Count) then
    Result := TModel{{NOME_TABELA_PASCAL}}(FLista[Linha - 1]).{{PK_CAMPO_PASCAL}};
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.AtualizarStatusBar;
begin
  if Assigned(FLista) then
    StatusBar1.SimpleText := Format('%d registro(s) encontrado(s)', [FLista.Count])
  else
    StatusBar1.SimpleText := '';
  if Assigned(FLista) then
    lblTotal.Caption := IntToStr(FLista.Count) + ' registros';
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.btnNovoClick(Sender: TObject);
var
  Frm: TfrmForm{{NOME_TABELA_PASCAL}};
begin
  Frm := TfrmForm{{NOME_TABELA_PASCAL}}.Create(Self);
  try
    Frm.Modo := mNovo;
    if Frm.ShowModal = mrOk then
      CarregarGrade;
  finally
    Frm.Free;
  end;
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.btnEditarClick(Sender: TObject);
var
  Frm: TfrmForm{{NOME_TABELA_PASCAL}};
  PK: {{PK_TIPO_PASCAL}};
begin
  PK := PKSelecionada;
  if VarIsNull(PK) or (VarToStr(PK) = '') then
  begin
    ShowMessage('Selecione um registro para editar.');
    Exit;
  end;
  Frm := TfrmForm{{NOME_TABELA_PASCAL}}.Create(Self);
  try
    Frm.Modo := mEdicao;
    Frm.PKID := PK;
    if Frm.ShowModal = mrOk then
      CarregarGrade;
  finally
    Frm.Free;
  end;
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.btnExcluirClick(Sender: TObject);
var
  PK: {{PK_TIPO_PASCAL}};
  Erro: string;
begin
  PK := PKSelecionada;
  if VarIsNull(PK) or (VarToStr(PK) = '') then
  begin
    ShowMessage('Selecione um registro para excluir.');
    Exit;
  end;

  if MessageDlg('Confirmar exclusão?', mtConfirmation, [mbYes, mbNo], 0) <> mrYes then
    Exit;

  Erro := FController.Excluir(PK);
  if Erro <> '' then
    ShowMessage('Erro: ' + Erro)
  else
    CarregarGrade;
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.btnAtualizarClick(Sender: TObject);
begin
  CarregarGrade;
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.btnBuscarClick(Sender: TObject);
var
  Lista: TObjectList;
begin
  Lista := FController.Buscar(edtBusca.Text);
  FreeAndNil(FLista);
  FLista := Lista;
  CarregarGradeComLista(FLista);
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.btnLimparBuscaClick(Sender: TObject);
begin
  edtBusca.Text := '';
  CarregarGrade;
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.edtBuscaKeyPress(Sender: TObject; var Key: Char);
begin
  if Key = #13 then btnBuscarClick(Sender);
end;

procedure TfrmLista{{NOME_TABELA_PASCAL}}.grdListaDblClick(Sender: TObject);
begin
  btnEditarClick(Sender);
end;

end.
