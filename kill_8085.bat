@echo off
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8085" ^| find "LISTENING"') do taskkill /f /pid %%a
echo Port 8085 cleared.
