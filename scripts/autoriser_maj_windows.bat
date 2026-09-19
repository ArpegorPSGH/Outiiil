@echo off
:: Script d'autorisation de mise à jour de l'extension Outiiil pour Windows
:: Demande d'élévation de privilèges administrateur si nécessaire
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Demande de privileges administrateur...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Configuration des politiques de mise a jour Google Chrome...

:: Configuration ExtensionInstallSources pour autoriser github.io
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\ExtensionInstallSources" /v 1 /t REG_SZ /d "https://arpegorpsgh.github.io/*" /f

:: Configuration ExtensionInstallAllowlist pour autoriser l'extension
reg add "HKLM\SOFTWARE\Policies\Google\Chrome\ExtensionInstallAllowlist" /v 1 /t REG_SZ /d "https://arpegorpsgh.github.io/Outiiil/update.xml" /f

echo.
echo Politiques appliquees avec succes ! Vous pouvez redemarrer Chrome.
pause
