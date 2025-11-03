@echo off
echo Installing all dependencies for Face Emotion Detection...

echo.
echo Installing Python dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo Error installing Python dependencies!
    pause
    exit /b %errorlevel%
)

echo.
echo Installing Node.js dependencies...
npm install

if %errorlevel% neq 0 (
    echo Error installing Node.js dependencies!
    pause
    exit /b %errorlevel%
)

echo.
echo All dependencies installed successfully!
echo.
echo To run the application:
echo   1. Start the backend: start_backend.bat
echo   2. Start the frontend: start_frontend.bat
echo.
pause