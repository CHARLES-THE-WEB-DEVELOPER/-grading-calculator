# PowerShell helper to scaffold Capacitor (run from project root)

Write-Host "Installing Capacitor packages..."
npm install @capacitor/core @capacitor/cli --save

Write-Host "Preparing www folder..."
npm run prepare-www

Write-Host "Initializing Capacitor..."
npx cap init grading-calculator com.example.gradingcalculator --web-dir=www

Write-Host "You can now add platforms: npx cap add android (on Windows) or npx cap add ios (on Mac)."
