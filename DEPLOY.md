# GARSAME v3 — Production Deployment Runbook

Complete step-by-step guide for deploying and maintaining **GARSAME v3** on an Ubuntu/Debian VPS (e.g. Hetzner, DigitalOcean, Linode, AWS EC2).

---

## 1. Prerequisites & Server Sizing

- **Operating System**: Ubuntu 22.04 LTS or 24.04 LTS
- **Recommended Hardware**: 2 vCPUs, 2GB–4GB RAM, 40GB+ NVMe SSD
- **DNS Records**:
  - `A` record: `garsame.so` → `YOUR_SERVER_IP`
  - `A` record: `www.garsame.so` → `YOUR_SERVER_IP`

---

## 2. Server Provisioning

Log in to your VPS as root:

```bash
ssh root@YOUR_SERVER_IP
```

### 2.1 Update System Packages & Install Utilities
```bash
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban certbot python3-certbot-nginx
```

### 2.2 Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

### 2.3 Install & Start MongoDB 7.0+
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update
apt install -y mongodb-org
systemctl enable mongod
systemctl start mongod
```

### 2.4 Configure Firewall (UFW)
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

## 3. Initial Project Setup

### 3.1 Create Application Directories
```bash
mkdir -p /var/www/garsame-v3
mkdir -p /var/log/garsame
mkdir -p /var/backups/mongodb/garsame
mkdir -p /var/www/certbot
```

### 3.2 Clone Repository
```bash
git clone https://github.com/your-username/garsame-v3.git /var/www/garsame-v3
cd /var/www/garsame-v3
```

### 3.3 Configure Environment Variables
Copy the production template:
```bash
cp .env.production.example .env.production
```

Generate secure secrets and edit `.env.production`:
```bash
# Generate 32-byte secret for NextAuth
openssl rand -base64 32

# Generate 32-byte secret for form anti-spam HMAC
openssl rand -base64 32
```

Open `.env.production` in nano and fill in your secrets, MongoDB connection string, admin password, and SMTP settings:
```bash
nano .env.production
```

### 3.4 Install Dependencies & Build
```bash
npm ci
npm run build
```

### 3.5 Seed Database (Admin & Default Content)
```bash
npm run db:seed
```
*Note: This creates the indexed collections, initial settings, projects, blog posts, testimonials, and the admin account.*

---

## 4. Nginx & SSL Configuration

### 4.1 Copy Nginx Server Block
```bash
cp deploy/nginx/garsame.so.conf /etc/nginx/sites-available/garsame.so.conf
ln -s /etc/nginx/sites-available/garsame.so.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

### 4.2 Obtain SSL Certificate via Certbot
```bash
certbot --nginx -d garsame.so -d www.garsame.so
```

Test Nginx configuration and reload:
```bash
nginx -t
systemctl reload nginx
```

---

## 5. Process Management with PM2

### 5.1 Start Application Cluster
```bash
cd /var/www/garsame-v3
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd
```
*(Follow the onscreen instruction to enable PM2 on system boot).*

### 5.2 Verify Running Services
```bash
# Check PM2 process status
pm2 status

# Verify Health Check Endpoint
curl -i http://127.0.0.1:3000/api/health
```

---

## 6. Automated Maintenance (Cron Jobs)

Make the backup and maintenance scripts executable:
```bash
chmod +x /var/www/garsame-v3/deploy/scripts/*.sh
```

Edit crontab for root:
```bash
crontab -e
```

Add the following daily automated backup scheduled at 03:00 AM Mogadishu time:
```cron
# MongoDB daily backup at 03:00 AM
0 3 * * * /var/www/garsame-v3/deploy/scripts/backup-db.sh >> /var/log/garsame/backup-cron.log 2>&1
```

---

## 7. Zero-Downtime Application Updates

Whenever you push new code to `main`, update your production server simply by running:

```bash
cd /var/www/garsame-v3
./deploy/scripts/update.sh
```

This script will automatically:
1. Fetch latest commits (`git pull`)
2. Install new dependencies (`npm ci`)
3. Compile the Next.js production build (`npm run build`)
4. Sync database schemas and indexes (`npm run db:seed`)
5. Perform a rolling reload in PM2 (`pm2 reload ecosystem.config.cjs`)
6. Query `/api/health` to guarantee 100% uptime before completing

---

## 8. Troubleshooting & Operations

### View Live Logs
```bash
# PM2 Application Logs
pm2 logs garsame-v3

# Nginx Access and Error Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Database Backup Logs
cat /var/log/garsame/backup.log
```

### Reset Admin Password
If the admin password is ever forgotten, set `ADMIN_PASSWORD` in `.env.production` and run:
```bash
npm run db:seed -- --reset-admin-password
```

### Restore Database from Backup Archive
```bash
mongorestore --uri="mongodb://127.0.0.1:27017/garsame" --archive=/var/backups/mongodb/garsame/garsame_backup_YYYY-MM-DD_HHMMSS.archive.gz --gzip --drop
```
