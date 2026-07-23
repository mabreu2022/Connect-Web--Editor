Add-Type -AssemblyName System.Windows.Forms
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.Width = 1
$form.Height = 1
$form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
$form.Show()
$f = New-Object System.Windows.Forms.FolderBrowserDialog
$f.Description = "Selecione a pasta de destino do projeto Lazarus"
$result = $f.ShowDialog($form)
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $f.SelectedPath
}
$form.Close()
