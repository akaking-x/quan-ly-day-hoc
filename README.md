# Tuition Management System (Quản Lý Dạy Học)

Hệ thống quản lý dạy học và học phí dành cho gia sư, giáo viên dạy thêm.

## Features

- Quản lý học sinh (thêm, sửa, xóa, import từ Excel/CSV)
- Quản lý lớp học và nhóm
- Điểm danh với lịch trực quan
- Quản lý thanh toán và công nợ
- Ghi chú với hỗ trợ Markdown
- Portal cho học sinh tự tra cứu
- Hỗ trợ offline (PWA)
- Giao diện tối (Dark mode)
- Responsive design (Mobile-first)

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **State Management**: Zustand
- **Offline Storage**: IndexedDB

---

## Cài đặt

### Yêu cầu hệ thống

- Node.js >= 18.x
- MongoDB >= 6.x (hoặc MongoDB Atlas)
- npm hoặc yarn

---

## Phương pháp 1: Cài đặt thủ công (Development)

### Bước 1: Clone repository

```bash
git clone https://github.com/akaking-x/quan-ly-day-hoc.git
cd tuition-management
```

### Bước 2: Cài đặt dependencies

```bash
# Cài đặt dependencies cho cả client và server
npm install

# Hoặc cài riêng từng phần
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### Bước 3: Cấu hình môi trường

**Server (.env):**
```bash
# server/.env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/tuition-management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Client (.env):**
```bash
# client/.env
VITE_API_URL=http://localhost:3001/api
```

### Bước 4: Khởi động MongoDB

```bash
# Ubuntu/Debian
sudo systemctl start mongod

# MacOS (Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB
```

### Bước 5: Chạy ứng dụng

```bash
# Chạy cả client và server
npm run dev

# Hoặc chạy riêng
cd server && npm run dev
cd client && npm run dev
```

Truy cập:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

---

## Phương pháp 2: Docker Compose (Khuyến nghị cho Production)

### Bước 1: Cài đặt Docker và Docker Compose

**Ubuntu/Debian:**
```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào docker group
sudo usermod -aG docker $USER

# Cài Docker Compose
sudo apt install docker-compose-plugin
```

### Bước 2: Clone và cấu hình

```bash
git clone https://github.com/akaking-x/quan-ly-day-hoc.git
cd tuition-management
```

### Bước 3: Tạo file docker-compose.yml (nếu chưa có)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: tuition-mongodb
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=tuition-management

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: tuition-server
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGODB_URI=mongodb://mongodb:27017/tuition-management
      - JWT_SECRET=${JWT_SECRET:-change-this-secret-in-production}
    depends_on:
      - mongodb

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: tuition-client
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server

volumes:
  mongodb_data:
```

### Bước 4: Tạo Dockerfile cho Server

```dockerfile
# server/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Bước 5: Tạo Dockerfile cho Client

```dockerfile
# client/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### Bước 6: Tạo Nginx config

```nginx
# client/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Bước 7: Khởi động

```bash
# Build và chạy
docker compose up -d --build

# Xem logs
docker compose logs -f

# Dừng
docker compose down

# Dừng và xóa data
docker compose down -v
```

---

## Phương pháp 3: Docker với Traefik (Production với SSL)

Dành cho VPS với domain và cần HTTPS tự động.

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  mongodb:
    image: mongo:7
    container_name: tuition-mongodb
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db

  server:
    build: ./server
    container_name: tuition-server
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGODB_URI=mongodb://mongodb:27017/tuition-management
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`your-domain.com`) && PathPrefix(`/api`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3001"

  client:
    build: ./client
    container_name: tuition-client
    restart: unless-stopped
    depends_on:
      - server
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.client.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.client.entrypoints=websecure"
      - "traefik.http.routers.client.tls.certresolver=letsencrypt"
      - "traefik.http.services.client.loadbalancer.server.port=80"
      # Redirect HTTP to HTTPS
      - "traefik.http.routers.client-http.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.client-http.entrypoints=web"
      - "traefik.http.routers.client-http.middlewares=redirect-to-https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"

volumes:
  mongodb_data:
  letsencrypt:
```

```bash
# Chạy với production config
JWT_SECRET=your-secret docker compose -f docker-compose.prod.yml up -d
```

---

## Phương pháp 4: Cài đặt trực tiếp trên Ubuntu VPS

### Bước 1: Cập nhật hệ thống

```bash
sudo apt update && sudo apt upgrade -y
```

### Bước 2: Cài đặt Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Bước 3: Cài đặt MongoDB 7

```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt update
sudo apt install -y mongodb-org

# Start và enable
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Bước 4: Cài đặt PM2

```bash
sudo npm install -g pm2
```

### Bước 5: Clone và build ứng dụng

```bash
cd /var/www
git clone https://github.com/akaking-x/quan-ly-day-hoc.git
cd tuition-management

# Cài đặt và build server
cd server
npm ci
npm run build
cd ..

# Cài đặt và build client
cd client
npm ci
npm run build
cd ..
```

### Bước 6: Cấu hình môi trường

```bash
# Server
cat > server/.env << 'EOF'
PORT=3001
MONGODB_URI=mongodb://localhost:27017/tuition-management
JWT_SECRET=your-super-secret-key-change-this
EOF
```

### Bước 7: Chạy với PM2

```bash
# Tạo ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tuition-server',
    script: 'server/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
EOF

# Khởi động
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Bước 8: Cài đặt Nginx

```bash
sudo apt install -y nginx

# Tạo config
sudo cat > /etc/nginx/sites-available/tuition << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/tuition-management/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
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
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/tuition /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 9: Cài SSL với Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Cấu hình Firewall

```bash
# UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## Backup Database

```bash
# Backup
mongodump --db tuition-management --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --db tuition-management /backup/20240101/tuition-management
```

---

## Cập nhật ứng dụng

```bash
cd /var/www/tuition-management

# Pull code mới
git pull origin main

# Rebuild server
cd server && npm ci && npm run build && cd ..

# Rebuild client
cd client && npm ci && npm run build && cd ..

# Restart PM2
pm2 restart all
```

---

## Tài khoản mặc định

Sau khi cài đặt, truy cập ứng dụng và tạo tài khoản admin đầu tiên.

Hoặc sử dụng seed script:

```bash
cd server
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-management')
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      password: String,
      name: String,
      email: String,
      role: String,
      active: Boolean
    }));

    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hash,
      name: 'Administrator',
      email: 'admin@example.com',
      role: 'admin',
      active: true
    });

    console.log('Admin user created: admin / admin123');
    process.exit(0);
  });
"
```

---

## Hỗ trợ

- Issues: https://github.com/akaking-x/quan-ly-day-hoc/issues
- Hotline: 0977 040 868

---

## License

MIT License
