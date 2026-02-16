@REM Start a simple HTTP server and open the CV generator in the default web browser
start http://localhost:8080/ @REM open the URL before starting the server to avoid blocking
python -m http.server 8080
