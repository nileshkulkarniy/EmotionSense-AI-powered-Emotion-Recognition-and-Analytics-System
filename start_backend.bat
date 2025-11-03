@echo off
cd /d "c:\Users\knile\OneDrive\Desktop\EmotionSense"
echo Starting Flask backend server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher and add it to your PATH
    pause
    exit /b 1
)

REM Check if requirements are installed
echo Checking if required packages are installed...
python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing required packages...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo Error installing packages. Please install manually:
        echo pip install -r requirements.txt
        pause
        exit /b 1
    )
)

echo Starting Flask server on port 5000...
echo The server will be available at http://localhost:5000
echo.
python app.py
pause