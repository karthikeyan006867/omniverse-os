# OMNIVERSE OS - GitHub & Vercel Deployment Script
# ================================================

Write-Host "`n🚀 OMNIVERSE OS Deployment Script`n" -ForegroundColor Cyan

# Step 1: Create GitHub repository (manual step)
Write-Host "📝 Step 1: Create GitHub Repository" -ForegroundColor Yellow
Write-Host "   Please create a new repository on GitHub:" -ForegroundColor White
Write-Host "   1. Go to https://github.com/new" -ForegroundColor Gray
Write-Host "   2. Repository name: omniverse-os" -ForegroundColor Gray
Write-Host "   3. Description: OMNIVERSE OS - A Fully Distributed, Self-Evolving Web Operating System" -ForegroundColor Gray
Write-Host "   4. Set to Public" -ForegroundColor Gray
Write-Host "   5. Do NOT initialize with README" -ForegroundColor Gray
Write-Host "`n   Press Enter after creating the repository..." -ForegroundColor Green
Read-Host

# Step 2: Get GitHub username
Write-Host "`n📝 Enter your GitHub username: " -ForegroundColor Yellow -NoNewline
$githubUser = Read-Host

# Step 3: Add remote and push
Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
git remote add origin "https://github.com/$githubUser/omniverse-os.git" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Remote already exists, updating..." -ForegroundColor Gray
    git remote set-url origin "https://github.com/$githubUser/omniverse-os.git"
}

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "   🔗 Repository: https://github.com/$githubUser/omniverse-os`n" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ Failed to push to GitHub. Please check your credentials." -ForegroundColor Red
    exit 1
}

# Step 4: Install Vercel CLI
Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
npm install -g vercel

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Vercel CLI installed!`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to install Vercel CLI." -ForegroundColor Red
    exit 1
}

# Step 5: Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "   Using token: mO4TAckSfHAgDhGW2nFRo3UJ`n" -ForegroundColor Gray

$env:VERCEL_TOKEN = "mO4TAckSfHAgDhGW2nFRo3UJ"

# Deploy with Vercel
vercel --prod --token=$env:VERCEL_TOKEN --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n   ✅ Successfully deployed to Vercel!" -ForegroundColor Green
    Write-Host "   🌐 Your OMNIVERSE OS is now live!`n" -ForegroundColor Cyan
} else {
    Write-Host "`n   ❌ Deployment failed. Please check the error above." -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "   GitHub: https://github.com/$githubUser/omniverse-os" -ForegroundColor White
Write-Host "   Vercel: Check the output above for your deployment URL`n" -ForegroundColor White
