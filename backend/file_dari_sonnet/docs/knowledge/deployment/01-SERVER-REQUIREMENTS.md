# 💻 Server Requirements

> **Spesifikasi server dan software requirements untuk deployment**

## 📋 Daftar Isi

1. [Hardware Specifications](#hardware-specifications)
2. [Software Requirements](#software-requirements)
3. [Network Requirements](#network-requirements)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)

---

## 🖥️ Hardware Specifications

### Minimum Specifications
**Untuk development atau small-scale deployment**

- **CPU**: 2 cores (2.0 GHz)
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Network**: 100 Mbps
- **Concurrent Users**: ~50 users

### Recommended Specifications
**Untuk production environment**

- **CPU**: 4 cores (2.5 GHz atau lebih)
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Network**: 1 Gbps
- **Concurrent Users**: ~500 users

### High-Performance Specifications
**Untuk large-scale deployment**

- **CPU**: 8+ cores (3.0 GHz)
- **RAM**: 16 GB+
- **Storage**: 200 GB+ SSD (NVMe preferred)
- **Network**: 10 Gbps
- **Concurrent Users**: 1000+ users

---

## 💿 Software Requirements

### Operating System
**Recommended**: Ubuntu 22.04 LTS

**Supported**:
- Ubuntu 20.04 LTS atau lebih baru
- Debian 11 atau lebih baru
- CentOS 8 atau lebih baru
- RHEL 8 atau lebih baru

### Docker (Recommended Deployment)
```bash
Docker Engine: 24.0+
Docker Compose: 2.20+
```

### Python (Manual Deployment)
```bash
Python: 3.10+
pip: 23.0+
virtualenv: 20.0+
```

### Database
**PostgreSQL** (Recommended):
```bash
PostgreSQL: 14+
```

**MySQL** (Alternative):
```bash
MySQL: 8.0+
```

### Cache
```bash
Redis: 7.0+
```

### Web Server
```bash
Nginx: 1.24+
```

### SSL Certificate
```bash
Certbot: 2.0+ (untuk Let's Encrypt)
```

---

## 🌐 Network Requirements

### Ports
**Required Open Ports**:
- `22` - SSH (untuk remote access)
- `80` - HTTP (redirect ke HTTPS)
- `443` - HTTPS (main application)

**Optional Ports** (untuk development):
- `8008` - Django development server
- `5432` - PostgreSQL (jika external access)
- `6379` - Redis (jika external access)

### Firewall Configuration
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Domain & DNS
- Domain name (e.g., `knowledge.asncorpu.com`)
- DNS A record pointing to server IP
- Optional: CNAME for `www` subdomain

---

## 📦 Storage Requirements

### Disk Space Breakdown

```
/opt/asncorpu/              # Application directory
├── media/                  # 20-50 GB (user uploads)
├── staticfiles/            # 500 MB (CSS, JS, images)
├── logs/                   # 5-10 GB (application logs)
└── backups/                # 20-30 GB (database backups)

/var/lib/docker/            # Docker data
├── volumes/                # 10-20 GB (database data)
└── images/                 # 5-10 GB (Docker images)

Total Estimated: 60-120 GB
```

### IOPS Requirements
- **Minimum**: 1000 IOPS
- **Recommended**: 3000 IOPS
- **High-Performance**: 10000+ IOPS

---

## 🔐 Security Requirements

### SSH Access
- ✅ SSH key-based authentication (disable password auth)
- ✅ Non-root user dengan sudo access
- ✅ Fail2ban installed dan configured

### SSL/TLS
- ✅ Valid SSL certificate (Let's Encrypt atau commercial)
- ✅ TLS 1.2+ only
- ✅ Strong cipher suites

### Firewall
- ✅ UFW atau iptables configured
- ✅ Only required ports open
- ✅ Rate limiting enabled

---

## ✅ Pre-Deployment Checklist

### Server Access
- [ ] Server provisioned (VPS/Cloud/Dedicated)
- [ ] Root atau sudo access available
- [ ] SSH key-based authentication configured
- [ ] Server accessible via SSH

### Domain & DNS
- [ ] Domain name registered
- [ ] DNS A record configured
- [ ] DNS propagation completed (check: `nslookup domain.com`)
- [ ] Optional: CNAME for www subdomain

### Network
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Network bandwidth sufficient
- [ ] Static IP address assigned

### Software
- [ ] Operating system updated (`sudo apt update && sudo apt upgrade`)
- [ ] Docker installed (untuk Docker deployment)
- [ ] Python 3.10+ installed (untuk manual deployment)
- [ ] Git installed

### Security
- [ ] SSH password authentication disabled
- [ ] Fail2ban installed
- [ ] UFW firewall enabled
- [ ] SSL certificate ready (atau siap install Let's Encrypt)

### Backup
- [ ] Backup strategy planned
- [ ] Backup storage available
- [ ] Backup automation planned

---

## 🧪 Verification Commands

### Check OS Version
```bash
lsb_release -a
```

### Check CPU & RAM
```bash
# CPU info
lscpu

# RAM info
free -h

# Disk space
df -h
```

### Check Network
```bash
# Check open ports
sudo netstat -tulpn

# Check firewall status
sudo ufw status

# Test DNS
nslookup knowledge.asncorpu.com
```

### Check Software Versions
```bash
# Docker
docker --version
docker compose version

# Python
python3 --version

# PostgreSQL (jika installed)
psql --version

# Nginx (jika installed)
nginx -v
```

---

## 📊 Performance Benchmarks

### Expected Performance
**With Recommended Specs**:
- Response time: < 500ms (average)
- Concurrent users: 500+
- Requests per second: 100+
- Database queries: < 100ms (average)

### Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test homepage
ab -n 1000 -c 10 https://knowledge.asncorpu.com/

# Expected results:
# - Requests per second: > 50
# - Time per request: < 200ms
# - Failed requests: 0
```

---

## 📞 Support

Jika server tidak memenuhi requirements:
1. Upgrade server specifications
2. Optimize application configuration
3. Consider load balancing (untuk high traffic)
4. Contact DevOps team untuk consultation

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
