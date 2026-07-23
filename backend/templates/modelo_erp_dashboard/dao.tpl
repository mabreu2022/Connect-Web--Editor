unit uDAO{{NOME_TABELA_PASCAL}};

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} | Tabela: {{NOME_TABELA}} }
{ CAMADA: DAO — Acesso a dados. APENAS SQL aqui, sem lógica de negócio. }
{ Implementa: IDAO{{NOME_TABELA_PASCAL}} }

interface

uses
  Classes, SysUtils, Contnrs, IBQuery,
  uDAOBase,
  uModel{{NOME_TABELA_PASCAL}},
  uInterfaces{{NOME_TABELA_PASCAL}};

type
  { TDAO{{NOME_TABELA_PASCAL}} — implementa IDAO{{NOME_TABELA_PASCAL}} }
  TDAO{{NOME_TABELA_PASCAL}} = class(TDAOBase, IDAO{{NOME_TABELA_PASCAL}})
  private
    { Nome do Generator/Sequence no Firebird para geração de PK }
    const GENERATOR_NAME = '{{GENERATOR_NAME}}';

    { SQLs da tabela }
    const SQL_SELECT     = '{{SQL_SELECT}}';
    const SQL_SELECT_PK  = '{{SQL_SELECT_BY_PK}}';
    const SQL_INSERT     = '{{SQL_INSERT_FULL}}';  // inclui PK (gerada via Generator)
    const SQL_UPDATE     = '{{SQL_UPDATE}}';
    const SQL_DELETE     = '{{SQL_DELETE}}';

    { Preenche o model a partir de uma query aberta }
    procedure QueryParaModel(AQuery: TIBQuery; AModel: TModel{{NOME_TABELA_PASCAL}});

    { Preenche os parâmetros da query a partir do model (inclui PK para INSERT) }
    procedure ModelParaQuery(AQuery: TIBQuery; AModel: TModel{{NOME_TABELA_PASCAL}}; AIncluirPK: Boolean = False);
  public
    { === IDAO{{NOME_TABELA_PASCAL}} === }

    { Gera próximo ID consultando o Generator do Firebird }
    function GerarNextID: {{PK_TIPO_PASCAL}};

    { Retorna todos os registros }
    function ListarTodos: TObjectList;

    { Retorna registros com filtro WHERE livre }
    function ListarComFiltro(const AFiltroWhere: string): TObjectList;

    { Busca um registro pela PK. Retorna nil se não encontrar. }
    function BuscarPorId(const AId: {{PK_TIPO_PASCAL}}): TModel{{NOME_TABELA_PASCAL}};

    { Verifica se existe registro com a PK informada }
    function Existe(const AId: {{PK_TIPO_PASCAL}}): Boolean;

    { Insere novo registro (o AModel.{{PK_CAMPO_PASCAL}} DEVE estar preenchido via GerarNextID) }
    function Inserir(AModel: TModel{{NOME_TABELA_PASCAL}}): Boolean;

    { Atualiza um registro existente }
    function Atualizar(AModel: TModel{{NOME_TABELA_PASCAL}}): Boolean;

    { Exclui um registro pela PK }
    function Excluir(const AId: {{PK_TIPO_PASCAL}}): Boolean;

    { Conta total de registros }
    function Contar: Integer;

    { Conta registros com filtro }
    function ContarComFiltro(const AFiltroWhere: string): Integer;
  end;

implementation

{ TDAO{{NOME_TABELA_PASCAL}} }

// ------------------------------------------------------------------
// GerarNextID — consulta o Generator do Firebird
// GEN_ID(generator, incremento): retorna próximo valor da sequência
// Equivalente em FB 3+: NEXT VALUE FOR SEQ_...
// ------------------------------------------------------------------
function TDAO{{NOME_TABELA_PASCAL}}.GerarNextID: {{PK_TIPO_PASCAL}};
var
  Q: TIBQuery;
begin
  Q := CriarQuery;
  try
    Q.SQL.Text := 'SELECT GEN_ID(' + GENERATOR_NAME + ', 1) AS NOVO_ID FROM RDB$DATABASE';
    Q.Open;
    Result := Q.FieldByName('NOVO_ID').AsInteger;
  finally
    Q.Free;
  end;
end;

procedure TDAO{{NOME_TABELA_PASCAL}}.QueryParaModel(AQuery: TIBQuery;
  AModel: TModel{{NOME_TABELA_PASCAL}});
begin
{{CAMPOS_SET_FROM_QUERY}}end;

procedure TDAO{{NOME_TABELA_PASCAL}}.ModelParaQuery(AQuery: TIBQuery;
  AModel: TModel{{NOME_TABELA_PASCAL}}; AIncluirPK: Boolean = False);
begin
  // Campos não-PK
{{CAMPOS_SET_TO_QUERY}}
  // PK — incluída no INSERT (gerada via Generator), não no UPDATE
  if AIncluirPK then
    AQuery.ParamByName('{{PK_CAMPO}}').Value := AModel.{{PK_CAMPO_PASCAL}};
end;

function TDAO{{NOME_TABELA_PASCAL}}.ListarTodos: TObjectList;
var
  Q: TIBQuery;
  Model: TModel{{NOME_TABELA_PASCAL}};
