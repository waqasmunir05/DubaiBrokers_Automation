@echo off
call npx %*
echo.
echo Waiting 30 seconds before closing task...
timeout /t 30 /nobreak >nul
exit /b 0
