@echo off
echo ===================================
echo 🚀 Checking Git Status and Staging
echo ===================================
git status
echo.
echo Adding changes...
git add .

echo.
echo Committing changes...
git commit -m "feat: enhance project structure, styling and update gitignore"

echo.
echo Pushing to remote repository...
git push origin claude/rwaq-ai-3d-landing-omiy7m
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying general push...
    git push
)

echo.
echo ===================================
echo ✅ Done!
echo ===================================
pause
