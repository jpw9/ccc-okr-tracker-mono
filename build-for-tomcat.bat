@echo off
REM =====================================================
REM OKR Tracker - Build for Tomcat Deployment
REM Target Server: 10.1.155.28
REM =====================================================

echo ==========================================
echo OKR Tracker - Build for Tomcat
echo Target: 10.1.155.28
echo ==========================================
echo.

REM Set paths
set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%ccc-okr-tracker-gemini-backend
set FRONTEND_DIR=%PROJECT_ROOT%ccc-okr-tracker-gemini
set OUTPUT_DIR=%PROJECT_ROOT%build-output
set BACKEND_WAR_NAME=okr-tracker-backend.war
set FRONTEND_WAR_NAME=okr-tracker-ui.war
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo Creating build output directory...
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"
echo.

REM =====================================================
REM STEP 1: Build Backend (WAR)
REM =====================================================
echo ==========================================
echo STEP 1: Building Backend WAR
echo ==========================================
echo.
echo Location: %BACKEND_DIR%
echo Output: target\okr-tracker-backend-0.0.1-SNAPSHOT.war
echo.

cd /d "%BACKEND_DIR%"

REM Check if Maven wrapper exists
if not exist mvnw.cmd (
    echo ERROR: Maven wrapper not found!
    echo Please ensure mvnw.cmd exists in the backend directory.
    pause
    exit /b 1
)

echo Running Maven build with prod profile...
call mvnw.cmd clean package -DskipTests

if not exist "target\okr-tracker-backend-0.0.1-SNAPSHOT.war.original" (
    echo ERROR: Backend WAR file was not created!
    pause
    exit /b 1
)

echo.
echo Backend WAR built successfully!
echo Copying to output directory...
REM Use the .war.original file for traditional Tomcat deployment
REM The repackaged WAR uses Spring Boot's executable format which doesn't work with external Tomcat
copy "target\okr-tracker-backend-0.0.1-SNAPSHOT.war.original" "%OUTPUT_DIR%\%BACKEND_WAR_NAME%"
echo.

REM =====================================================
REM STEP 2: Build Frontend (Static files)
REM =====================================================
echo ==========================================
echo STEP 2: Building Frontend
echo ==========================================
echo.
echo Location: %FRONTEND_DIR%
echo Output: dist\ folder
echo.

cd /d "%FRONTEND_DIR%"

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Ensure .env.production exists with correct configuration
echo Ensuring .env.production is configured...
if not exist .env.production (
    echo Creating .env.production...
    (
        echo # Production Environment Configuration
        echo # Server: 10.1.155.28
        echo.
        echo VITE_API_BASE_URL=http://10.1.155.28:8080/api
        echo.
        echo # Keycloak Configuration
        echo VITE_KEYCLOAK_URL=https://auth.ccc.net
        echo VITE_KEYCLOAK_REALM=AppsRND
        echo VITE_KEYCLOAK_CLIENT_ID=frontend
    ) > .env.production
)

echo Installing dependencies...
call npm install

echo.
echo Building production bundle...
call npm run build -- --mode production

if not exist "dist\index.html" (
    echo ERROR: Frontend build failed - dist directory not created!
    pause
    exit /b 1
)

echo.
echo Frontend built successfully!

REM =====================================================
REM STEP 3: Create Frontend WAR file
REM =====================================================
echo ==========================================
echo STEP 3: Creating Frontend WAR
echo ==========================================
echo.

REM Check if Java is installed (needed for jar command)
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed!
    echo Java is required to create WAR files.
    pause
    exit /b 1
)

cd dist
echo Creating WAR file from dist folder...
jar -cvf "%OUTPUT_DIR%\%FRONTEND_WAR_NAME%" *

if not exist "%OUTPUT_DIR%\%FRONTEND_WAR_NAME%" (
    echo ERROR: Failed to create frontend WAR file!
    pause
    exit /b 1
)

echo Frontend WAR created successfully!
echo.

REM =====================================================
REM BUILD SUMMARY
REM =====================================================
cd /d "%PROJECT_ROOT%"

