@echo off
echo Safari MCP Server - Build Verification
echo =======================================
echo.

REM Change to project directory
cd /d "C:\Users\jorda\RiderProjects\AIPacketAnalyzer\safari-mcp-server"

echo Current directory: %CD%
echo.

REM Check if package.json exists
if exist package.json (
    echo ✅ package.json found
) else (
    echo ❌ package.json not found
    exit /b 1
)

REM Check if TypeScript compiler is available
where tsc >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ TypeScript compiler found
) else (
    echo ❌ TypeScript compiler not found
    echo Installing TypeScript globally...
    npm install -g typescript
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

REM Try to compile TypeScript
echo.
echo 🔨 Compiling TypeScript...
tsc --noEmit --skipLibCheck
if %errorlevel% neq 0 (
    echo ❌ TypeScript compilation failed
    echo.
    echo Try running: npm install
    pause
    exit /b 1
) else (
    echo ✅ TypeScript compilation successful
)

REM Actually build the project
echo.
echo 🏗️ Building project...
tsc
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
) else (
    echo ✅ Build successful
)

REM Check if build output exists
if exist build\index.js (
    echo ✅ Build output created: build\index.js
) else (
    echo ❌ Build output not found
    exit /b 1
)

echo.
echo 🎉 Build verification complete!
echo.
echo The project is ready to use.
echo Note: This server only works on macOS with Safari.
echo.
pause
