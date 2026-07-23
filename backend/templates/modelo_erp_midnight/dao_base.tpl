unit uDAOBase;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} }
{ CAMADA: DAO BASE — Classe-pai com conexão e utilitários SQL }

interface

uses
  Classes, SysUtils, IBDatabase, IBQuery, IBSQL;

type
  { TDAOBase — classe pai de todos os DAOs do sistema }
  TDAOBase = class(TInterfacedObject)
  private
    FDatabase: TIBDatabase;
    FTransaction: TIBTransaction;
  protected
    { Cria e retorna uma query configurada com o banco e transação }
    function CriarQuery: TIBQuery;

    { Cria e retorna um IBSQL configurado (para INSERT/UPDATE/DELETE) }
    function CriarSQL: TIBSQL;

    { Executa SQL sem retorno de dados (INSERT/UPDATE/DELETE) }
    procedure ExecutarSQL(const ASQL: string);

    { Retorna TRUE se a query tiver pelo menos 1 linha }
    function QueryTemRegistros(AQuery: TIBQuery): Boolean;

    property Database: TIBDatabase read FDatabase;
    property Transaction: TIBTransaction read FTransaction;
  public
    constructor Create(ADatabase: TIBDatabase; ATransaction: TIBTransaction);
  end;

implementation

constructor TDAOBase.Create(ADatabase: TIBDatabase; ATransaction: TIBTransaction);
begin
  inherited Create;
  FDatabase    := ADatabase;
  FTransaction := ATransaction;
end;

function TDAOBase.CriarQuery: TIBQuery;
begin
  Result := TIBQuery.Create(nil);
  Result.Database    := FDatabase;
  Result.Transaction := FTransaction;
end;

function TDAOBase.CriarSQL: TIBSQL;
begin
  Result := TIBSQL.Create(nil);
  Result.Database    := FDatabase;
  Result.Transaction := FTransaction;
end;

procedure TDAOBase.ExecutarSQL(const ASQL: string);
var
  SQL: TIBSQL;
begin
  SQL := CriarSQL;
  try
    SQL.SQL.Text := ASQL;
    SQL.ExecQuery;
    FTransaction.CommitRetaining;
  finally
    SQL.Free;
  end;
end;

function TDAOBase.QueryTemRegistros(AQuery: TIBQuery): Boolean;
begin
  Result := not AQuery.IsEmpty;
end;

end.
