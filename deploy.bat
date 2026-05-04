@echo off
echo Setting up Vercel deployment...

cd /d "%~dp0"

echo Deploying client...
cd client
call vercel --name ragudemy-client --yes --prod
cd ..

echo Deploying server...
cd server
call vercel --name ragudemy-server --yes --prod
cd ..

echo Deployment complete!
pause