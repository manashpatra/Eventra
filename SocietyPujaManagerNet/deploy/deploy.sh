#!/bin/bash

echo "Starting Deployment for Society Puja Manager (.NET/React)"

# 1. Update system packages
sudo apt-get update
sudo apt-get install -y nginx dotnet-sdk-10.0 # Adjust for exact oracle linux / ubuntu ARM repos

# 2. Setup Directory
sudo mkdir -p /var/www/societypujamanager
sudo chown -R $USER:$USER /var/www/societypujamanager

# 3. Build .NET Backend (assuming we are in the source directory)
if [ -d "ClientApp" ] && command -v npm &> /dev/null; then
    echo "Building ClientApp frontend..."
    (cd ClientApp && npm install && npm run build)
fi

echo "Building .NET API..."
dotnet publish -c Release -o /var/www/societypujamanager

# 4. Permissions
sudo chown -R www-data:www-data /var/www/societypujamanager

# 5. Configure Nginx
echo "Configuring Nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/societypujamanager
sudo ln -sf /etc/nginx/sites-available/societypujamanager /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# 6. Configure Systemd Service
echo "Configuring Systemd Service..."
sudo cp deploy/societypujamanager.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable societypujamanager
sudo systemctl restart societypujamanager

echo "Deployment Complete! The app should be running at http://localhost"
