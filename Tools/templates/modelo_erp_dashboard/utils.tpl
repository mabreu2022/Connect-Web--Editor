unit uUtils;

{$mode objfpc}{$H+}
{ Gerado automaticamente em {{DATA_GERACAO}} }
{ Sistema: {{NOME_SISTEMA}} }
{ Funções utilitárias globais do sistema }

interface

uses
  Classes, SysUtils;

{ Formata data para exibição (dd/mm/aaaa) }
function FormatarData(AData: TDate): string;

{ Formata data e hora (dd/mm/aaaa hh:nn:ss) }
function FormatarDataHora(ADataHora: TDateTime): string;

{ Formata valor monetário (R$ #.##0,00) }
function FormatarMoeda(AValor: Currency): string;

{ Converte string para número seguro (retorna 0 se inválido) }
function StrParaIntSafe(const AStr: string): Integer;
function StrParaFloatSafe(const AStr: string): Double;

{ Verifica se uma string é numérica }
function EhNumero(const AStr: string): Boolean;

{ Mascara CPF: 000.000.000-00 }
function FormatarCPF(const ACPF: string): string;

{ Mascara CNPJ: 00.000.000/0000-00 }
function FormatarCNPJ(const ACNPJ: string): string;

{ Remove caracteres não numéricos }
function SomenteNumeros(const AStr: string): string;

{ Capitalize primeira letra de cada palavra }
function CapitalizarPalavras(const AStr: string): string;

{ Trunca string com '...' se maior que AMax }
function Truncar(const AStr: string; AMax: Integer): string;

implementation

function FormatarData(AData: TDate): string;
begin
  if AData = 0 then Result := ''
  else Result := FormatDateTime('dd/mm/yyyy', AData);
end;

function FormatarDataHora(ADataHora: TDateTime): string;
begin
  if ADataHora = 0 then Result := ''
  else Result := FormatDateTime('dd/mm/yyyy hh:nn:ss', ADataHora);
end;

function FormatarMoeda(AValor: Currency): string;
begin
  Result := FormatFloat('R$ #,##0.00', AValor);
end;

function StrParaIntSafe(const AStr: string): Integer;
begin
  Result := StrToIntDef(Trim(AStr), 0);
end;

function StrParaFloatSafe(const AStr: string): Double;
var
  S: string;
begin
  S := StringReplace(Trim(AStr), ',', '.', [rfReplaceAll]);
  Result := StrToFloatDef(S, 0);
end;

function EhNumero(const AStr: string): Boolean;
var
  I: Integer;
begin
  Result := AStr <> '';
  for I := 1 to Length(AStr) do
    if not (AStr[I] in ['0'..'9']) then
    begin
      Result := False;
      Exit;
    end;
end;

function FormatarCPF(const ACPF: string): string;
var
  N: string;
begin
  N := SomenteNumeros(ACPF);
  if Length(N) = 11 then
    Result := Copy(N,1,3)+'.'+Copy(N,4,3)+'.'+Copy(N,7,3)+'-'+Copy(N,10,2)
  else
    Result := ACPF;
end;

function FormatarCNPJ(const ACNPJ: string): string;
var
  N: string;
begin
  N := SomenteNumeros(ACNPJ);
  if Length(N) = 14 then
    Result := Copy(N,1,2)+'.'+Copy(N,3,3)+'.'+Copy(N,6,3)+'/'+Copy(N,9,4)+'-'+Copy(N,13,2)
  else
    Result := ACNPJ;
end;

function SomenteNumeros(const AStr: string): string;
var
  I: Integer;
begin
  Result := '';
  for I := 1 to Length(AStr) do
    if AStr[I] in ['0'..'9'] then
      Result := Result + AStr[I];
end;

function CapitalizarPalavras(const AStr: string): string;
var
  I: Integer;
  ProxMaius: Boolean;
begin
  Result := LowerCase(AStr);
  ProxMaius := True;
  for I := 1 to Length(Result) do
    if Result[I] = ' ' then
      ProxMaius := True
    else if ProxMaius then
    begin
      Result[I] := UpCase(Result[I]);
      ProxMaius := False;
    end;
end;

function Truncar(const AStr: string; AMax: Integer): string;
begin
  if Length(AStr) <= AMax then
    Result := AStr
  else
    Result := Copy(AStr, 1, AMax - 3) + '...';
end;

end.
