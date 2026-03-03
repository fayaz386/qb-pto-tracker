@echo off
echo Opening Windows Firewall for PTO Tracker Dashboard (Port 8085) for ALL network types...

:: Ensure Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Failure: Please right-click this file and select "Run as Administrator".
    pause
    exit /b 1
)

:: Delete old rules first to cleanly apply new ones
netsh advfirewall firewall delete rule name="PTO Tracker Dashboard"

:: Add Universal Firewall Rules (allows all profiles: Public, Private, Domain)
netsh advfirewall firewall add rule name="PTO Tracker Dashboard" dir=in action=allow protocol=TCP localport=8085 profile=any
netsh advfirewall firewall add rule name="PTO Tracker Dashboard" dir=out action=allow protocol=TCP localport=8085 profile=any

echo Success! Port 8085 is completely open on this computer for all network types.
pause
