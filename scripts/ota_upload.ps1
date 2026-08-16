param(
  [string]$Port = "192.168.1.134"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$secretsPath = Join-Path $projectRoot "include\secrets.h"

if (-not (Test-Path -LiteralPath $secretsPath)) {
  throw "Missing include\secrets.h"
}

$secretsText = Get-Content -LiteralPath $secretsPath -Raw

function Get-SecretDefine {
  param(
    [string]$Name
  )

  $pattern = '(?m)^\s*#define\s+' + [regex]::Escape($Name) + '\s+"([^"]*)"\s*$'
  $match = [regex]::Match($secretsText, $pattern)
  if (-not $match.Success -or [string]::IsNullOrWhiteSpace($match.Groups[1].Value)) {
    throw "Missing $Name in include\secrets.h"
  }
  return $match.Groups[1].Value
}

$otaHostname = Get-SecretDefine "OTA_HOSTNAME"
$otaPassword = Get-SecretDefine "OTA_PASSWORD"

$env:BS_OTA_PASSWORD = $otaPassword

Write-Host "OTA upload target: $Port"
pio run -e esp32dev_ota -t upload --upload-port $Port
