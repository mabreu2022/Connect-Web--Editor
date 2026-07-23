unit uController{{NOME_TABELA_PASCAL}};

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} | Tabela: {{NOME_TABELA}} }
{ CAMADA: CONTROLLER — Regras de negócio. Orquestra DAO via interface. }
{ Implementa: IController{{NOME_TABELA_PASCAL}} }
{ A View acessa SOMENTE IController{{NOME_TABELA_PASCAL}} — nunca o DAO diretamente. }

interface

uses
  Classes, SysUtils, Contnrs,
  uModel{{NOME_TABELA_PASCAL}},
  uDAO{{NOME_TABELA_PASCAL}},
  uInterfaces{{NOME_TABELA_PASCAL}},
  uDMConexao;

type
  { TController{{NOME_TABELA_PASCAL}} — implementa IController{{NOME_TABELA_PASCAL}} }
  TController{{NOME_TABELA_PASCAL}} = class(TInterfacedObject, IController{{NOME_TABELA_PASCAL}})
  private
    FDAO: IDAO{{NOME_TABELA_PASCAL}};  // <- depende da interface, não da classe concreta

    { Regras de validação — retorna '' se válido, ou mensagem de erro }
    function Validar(AModel: TModel{{NOME_TABELA_PASCAL}}): string;
  public
    constructor Create;

    { === IController{{NOME_TABELA_PASCAL}} === }

    { Retorna lista de todos os registros }
    function Listar: TObjectList;

    { Retorna registros filtrados por termo de busca livre }
    function Buscar(const ATermo: string): TObjectList;

    { Salva (insert ou update conforme existência da PK) }
    { Retorna '' se OK, ou mensagem de erro }
    function Salvar(AModel: TModel{{NOME_TABELA_PASCAL}}): string;

    { Exclui pela PK — retorna '' se OK, ou mensagem de erro }
    function Excluir(const AId: {{PK_TIPO_PASCAL}}): string;

    { Busca por ID — retorna nil se não encontrar }
    function BuscarPorId(const AId: {{PK_TIPO_PASCAL}}): TModel{{NOME_TABELA_PASCAL}};

    { Retorna total de registros }
    function Total: Integer;

    { Cria um Model novo com ID pré-gerado via Firebird Generator }
    function NovoModel: TModel{{NOME_TABELA_PASCAL}};
  end;

{ Função de fábrica — retorna a interface sem expor a classe concreta }
function CriarController{{NOME_TABELA_PASCAL}}: IController{{NOME_TABELA_PASCAL}};

implementation

{ Fábrica — a View usa esta função, nunca instancia TController diretamente }
function CriarController{{NOME_TABELA_PASCAL}}: IController{{NOME_TABELA_PASCAL}};
begin
  Result := TController{{NOME_TABELA_PASCAL}}.Create;
end;

{ TController{{NOME_TABELA_PASCAL}} }

constructor TController{{NOME_TABELA_PASCAL}}.Create;
begin
  inherited Create;
  // Injeta o DAO via interface — fácil de trocar por mock em testes
  FDAO := TDAO{{NOME_TABELA_PASCAL}}.Create(
    DMConexao.IBDatabase1,
    DMConexao.IBTransaction1
  );
end;

function TController{{NOME_TABELA_PASCAL}}.Validar(AModel: TModel{{NOME_TABELA_PASCAL}}): string;
begin
  Result := '';

  // -------------------------------------------------------
  // TODO: Adicione suas regras de validação aqui
  // Exemplo:
  // if Trim(AModel.Nome) = '' then
  //   Result := 'O campo Nome é obrigatório.';
  // -------------------------------------------------------
end;

function TController{{NOME_TABELA_PASCAL}}.Listar: TObjectList;
begin
  Result := FDAO.ListarTodos;
end;

function TController{{NOME_TABELA_PASCAL}}.Buscar(const ATermo: string): TObjectList;
var
  Filtro: string;
begin
  if Trim(ATermo) = '' then
  begin
    Result := FDAO.ListarTodos;
    Exit;
  end;
  // Busca na PK e em campos textuais
  // Adapte o filtro para incluir as colunas relevantes da sua tabela
  Filtro := 'UPPER(CAST({{PK_CAMPO}} AS VARCHAR(50))) CONTAINING UPPER(''' +
    StringReplace(ATermo, '''', '''''', [rfReplaceAll]) + ''')';
  Result := FDAO.ListarComFiltro(Filtro);
end;

function TController{{NOME_TABELA_PASCAL}}.NovoModel: TModel{{NOME_TABELA_PASCAL}};
begin
  Result := TModel{{NOME_TABELA_PASCAL}}.Create;
  // Pré-gera o ID via Firebird Generator — a PK já chega pronta na View
  Result.{{PK_CAMPO_PASCAL}} := FDAO.GerarNextID;
end;

function TController{{NOME_TABELA_PASCAL}}.Salvar(AModel: TModel{{NOME_TABELA_PASCAL}}): string;
var
  Erro: string;
begin
  // 1. Valida dados
  Erro := Validar(AModel);
  if Erro <> '' then
  begin
    Result := Erro;
    Exit;
  end;

  // 2. Insert ou Update dependendo da existência da PK no banco
  try
    if FDAO.Existe(AModel.{{PK_CAMPO_PASCAL}}) then
      FDAO.Atualizar(AModel)
    else
      FDAO.Inserir(AModel);
    Result := '';
  except
    on E: Exception do
      Result := 'Erro ao salvar: ' + E.Message;
  end;
end;

function TController{{NOME_TABELA_PASCAL}}.Excluir(const AId: {{PK_TIPO_PASCAL}}): string;
begin
  try
    if not FDAO.Existe(AId) then
    begin
      Result := 'Registro não encontrado.';
      Exit;
    end;

    // TODO: Verificar dependências (FKs) antes de excluir

    FDAO.Excluir(AId);
    Result := '';
  except
    on E: Exception do
      Result := 'Erro ao excluir: ' + E.Message;
  end;
end;

function TController{{NOME_TABELA_PASCAL}}.BuscarPorId(const AId: {{PK_TIPO_PASCAL}}): TModel{{NOME_TABELA_PASCAL}};
begin
  Result := FDAO.BuscarPorId(AId);
end;

function TController{{NOME_TABELA_PASCAL}}.Total: Integer;
begin
  Result := FDAO.Contar;
end;

end.