echo.
echo ==========================================
echo BUILD COMPLETED SUCCESSFULLY!
echo ==========================================
echo.
echo Build output location: %OUTPUT_DIR%
echo.
dir /b "%OUTPUT_DIR%"
echo.
echo Files ready for deployment:
echo   - okr-tracker-backend.war : Backend (deploy as okr-tracker-backend.war)
echo   - okr-tracker-ui.war      : Frontend (deploy as cccokrtracker.war)
echo.
echo Note: Frontend WAR should be renamed to cccokrtracker.war on server
echo.
echo ==========================================
echo DEPLOYMENT INSTRUCTIONS
echo ==========================================
echo.
echo To deploy to Tomcat on 10.1.155.28:
echo.
echo 1. Stop Tomcat:
echo    sudo systemctl stop tomcat
echo.
echo 2. Backup existing deployment (if any):
echo    sudo cp /opt/tomcat/webapps/okr-tracker-backend.war /opt/backups/okr-tracker-backend.war.%TIMESTAMP%
echo    sudo cp /opt/tomcat/webapps/cccokrtracker.war /opt/backups/cccokrtracker.war.%TIMESTAMP%
echo.
echo 3. Copy WAR files to server:
echo    scp %OUTPUT_DIR%\okr-tracker-backend.war user@10.1.155.28:/tmp/
echo    scp %OUTPUT_DIR%\okr-tracker-ui.war user@10.1.155.28:/tmp/
echo.
echo 4. Move WAR files to Tomcat webapps:
echo    sudo mv /tmp/okr-tracker-backend.war /opt/tomcat/webapps/
echo    sudo mv /tmp/okr-tracker-ui.war /opt/tomcat/webapps/cccokrtracker.war
echo    sudo chown tomcat:tomcat /opt/tomcat/webapps/*.war
echo.
echo 5. Start Tomcat:
echo    sudo systemctl start tomcat
echo.
echo 6. Monitor logs:
echo    sudo tail -f /opt/tomcat/logs/catalina.out
echo.
echo 7. Access application:
echo    Frontend: http://10.1.155.28:8080/cccokrtracker/
echo    Backend:  http://10.1.155.28:8080/okr-tracker-backend/
echo.
echo ==========================================
echo.

REM Create deployment instructions file
(
    echo OKR Tracker - Deployment Instructions
    echo =====================================
    echo Build Date: %date% %time%
    echo.
    echo WAR Files Location:
    echo   %OUTPUT_DIR%
    echo.
    echo Files:
    echo   - okr-tracker-backend.war : Backend application
    echo   - okr-tracker-ui.war      : Frontend application (rename to cccokrtracker.war)
    echo.
    echo Deployment Steps:
    echo -----------------
    echo.
    echo 1. Stop Tomcat:
    echo    sudo systemctl stop tomcat
    echo.
    echo 2. Backup current deployment:
    echo    sudo cp /opt/tomcat/webapps/okr-tracker-backend.war /opt/backups/okr-tracker-backend.war.%TIMESTAMP%
    echo    sudo cp /opt/tomcat/webapps/cccokrtracker.war /opt/backups/cccokrtracker.war.%TIMESTAMP%
    echo.
    echo 3. Remove old deployments:
    echo    sudo rm -rf /opt/tomcat/webapps/okr-tracker-backend
    echo    sudo rm -rf /opt/tomcat/webapps/cccokrtracker
    echo    sudo rm -f /opt/tomcat/webapps/okr-tracker-backend.war
    echo    sudo rm -f /opt/tomcat/webapps/cccokrtracker.war
    echo.
    echo 4. Copy WAR files to server:
    echo    scp okr-tracker-backend.war user@10.1.155.28:/tmp/
    echo    scp okr-tracker-ui.war user@10.1.155.28:/tmp/
    echo.
    echo 5. Move WAR files to Tomcat:
    echo    sudo mv /tmp/okr-tracker-backend.war /opt/tomcat/webapps/
    echo    sudo mv /tmp/okr-tracker-ui.war /opt/tomcat/webapps/cccokrtracker.war
    echo    sudo chown tomcat:tomcat /opt/tomcat/webapps/*.war
    echo.
    echo 6. Start Tomcat:
    echo    sudo systemctl start tomcat
    echo.
    echo 7. Verify deployment:
    echo    sudo tail -f /opt/tomcat/logs/catalina.out
    echo.
    echo Application URLs:
    echo   Frontend: http://10.1.155.28:8080/cccokrtracker/
    echo   Backend:  http://10.1.155.28:8080/okr-tracker-backend/
    echo   Health:   http://10.1.155.28:8080/okr-tracker-backend/actuator/health
    echo.
) > "%OUTPUT_DIR%\DEPLOYMENT-INSTRUCTIONS.txt"

echo Deployment instructions saved to: %OUTPUT_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo.
pause
