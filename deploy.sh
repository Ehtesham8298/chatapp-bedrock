#!/bin/bash
# ============================================
# Lightsail Deployment Script
# Run this AFTER SSH-ing into your Lightsail instance
# Usage: bash deploy.sh
# ============================================

set -e

echo "=== Step 1: Installing Node.js 22 ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "=== Step 2: Installing PM2 (process manager) ==="
sudo npm install -g pm2

echo "=== Step 3: Setting up app directory ==="
sudo mkdir -p /var/www/chatapp
sudo chown $USER:$USER /var/www/chatapp

echo "=== Step 4: Copying files ==="
cp -r client /var/www/chatapp/
cp -r server /var/www/chatapp/

echo "=== Step 5: Installing dependencies ==="
cd /var/www/chatapp/client
npm install
echo "Building React app..."
npm run build
echo "React build complete!"

cd /var/www/chatapp/server
npm install --production

echo "=== Step 6: Creating .env file ==="
if [ ! -f /var/www/chatapp/server/.env ]; then
  cat > /var/www/chatapp/server/.env << 'ENVEOF'
PORT=3001
NODE_ENV=production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY_HERE
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6
JWT_SECRET=YOUR_JWT_SECRET_HERE
TAVILY_API_KEY=YOUR_TAVILY_KEY_HERE
ENVEOF
  echo ".env file created!"
else
  echo ".env already exists, skipping"
fi

echo "=== Step 7: Starting app with PM2 ==="
cd /var/www/chatapp/server
pm2 stop chatapp 2>/dev/null || true
pm2 delete chatapp 2>/dev/null || true
pm2 start index.js --name chatapp
pm2 save
pm2 startup | tail -1 | sudo bash 2>/dev/null || true

echo "=== Step 8: Setting up Nginx ==="
sudo apt-get install -y nginx

sudo tee /etc/nginx/sites-available/chatapp > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # SSE streaming support
    proxy_buffering off;
    proxy_read_timeout 300s;
    chunked_transfer_encoding on;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/chatapp /etc/nginx/sites-enabled/chatapp
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "============================================"
echo "  DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "  App chal raha hai port 80 pe"
echo "  Browser mein apna Lightsail Public IP daalo"
echo ""
echo "  Useful commands:"
echo "    pm2 logs chatapp       - Server logs dekho"
echo "    pm2 restart chatapp    - Server restart karo"
echo "    pm2 status             - Status check karo"
echo "    sudo nginx -t          - Nginx config test"
echo "============================================"
