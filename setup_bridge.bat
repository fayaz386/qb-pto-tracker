@echo off
echo ========================================================
echo   PTO Tracker - Desktop Bridge Setup v2
echo ========================================================
echo.
echo Identify Desktop IP...
echo Listen Address: 10.0.0.134
echo Target Address: 192.168.0.48
echo.

echo 1. Adding Firewall Rule (Allow Port 8181)...
netsh advfirewall firewall delete rule name="Allow PTO Bridge Port 8181" >nul 2>&1
netsh advfirewall firewall add rule name="Allow PTO Bridge Port 8181" dir=in action=allow protocol=TCP localport=8181

echo.
echo 2. Configuring Port Proxy...
netsh interface portproxy delete v4tov4 listenaddress=10.0.0.134 listenport=8181 >nul 2>&1
netsh interface portproxy add v4tov4 listenaddress=10.0.0.134 listenport=8181 connectaddress=192.168.0.48 connectport=8181

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] FAILED.
    echo.
    echo CRITICAL: You must right-click this file and select
    echo           "Run as Administrator".
    echo.
) else (
    echo.
    echo [SUCCESS] Bridge & Firewall Configured.
    echo.
    echo Traffic to 10.0.0.134:8181 will now go to QB.
    echo.
)

pause
