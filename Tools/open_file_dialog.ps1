Add-Type -AssemblyName System.Windows.Forms
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.Width = 1
$form.Height = 1
$form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
$form.Show()
$f = New-Object System.Windows.Forms.OpenFileDialog
$f.Filter = "Banco Firebird (*.fdb)|*.fdb|Todos os arquivos (*.*)|*.*"
$f.Title = "Selecione o arquivo do banco de dados Firebird"
$f.Multiselect = $false
$result = $f.ShowDialog($form)
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $f.FileName
}
$form.Close()
