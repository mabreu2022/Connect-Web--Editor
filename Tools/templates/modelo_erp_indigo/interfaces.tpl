unit uInterfaces{{NOME_TABELA_PASCAL}};

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} | Tabela: {{NOME_TABELA}} }
{ CAMADA: INTERFACE — Contratos entre as camadas. }
{ As Views dependem APENAS das interfaces, nunca das implementações concretas. }

interface

uses
  Classes, SysUtils, Contnrs,
  uModel{{NOME_TABELA_PASCAL}};

// ============================================================
// IDAO{{NOME_TABELA_PASCAL}}
// Contrato de acesso a dados para a tabela {{NOME_TABELA}}
// ============================================================
type
  IDAO{{NOME_TABELA_PASCAL}} = interface
    { Gera próximo ID via Generator do Firebird }
    function GerarNextID: {{PK_TIPO_PASCAL}};

    { Retorna todos os registros }
    function ListarTodos: TObjectList;

    { Retorna registros com filtro WHERE }
    function ListarComFiltro(const AFiltroWhere: string): TObjectList;

    { Busca por PK — retorna nil se não encontrar }
    function BuscarPorId(const AId: {{PK_TIPO_PASCAL}}): TModel{{NOME_TABELA_PASCAL}};

    { Verifica existência pela PK }
    function Existe(const AId: {{PK_TIPO_PASCAL}}): Boolean;

    { Insere (o ID deve ser preenchido antes via GerarNextID) }
    function Inserir(AModel: TModel{{NOME_TABELA_PASCAL}}): Boolean;

    { Atualiza registro existente }
    function Atualizar(AModel: TModel{{NOME_TABELA_PASCAL}}): Boolean;

    { Exclui pela PK }
    function Excluir(const AId: {{PK_TIPO_PASCAL}}): Boolean;

    { Contagens }
    function Contar: Integer;
    function ContarComFiltro(const AFiltroWhere: string): Integer;
  end;

// ============================================================
// IController{{NOME_TABELA_PASCAL}}
// Contrato de regras de negócio para a tabela {{NOME_TABELA}}
// As Views SOMENTE conhecem esta interface — nunca o DAO.
// ============================================================
type
  IController{{NOME_TABELA_PASCAL}} = interface
    { Retorna lista completa de registros }
    function Listar: TObjectList;

    { Retorna registros filtrados por termo de busca }
    function Buscar(const ATermo: string): TObjectList;

    { Salva (insert ou update automático) — retorna '' se OK, ou mensagem de erro }
    function Salvar(AModel: TModel{{NOME_TABELA_PASCAL}}): string;

    { Exclui pela PK — retorna '' se OK, ou mensagem de erro }
    function Excluir(const AId: {{PK_TIPO_PASCAL}}): string;

    { Busca um registro pela PK }
    function BuscarPorId(const AId: {{PK_TIPO_PASCAL}}): TModel{{NOME_TABELA_PASCAL}};

    { Retorna total de registros }
    function Total: Integer;

    { Prepara um Model novo com ID pré-gerado via Firebird Generator }
    function NovoModel: TModel{{NOME_TABELA_PASCAL}};
  end;

implementation

end.
