# WhatsApp Service — Oracle Cloud Deployment

## 1. Install system dependencies (Ubuntu)
```bash
sudo apt update
sudo apt install -y nodejs npm chromium-browser
# Or install Node via nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18
```

## 2. Clone / copy whatsapp-service folder to Oracle Cloud
```bash
scp -r ./whatsapp-service ubuntu@<oracle-ip>:~/whatsapp-service
```

## 3. Install dependencies
```bash
cd ~/whatsapp-service
npm install
```

## 4. Create .env
```bash
cp .env.example .env
nano .env
```
Fill in:
```
PORT=3001
MONGO_URI=your_mongodb_uri
SERVICE_SECRET=same_secret_as_backend
BACKEND_URL=https://your-render-backend-url
PUPPETEER_CACHE_DIR=/home/ubuntu/.cache/puppeteer
```

## 5. Open firewall port on Oracle Cloud
In Oracle Cloud Console → VCN → Security Lists → add Ingress Rule:
- Source: 0.0.0.0/0 (or restrict to Render's IPs)
- Port: 3001
- Protocol: TCP

Also run on the VM:
```bash
sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT
sudo netfilter-persistent save
```

## 6. Run with PM2 (keeps it alive)
```bash
npm install -g pm2
pm2 start server.js --name whatsapp-service
pm2 save
pm2 startup
```

## 7. Update backend .env on Render
```
WHATSAPP_SERVICE_URL=http://<oracle-public-ip>:3001
SERVICE_SECRET=same_secret_as_above
```

## 8. Scan QR code
- Open your app → Settings → Connect WhatsApp
- The QR will be fetched from the whatsapp-service running on Oracle Cloud
- Scan once — session is saved to MongoDB (RemoteAuth), so it persists across restarts
