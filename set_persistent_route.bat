@echo off
echo Configuring persistent routing for the QuickBooks 192.168.0.x subnet...
echo.

:: Ensure Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Failure: Please right-click this file and select "Run as Administrator".
    pause
    exit /b 1
)

:: Ensure a persistent route for the 192.168.0.x subnet is mapped locally to Interface 22 (the main Ethernet adapter)
route -p add 192.168.0.0 mask 255.255.255.0 192.168.0.183 metric 1 if 22

echo.
echo Success! A direct route to the 192.168.0.x network has been established.
echo Please test the connection on the dashboard!
pause
