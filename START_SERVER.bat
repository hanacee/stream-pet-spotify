@echo off
echo ========================================
echo   Stream Pet Local Server
echo ========================================
echo.
echo Starting local web server...
echo.
echo Once started, use these URLs:
echo   Config:  http://localhost:8000/config.html
echo   Browser: http://localhost:8000/index.html
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Try Python first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python...
    python -m http.server 8000
    goto :end
)

REM Try Python3
python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python3...
    python3 -m http.server 8000
    goto :end
)

REM Try Node.js http-server
where http-server >nul 2>&1
if %errorlevel% == 0 (
    echo Using http-server...
    http-server -p 8000
    goto :end
)

echo ERROR: No server found!
echo.
echo Please install one of:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js + http-server: npm install -g http-server
echo.
pause

:end
