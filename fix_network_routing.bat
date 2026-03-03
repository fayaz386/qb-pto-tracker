@echo off
echo Enabling Weak Host Send and Receive for your Network Adapter...
echo.

:: Ensure Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Failure: Please right-click this file and select "Run as Administrator".
    pause
    exit /b 1
)

:: Enable weak host model on Interface 22
netsh interface ipv4 set interface 22 weakhostsend=enabled
netsh interface ipv4 set interface 22 weakhostreceive=enabled

echo.
echo Success! Your secondary 192.168.0.x IPs can now communicate freely.
echo You can test the QuickBooks connection on the dashboard now.
pause
