@echo off
echo.
echo ====================================
echo  Lenda Kahle Deployment Preparation
echo ====================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: PowerShell not found
    echo Please install PowerShell to run this script
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "prepare-deployment.ps1"

pause
