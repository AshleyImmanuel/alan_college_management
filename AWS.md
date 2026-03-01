# Parker College Management on AWS

This guide deploys the app on one EC2 instance:
- React frontend served by Nginx
- Node/Express backend running with PM2
- MongoDB from MongoDB Atlas (recommended)

## 1) Create an EC2 instance

Use Ubuntu 22.04 (or newer) and open these inbound ports in the security group:
- `22` (SSH)
- `80` (HTTP)
- `443` (HTTPS, if using SSL)

## 2) SSH and install system dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 3) Clone the project

```bash
git clone https://github.com/AshleyImmanuel/alan_college_management.git
cd alan_college_management
```

## 4) Configure backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_strong_secret
PORT=5000
```

Start backend with PM2:

```bash
pm2 start server.js --name parker-backend
pm2 save
pm2 startup
```

## 5) Build frontend

```bash
cd ../frontend
npm install
npm run build
```

## 6) Configure Nginx (frontend + API proxy)

Create config:

```bash
sudo tee /etc/nginx/sites-available/parker >/dev/null <<'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_EC2_PUBLIC_IP;

    root /home/ubuntu/alan_college_management/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF
```

Enable config:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/parker /etc/nginx/sites-enabled/parker
sudo nginx -t
sudo systemctl restart nginx
```

## 7) Optional: enable HTTPS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 8) Verify deployment

- Open `http://YOUR_DOMAIN_OR_EC2_PUBLIC_IP`
- Confirm login works
- Confirm API calls work through `/api/...`

## Notes

- In production, frontend requests use the same origin and are proxied by Nginx.
- Keep `backend/.env` out of git.
- If your EC2 username is not `ubuntu`, update the Nginx `root` path accordingly.
