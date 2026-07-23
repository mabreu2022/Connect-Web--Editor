unit uDMConexao;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} }
{ DataModule de conexão global — instância única usada por todos os DAOs }

interface

uses
  Classes, SysUtils, IBDatabase, Forms, Dialogs;

type
  { TDMConexao }
  TDMConexao = class(TDataModule)
    IBDatabase1: TIBDatabase;
    IBTransaction1: TIBTransaction;
    procedure DataModuleCreate(Sender: TObject);
    procedure DataModuleDestroy(Sender: TObject);
  private
    function GetConectado: Boolean;
  public
    procedure Conectar(const AHost: string; APorta: Integer;
      const ABanco, AUsuario, ASenha, ACharset: string);
    procedure Desconectar;
    procedure Commit;
    procedure Rollback;
    property Conectado: Boolean read GetConectado;
  end;

var
  DMConexao: TDMConexao;

implementation

{$R *.lfm}

procedure TDMConexao.DataModuleCreate(Sender: TObject);
begin
  IBTransaction1.DefaultDatabase := IBDatabase1;
  IBDatabase1.DefaultTransaction  := IBTransaction1;
  IBDatabase1.LoginPrompt := False;
  try
    Conectar('{{DB_HOST}}', {{DB_PORT}}, '{{DB_NAME}}', '{{DB_USER}}', '{{DB_PASSWORD}}', 'UTF8');
  except
    on E: Exception do
      ShowMessage('Erro ao conectar ao banco de dados: ' + E.Message);
  end;
end;

procedure TDMConexao.DataModuleDestroy(Sender: TObject);
begin
  Desconectar;
end;

function TDMConexao.GetConectado: Boolean;
begin
  Result := Assigned(IBDatabase1) and IBDatabase1.Connected;
end;

procedure TDMConexao.Conectar(const AHost: string; APorta: Integer;
  const ABanco, AUsuario, ASenha, ACharset: string);
begin
  if IBDatabase1.Connected then IBDatabase1.Close;

  IBDatabase1.DatabaseName := Format('%s/%d:%s', [AHost, APorta, ABanco]);
  IBDatabase1.Params.Clear;
  IBDatabase1.Params.Add('user_name=' + AUsuario);
  IBDatabase1.Params.Add('password='  + ASenha);
  IBDatabase1.Params.Add('lc_ctype='  + ACharset);
  IBDatabase1.Open;

  if not IBTransaction1.Active then
    IBTransaction1.Active := True;
end;

procedure TDMConexao.Desconectar;
begin
  try
    if IBTransaction1.Active then IBTransaction1.Rollback;
  except end;
  try
    if IBDatabase1.Connected then IBDatabase1.Close;
  except end;
end;

procedure TDMConexao.Commit;
begin
  if IBTransaction1.Active then
    IBTransaction1.CommitRetaining;
end;

procedure TDMConexao.Rollback;
begin
  if IBTransaction1.Active then
    IBTransaction1.RollbackRetaining;
end;

end.
