$ErrorActionPreference = 'Stop'
Write-Host 'Conectar IA de OpenAI a Planes Espe & Miguel'
Write-Host 'La clave se guarda solo en este ordenador, en un archivo que la app no sirve al navegador.'
$appKeySecure = Read-Host 'Clave de API de OpenAI' -AsSecureString
$appKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($appKeySecure)
try {
    $appKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($appKeyPointer)
    if ([string]::IsNullOrWhiteSpace($appKeyPlain) -or $appKeyPlain.Contains("`n") -or $appKeyPlain.Contains("`r")) { throw 'Clave no valida' }
    $appConfigPath = Join-Path $PSScriptRoot '.env'
    $appConfigText = "OPENAI_API_KEY=$appKeyPlain`nOPENAI_MODEL=gpt-4o-mini`n"
    [IO.File]::WriteAllText($appConfigPath, $appConfigText, [Text.UTF8Encoding]::new($false))
    $appAcl = Get-Acl -LiteralPath $appConfigPath
    $appAcl.SetAccessRuleProtection($true, $false)
    $appIdentity = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $appRule = [Security.AccessControl.FileSystemAccessRule]::new($appIdentity, 'FullControl', 'Allow')
    $appAcl.SetAccessRule($appRule)
    Set-Acl -LiteralPath $appConfigPath -AclObject $appAcl
    Write-Host 'Configuracion guardada. Cierra el servidor y vuelve a abrir ABRIR-EN-MOVIL.cmd.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($appKeyPointer)
    $appKeyPlain = $null
    $appConfigText = $null
}
