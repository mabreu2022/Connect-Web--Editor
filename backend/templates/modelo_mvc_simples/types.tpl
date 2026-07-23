unit uTypes;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} }
{ Types e enumerações globais do sistema }

interface

// ============================================================
// Modos de formulário
// ============================================================
type
  TModoFormulario = (mNovo, mEdicao, mVisualizacao);

// ============================================================
// Resultado padrão de operações
// ============================================================
type
  TResultadoOperacao = record
    Sucesso: Boolean;
    Mensagem: string;
    class function OK: TResultadoOperacao; static;
    class function Erro(const AMensagem: string): TResultadoOperacao; static;
  end;

// ============================================================
// Constantes globais do sistema
// ============================================================
const
  APP_NOME    = '{{NOME_SISTEMA}}';
  APP_VERSAO  = '1.0.0';
  APP_AUTOR   = 'Gerado por Gerador de Sistemas Lazarus/MVC';

implementation

class function TResultadoOperacao.OK: TResultadoOperacao;
begin
  Result.Sucesso  := True;
  Result.Mensagem := '';
end;

class function TResultadoOperacao.Erro(const AMensagem: string): TResultadoOperacao;
begin
  Result.Sucesso  := False;
  Result.Mensagem := AMensagem;
end;

end.
