unit uFrLista{{NOME_TABELA_PASCAL}};

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} | Tabela: {{NOME_TABELA}} }
{ CAMADA: VIEW — TFrame de listagem ERP (embutido na área de conteúdo) }

interface

uses
  Classes, SysUtils, Variants, Math, Forms, Controls, Graphics, Dialogs,
  ExtCtrls, StdCtrls, Grids, Buttons, Contnrs,
  uTheme,
  uModel{{NOME_TABELA_PASCAL}},
  uInterfaces{{NOME_TABELA_PASCAL}},
  uController{{NOME_TABELA_PASCAL}};

type
  { TFrLista{{NOME_TABELA_PASCAL}} — Frame de listagem para {{NOME_TABELA}} }
  TFrLista{{NOME_TABELA_PASCAL}} = class(TFrame)
    pnlHeader: TPanel;
      pnlBusca: TPanel;
        edtBusca: TEdit;
        btnBuscar: TButton;
        btnLimpar: TButton;
      pnlAcoes: TPanel;
        btnNovo: TButton;
        btnEditar: TButton;
        btnExcluir: TButton;
        btnAtualizar: TButton;
        lblTotal: TLabel;
    grdLista: TStringGrid;
    pnlRodape: TPanel;
      lblRodapeTxt: TLabel;

    
    procedure btnNovoClick(Sender: TObject);
    procedure btnEditarClick(Sender: TObject);
    procedure btnExcluirClick(Sender: TObject);
    procedure btnAtualizarClick(Sender: TObject);
    procedure btnBuscarClick(Sender: TObject);
    procedure btnLimparClick(Sender: TObject);
    procedure edtBuscaKeyPress(Sender: TObject; var Key: Char);
    procedure grdListaDblClick(Sender: TObject);
    procedure grdListaPrepareCanvas(sender: TObject; aCol, aRow: Integer; aState: TGridDrawState);
  private
    FController: IController{{NOME_TABELA_PASCAL}};
    FLista: TObjectList;

    procedure ConfigurarCores;
    procedure ConfigurarGrade;
    procedure CarregarGrade;
    procedure CarregarGradeComLista(ALista: TObjectList);
    function PKSelecionada: {{PK_TIPO_PASCAL}};
    procedure AbrirFormEdicao(AModo: string; const AId: {{PK_TIPO_PASCAL}});
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;
  end;

implementation

{$R *.lfm}

uses
  uFrForm{{NOME_TABELA_PASCAL}};

{ TFrLista{{NOME_TABELA_PASCAL}} }

constructor TFrLista{{NOME_TABELA_PASCAL}}.Create(AOwner: TComponent);
begin
  inherited Create(AOwner);
  FController := CriarController{{NOME_TABELA_PASCAL}};
  FLista := nil;
  ConfigurarCores;
  ConfigurarGrade;
  CarregarGrade;
end;

destructor TFrLista{{NOME_TABELA_PASCAL}}.Destroy;
begin
  FreeAndNil(FLista);
  inherited Destroy;
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.ConfigurarCores;
begin
  Color              := CLR_CONTENT_BG;
  pnlHeader.Color    := CLR_CARD_BG;
  pnlBusca.Color     := CLR_CARD_BG;
  pnlAcoes.Color     := CLR_CARD_BG;
  pnlRodape.Color    := CLR_CARD_BG;

  grdLista.FixedColor   := CLR_SIDE_BG;
  grdLista.Color        := CLR_CARD_BG;
  grdLista.Font.Name    := FONT_DEFAULT;
  grdLista.Font.Size    := FONT_SIZE_SM;

  // Botões com estilo
  btnNovo.Color   := CLR_SIDE_ACTIVE; btnNovo.Font.Color   := clWhite; btnNovo.Font.Style := [fsBold];
  btnEditar.Color := CLR_STATUS_WARN; btnEditar.Font.Color := clWhite;
  btnExcluir.Color:= CLR_STATUS_ERR;  btnExcluir.Font.Color:= clWhite;
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.ConfigurarGrade;
begin
  grdLista.RowCount   := 2;
  grdLista.ColCount   := {{TOTAL_CAMPOS}};
  grdLista.FixedRows  := 1;
  
  grdLista.Options    := grdLista.Options + [goRowSelect, goColSizing];
  grdLista.OnPrepareCanvas := @grdListaPrepareCanvas;

  // Cabeçalhos das colunas
{{LOOP_CAMPOS}}  grdLista.Cells[{{CAMPO_INDEX}}, 0] := '{{CAMPO_CAPTION}}';
{{/LOOP_CAMPOS}}end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.grdListaPrepareCanvas(sender: TObject; aCol, aRow: Integer; aState: TGridDrawState);
begin
  if (aRow > 0) and not (gdSelected in aState) then
  begin
    if Odd(aRow) then
      grdLista.Canvas.Brush.Color := CLR_CARD_BG
    else
      grdLista.Canvas.Brush.Color := CLR_GRID_ALT_ROW;
  end;
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.CarregarGrade;
var
  Lista: TObjectList;
