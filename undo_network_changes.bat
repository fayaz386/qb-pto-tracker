@echo off
echo Reversing network changes...
echo.

:: Ensure Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Failure: Please right-click this file and select "Run as Administrator".
    pause
    exit /b 1
)

echo Removing Static ARP...
arp -d 192.168.0.48

echo Removing Persistent Route...
route delete 192.168.0.0

echo Reverting Weak Host Model...
netsh interface ipv4 set interface 22 weakhostsend=disabled
netsh interface ipv4 set interface 22 weakhostreceive=disabled

echo.
echo Reversion complete.
pause
