@echo off
echo ========================================
echo   Hana_Cee's Stream Pet - Local Server
echo ========================================
echo.
echo Starting local web server on port 8000...
echo.
echo Once started, you can access:
echo   Config Page: http://localhost:8000/config.html
echo   Pet Display: http://localhost:8000/index.html
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python -m http.server 8000
