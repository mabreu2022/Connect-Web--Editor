program {{NOME_SISTEMA}};

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Modelo: ERP Dashboard + PDV }

uses
  {$IFDEF UNIX}cthreads,{$ENDIF}
  Interfaces, Forms,
  uDMConexao,
  uFrSidebar,
  uFrDashCard,
  uViewMain,
  uViewDashboard,
  uViewPDV;

{$R *.res}

begin
  RequireDerivedFormResource := True;
  Application.Title := '{{NOME_SISTEMA}}';
  Application.Scaled := True;
  Application.Initialize;
  Application.CreateForm(TDMConexao, DMConexao);
  Application.CreateForm(TfrmMain, frmMain);
  Application.Run;
end.
