$ErrorActionPreference = 'Stop'
try {
    $root = $PSScriptRoot
    $url = 'http://localhost:4173/'
    function Test-App {
        try { $s = Invoke-RestMethod 'http://127.0.0.1:4173/api/status' -TimeoutSec 2; return ($null -ne $s.configured -and $s.provider -eq 'openai') } catch { return $false }
    }
    if (-not (Test-App)) {
        $node = Join-Path $env:ProgramFiles 'nodejs\node.exe'
        if (-not (Test-Path -LiteralPath $node)) { $node = (Get-Command node.exe -ErrorAction Stop).Source }
        Start-Process -FilePath $node -ArgumentList 'server.cjs' -WorkingDirectory $root -WindowStyle Hidden
        $ready = $false
        for ($i = 0; $i -lt 30; $i++) {
            if (Test-App) { $ready = $true; break }
            Start-Sleep -Milliseconds 300
        }
        if (-not $ready) { throw 'No se pudo arrancar la aplicación. Pide ayuda en el chat de Codex.' }
    }
    Start-Process $url
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Planes Espe y Miguel') | Out-Null
    exit 1
}

