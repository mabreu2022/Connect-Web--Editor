object TDMConexao: TDMConexao
  OnCreate = DataModuleCreate
  OnDestroy = DataModuleDestroy
  Height = 200
  Width = 300
  object IBDatabase1: TIBDatabase
    Left = 48
    Top = 48
    LoginPrompt = False
  end
  object IBTransaction1: TIBTransaction
    Left = 148
    Top = 48
    DefaultDatabase = IBDatabase1
    Params.Strings = (
      'read_committed'
      'rec_version'
      'nowait'
    )
  end
end
