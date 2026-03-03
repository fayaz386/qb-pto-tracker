@echo off
echo Opening Windows Firewall for PTO Tracker Dashboard (Port 8085)...

:: Ensure Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Failure: Please right-click this file and select "Run as Administrator".
    pause
    exit /b 1
)

:: Add Firewall Rules
netsh advfirewall firewall add rule name="PTO Tracker Dashboard" dir=in action=allow protocol=TCP localport=8085
netsh advfirewall firewall add rule name="PTO Tracker Dashboard" dir=out action=allow protocol=TCP localport=8085

echo Success! Port 8085 is now open on this computer.
pause
