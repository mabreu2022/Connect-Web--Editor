unit uModel{{NOME_TABELA_PASCAL}};

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} | Tabela: {{NOME_TABELA}} }
{ CAMADA: MODEL — Representa uma linha da tabela como objeto POPO }
{ NÃO adicione acesso a banco de dados nesta unit! }

interface

uses
  Classes, SysUtils, Variants, Contnrs;

type
  { TModel{{NOME_TABELA_PASCAL}} }
  TModel{{NOME_TABELA_PASCAL}} = class
  private
{{CAMPOS_PROPERTIES}}
  public
    { Limpa todos os campos para valores padrão }
    procedure Clear;

    { Copia dados de outra instância }
    procedure Assign(AOrigem: TModel{{NOME_TABELA_PASCAL}});

    { Retorna string descritiva do objeto (para debug) }
    function ToString: string; override;

{{LOOP_CAMPOS}}    property {{CAMPO_PASCAL}}: {{CAMPO_TIPO_PASCAL}}
      read F{{CAMPO_PASCAL}} write F{{CAMPO_PASCAL}};
{{/LOOP_CAMPOS}}
  end;

  { Lista de TModel{{NOME_TABELA_PASCAL}} com destruição automática }
  TLista{{NOME_TABELA_PASCAL}} = class(TObjectList)
  public
    constructor Create;
    function Adicionar(AModel: TModel{{NOME_TABELA_PASCAL}}): Integer; reintroduce;
    function Item(AIndex: Integer): TModel{{NOME_TABELA_PASCAL}}; reintroduce;
  end;

implementation

{ TModel{{NOME_TABELA_PASCAL}} }

procedure TModel{{NOME_TABELA_PASCAL}}.Clear;
begin
{{CAMPOS_CLEAR}}end;

procedure TModel{{NOME_TABELA_PASCAL}}.Assign(AOrigem: TModel{{NOME_TABELA_PASCAL}});
begin
  if not Assigned(AOrigem) then Exit;
{{LOOP_CAMPOS}}  F{{CAMPO_PASCAL}} := AOrigem.{{CAMPO_PASCAL}};
{{/LOOP_CAMPOS}}end;

function TModel{{NOME_TABELA_PASCAL}}.ToString: string;
begin
  Result := '{{NOME_TABELA_PASCAL}}[{{PK_CAMPO_PASCAL}}=' + VarToStr(F{{PK_CAMPO_PASCAL}}) + ']';
end;

{ TLista{{NOME_TABELA_PASCAL}} }

constructor TLista{{NOME_TABELA_PASCAL}}.Create;
begin
  inherited Create(True); // True = owns objects (auto-free)
end;

function TLista{{NOME_TABELA_PASCAL}}.Adicionar(AModel: TModel{{NOME_TABELA_PASCAL}}): Integer;
begin
  Result := inherited Add(AModel);
end;

function TLista{{NOME_TABELA_PASCAL}}.Item(AIndex: Integer): TModel{{NOME_TABELA_PASCAL}};
begin
  Result := TModel{{NOME_TABELA_PASCAL}}(inherited Items[AIndex]);
end;

end.
