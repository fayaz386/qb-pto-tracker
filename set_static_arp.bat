@echo off
echo Applying permanent static ARP routing for QuickBooks Machine...
echo.

:: Ensure Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Failure: Please right-click this file and select "Run as Administrator".
    pause
    exit /b 1
)

:: Ensure the IP address is mapped to the correct Physical Address
arp -s 192.168.0.48 00-50-56-8c-23-a2

echo.
echo Success! The static ARP entry has been added.
echo You can now test the QuickBooks connection on the dashboard!
pause