begin
  Lista := FController.Listar;
  FreeAndNil(FLista);
  FLista := Lista;
  CarregarGradeComLista(FLista);
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.CarregarGradeComLista(ALista: TObjectList);
var
  I: Integer;
  Model: TModel{{NOME_TABELA_PASCAL}};
begin
  grdLista.RowCount := Max(2, ALista.Count + 1);
  for I := 0 to ALista.Count - 1 do
  begin
    Model := TModel{{NOME_TABELA_PASCAL}}(ALista[I]);
{{LOOP_CAMPOS}}    grdLista.Cells[{{CAMPO_INDEX}}, I + 1] := VarToStr(Model.{{CAMPO_PASCAL}});
{{/LOOP_CAMPOS}}  end;
  lblTotal.Caption := IntToStr(ALista.Count) + ' registro(s)';
  lblRodapeTxt.Caption := '{{NOME_TABELA_PASCAL}} — ' + IntToStr(ALista.Count) + ' registros carregados';
end;

function TFrLista{{NOME_TABELA_PASCAL}}.PKSelecionada: {{PK_TIPO_PASCAL}};
var
  Linha: Integer;
begin
  Result := Default({{PK_TIPO_PASCAL}});
  Linha := grdLista.Row;
  if (Linha < 1) or (Linha >= grdLista.RowCount) then Exit;
  if Assigned(FLista) and (Linha - 1 < FLista.Count) then
    Result := TModel{{NOME_TABELA_PASCAL}}(FLista[Linha - 1]).{{PK_CAMPO_PASCAL}};
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.AbrirFormEdicao(AModo: string; const AId: {{PK_TIPO_PASCAL}});
var
  Fr: TFrForm{{NOME_TABELA_PASCAL}};
begin
  Fr := TFrForm{{NOME_TABELA_PASCAL}}.Create(nil);
  try
    Fr.Modo := AModo;
    if AModo <> 'Novo' then Fr.PKID := AId;
    if Fr.ShowModal = mrOk then
      CarregarGrade;
  finally
    Fr.Free;
  end;
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.btnNovoClick(Sender: TObject);
begin AbrirFormEdicao('Novo', Default({{PK_TIPO_PASCAL}})); end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.btnEditarClick(Sender: TObject);
var PK: {{PK_TIPO_PASCAL}};
begin
  PK := PKSelecionada;
  if VarToStr(PK) = '' then begin ShowMessage('Selecione um registro.'); Exit; end;
  AbrirFormEdicao('Editar', PK);
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.btnExcluirClick(Sender: TObject);
var PK: {{PK_TIPO_PASCAL}}; Erro: string;
begin
  PK := PKSelecionada;
  if VarToStr(PK) = '' then begin ShowMessage('Selecione um registro.'); Exit; end;
  if MessageDlg('Excluir este registro?', mtConfirmation, [mbYes, mbNo], 0) <> mrYes then Exit;
  Erro := FController.Excluir(PK);
  if Erro <> '' then ShowMessage(Erro)
  else CarregarGrade;
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.btnAtualizarClick(Sender: TObject);
begin CarregarGrade; end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.btnBuscarClick(Sender: TObject);
var Lista: TObjectList;
begin
  Lista := FController.Buscar(edtBusca.Text);
  FreeAndNil(FLista);
  FLista := Lista;
  CarregarGradeComLista(FLista);
end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.btnLimparClick(Sender: TObject);
begin edtBusca.Clear; CarregarGrade; end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.edtBuscaKeyPress(Sender: TObject; var Key: Char);
begin if Key = #13 then btnBuscarClick(Sender); end;

procedure TFrLista{{NOME_TABELA_PASCAL}}.grdListaDblClick(Sender: TObject);
begin btnEditarClick(Sender); end;

end.
