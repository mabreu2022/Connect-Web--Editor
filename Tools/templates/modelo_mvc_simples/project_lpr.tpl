program {{NOME_SISTEMA}};

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Gerador de Sistemas Lazarus/MVC }

uses
  {$IFDEF UNIX}
  cthreads,
  {$ENDIF}
  Interfaces,
  Forms,
  uDMConexao
  { Adicione suas units de View aqui };

{$R *.res}

begin
  RequireDerivedFormResource := True;
  Application.Title := '{{NOME_SISTEMA}}';
  Application.Scaled := True;
  Application.Initialize;
  Application.CreateForm(TDMConexao, DMConexao);
  { TODO: Criar e registrar o formulário principal }
  { Application.CreateForm(TfrmPrincipal, frmPrincipal); }
  Application.Run;
end.
