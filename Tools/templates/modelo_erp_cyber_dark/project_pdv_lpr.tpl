program {{NOME_SISTEMA}}_PDV;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Modelo: ERP PDV (Executável Separado) }

uses
  {$IFDEF UNIX}cthreads,{$ENDIF}
  Interfaces, Forms,
  uDMConexao,
  uViewPDV,
  uViewPixPagamento,
  uViewPixConfig;

{$R *.res}

begin
  RequireDerivedFormResource := True;
  Application.Title := '{{NOME_SISTEMA}} - PDV';
  Application.Scaled := True;
  Application.Initialize;
  Application.CreateForm(TDMConexao, DMConexao);
  Application.CreateForm(TViewPDV, ViewPDV);
  Application.Run;
end.
