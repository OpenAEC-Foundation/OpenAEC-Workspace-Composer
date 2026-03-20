@echo off
echo === Docker VHDX Compact Script ===
echo.
echo Step 1: Stopping Docker and WSL...
taskkill /IM "Docker Desktop.exe" /F 2>nul
taskkill /IM "com.docker.backend.exe" /F 2>nul
wsl --shutdown
timeout /t 5 /nobreak >nul

echo.
echo Step 2: Compacting VHDX (this takes a few minutes)...
echo select vdisk file="%LOCALAPPDATA%\Docker\wsl\disk\docker_data.vhdx" > %TEMP%\compact.txt
echo compact vdisk >> %TEMP%\compact.txt
diskpart /s %TEMP%\compact.txt

echo.
echo Step 3: Checking result...
dir "%LOCALAPPDATA%\Docker\wsl\disk\docker_data.vhdx"

echo.
echo Done! You can restart Docker Desktop now.
pause
