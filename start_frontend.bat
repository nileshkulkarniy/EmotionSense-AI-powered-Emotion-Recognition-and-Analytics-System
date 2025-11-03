@echo off
cd /d "c:\Users\knile\OneDrive\Desktop\EmotionSense"
echo Installing frontend dependencies (if needed)...
call npm install
echo.
echo Starting React frontend development server...
echo The app will be available at http://localhost:3006/
echo (If port 3006 is in use, Vite will automatically select the next available port)
echo.
echo Make sure the Flask backend is running on port 5000
echo.
npm run dev
pause