begin
  Result := TObjectList.Create(True);
  Q := CriarQuery;
  try
    Q.SQL.Text := SQL_SELECT + ' ORDER BY {{PK_CAMPO}}';
    Q.Open;
    while not Q.EOF do
    begin
      Model := TModel{{NOME_TABELA_PASCAL}}.Create;
      QueryParaModel(Q, Model);
      Result.Add(Model);
      Q.Next;
    end;
  finally
    Q.Free;
  end;
end;

function TDAO{{NOME_TABELA_PASCAL}}.ListarComFiltro(const AFiltroWhere: string): TObjectList;
var
  Q: TIBQuery;
  Model: TModel{{NOME_TABELA_PASCAL}};
  SQL: string;
begin
  Result := TObjectList.Create(True);
  Q := CriarQuery;
  try
    SQL := SQL_SELECT;
    if Trim(AFiltroWhere) <> '' then
      SQL := SQL + ' WHERE ' + AFiltroWhere;
    SQL := SQL + ' ORDER BY {{PK_CAMPO}}';
    Q.SQL.Text := SQL;
    Q.Open;
    while not Q.EOF do
    begin
      Model := TModel{{NOME_TABELA_PASCAL}}.Create;
      QueryParaModel(Q, Model);
      Result.Add(Model);
      Q.Next;
    end;
  finally
    Q.Free;
  end;
end;

function TDAO{{NOME_TABELA_PASCAL}}.BuscarPorId(const AId: {{PK_TIPO_PASCAL}}): TModel{{NOME_TABELA_PASCAL}};
var
  Q: TIBQuery;
begin
  Result := nil;
  Q := CriarQuery;
  try
    Q.SQL.Text := SQL_SELECT_PK;
    Q.ParamByName('{{PK_CAMPO}}').Value := AId;
    Q.Open;
    if not Q.EOF then
    begin
      Result := TModel{{NOME_TABELA_PASCAL}}.Create;
      QueryParaModel(Q, Result);
    end;
  finally
    Q.Free;
  end;
end;

function TDAO{{NOME_TABELA_PASCAL}}.Existe(const AId: {{PK_TIPO_PASCAL}}): Boolean;
var
  Q: TIBQuery;
begin
  Q := CriarQuery;
  try
    Q.SQL.Text := 'SELECT COUNT(*) AS QTD FROM {{NOME_TABELA}} WHERE {{PK_CAMPO}} = :{{PK_CAMPO}}';
    Q.ParamByName('{{PK_CAMPO}}').Value := AId;
    Q.Open;
    Result := Q.FieldByName('QTD').AsInteger > 0;
  finally
    Q.Free;
  end;
end;

function TDAO{{NOME_TABELA_PASCAL}}.Inserir(AModel: TModel{{NOME_TABELA_PASCAL}}): Boolean;
var
  Q: TIBQuery;
begin
  Result := False;
  Q := CriarQuery;
  try
    Q.SQL.Text := SQL_INSERT;
    ModelParaQuery(Q, AModel, True); // True = inclui PK nos parâmetros
    Q.ExecSQL;
    Transaction.CommitRetaining;
    Result := True;
  finally
    Q.Free;
  end;
end;

function TDAO{{NOME_TABELA_PASCAL}}.Atualizar(AModel: TModel{{NOME_TABELA_PASCAL}}): Boolean;
var
  Q: TIBQuery;
begin
  Result := False;
  Q := CriarQuery;
  try
    Q.SQL.Text := SQL_UPDATE;
    ModelParaQuery(Q, AModel, False); // False = não inclui PK nos campos SET
    Q.ParamByName('{{PK_CAMPO}}').Value := AModel.{{PK_CAMPO_PASCAL}}; // PK no WHERE
    Q.ExecSQL;
    Transaction.CommitRetaining;
    Result := True;
  finally
    Q.Free;
  end;
end;

function TDAO{{NOME_TABELA_PASCAL}}.Excluir(const AId: {{PK_TIPO_PASCAL}}): Boolean;
var
  Q: TIBQuery;
begin
  Result := False;
  Q := CriarQuery;
  try
    Q.SQL.Text := SQL_DELETE;
    Q.ParamByName('{{PK_CAMPO}}').Value := AId;
    Q.ExecSQL;
    Transaction.CommitRetaining;
    Result := True;
  finally
    Q.Free;
  end;
end;

function TDAO{{NOME_TABELA_PASCAL}}.Contar: Integer;
var
  Q: TIBQuery;
begin
  Q := CriarQuery;
  try
    Q.SQL.Text := 'SELECT COUNT(*) AS QTD FROM {{NOME_TABELA}}';
    Q.Open;
    Result := Q.FieldByName('QTD').AsInteger;
  finally
    Q.Free;
  end;
end;

function TDAO{{NOME_TABELA_PASCAL}}.ContarComFiltro(const AFiltroWhere: string): Integer;
var
  Q: TIBQuery;
begin
  Q := CriarQuery;
  try
    Q.SQL.Text := 'SELECT COUNT(*) AS QTD FROM {{NOME_TABELA}}';
    if Trim(AFiltroWhere) <> '' then
      Q.SQL.Text := Q.SQL.Text + ' WHERE ' + AFiltroWhere;
    Q.Open;
    Result := Q.FieldByName('QTD').AsInteger;
  finally
    Q.Free;
  end;
end;

end.
