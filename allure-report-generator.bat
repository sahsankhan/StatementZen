@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "ALLURE_HOME=%SCRIPT_DIR%node_modules\allure-commandline\dist"
set "RESULTS_DIR=%SCRIPT_DIR%allure-results"
set "REPORT_DIR=%SCRIPT_DIR%allure-report"

echo Generating Allure report...
echo Results: %RESULTS_DIR%
echo Output: %REPORT_DIR%

REM Find Java
set "JAVA_EXE=java.exe"
where /q %JAVA_EXE%
if ERRORLEVEL 1 (
    echo ERROR: Java is not found in PATH. Please install Java to generate Allure reports.
    exit /b 1
)

REM Generate report
"%JAVA_EXE%" -classpath "%ALLURE_HOME%\lib\*;%ALLURE_HOME%\lib\config" io.qameta.allure.CommandLine generate "%RESULTS_DIR%" --clean -o "%REPORT_DIR%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Report generated successfully!
    echo 📁 Location: %REPORT_DIR%
    echo.
    echo Opening report in browser...
    
    REM Open report
    start "" "%JAVA_EXE%" -classpath "%ALLURE_HOME%\lib\*;%ALLURE_HOME%\lib\config" io.qameta.allure.CommandLine open "%REPORT_DIR%"
    
    echo 🌐 Report server starting on http://localhost:4040
) else (
    echo.
    echo ❌ Report generation failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

endlocal

