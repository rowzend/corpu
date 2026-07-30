# 🐳 Docker Setup Guide

Panduan lengkap untuk menjalankan ASN Academy Frontend menggunakan Docker.

## 📋 Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)
- Port 3004 tersedia

## 🚀 Quick Start dengan Docker

### 1. Build Docker Image
```bash
cd all-projects/projects/asn-acad-frontend
docker-compose build
```

### 2. Start Container
```bash
docker-compose up -d
```

### 3. Check Logs
```bash
docker-compose logs -f
```

### 4. Akses Aplikasi
Buka browser: [http://localhost:3004](http://localhost:3004)

## 🛠️ Docker Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up asn-acad-frontend
```

### Stop Services
```bash
# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 -f

# Specific service
docker-compose logs -f asn-acad-frontend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart asn-acad-frontend
```

### Rebuild
```bash
# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

## 📦 NPM Scripts untuk Docker

```bash
# Build image
npm run docker:build

# Start containers
npm run docker:up

# Stop containers
npm run docker:down

# View logs
npm run docker:logs

# Restart containers
npm run docker:restart
```

## 🔧 Configuration

### Port Configuration
Default port: **3004**

Untuk mengubah port, edit `docker-compose.yml`:
```yaml
ports:
  - "3005:3004"  # host:container
```

### Environment Variables
Edit di `docker-compose.yml`:
```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://localhost:3002/api
  - NEXT_PUBLIC_API_TIMEOUT=30000
```

Atau gunakan file `.env`:
```bash
# Buat file .env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

### Volume Mounting
Hot reload sudah aktif dengan volume mounting:
```yaml
volumes:
  - .:/app                    # Source code
  - /app/node_modules         # Preserve node_modules
  - /app/.next                # Preserve build cache
```

## 🏗️ Production Build

### Build Production Image
```bash
docker build -f Dockerfile.prod -t asn-acad-frontend:prod .
```

### Run Production Container
```bash
docker run -d \
  --name asn-acad-frontend-prod \
  -p 3004:3004 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api \
  asn-acad-frontend:prod
```

## 🔍 Troubleshooting

### Container tidak start
```bash
# Check logs
docker-compose logs asn-acad-frontend

# Check container status
docker ps -a

# Restart container
docker-compose restart
```

### Port sudah digunakan
```bash
# Check port usage
lsof -i :3004

# Kill process
kill -9 <PID>

# Atau ubah port di docker-compose.yml
```

### Hot reload tidak bekerja
```bash
# Rebuild container
docker-compose down
docker-compose up -d --build

# Check volume mounting
docker-compose config
```

### Permission issues
```bash
# Fix ownership (Linux/Mac)
sudo chown -R $USER:$USER .

# Or run with sudo
sudo docker-compose up -d
```

### Node modules issues
```bash
# Remove node_modules dan rebuild
rm -rf node_modules
docker-compose down -v
docker-compose up -d --build
```

## 🔗 Integration dengan Backend

### Jika backend juga di Docker
Update `docker-compose.yml`:
```yaml
services:
  asn-acad-frontend:
    # ... existing config
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3002/api
    depends_on:
      - backend
    networks:
      - asn-network

  backend:
    image: your-backend-image
    container_name: asn-backend
    ports:
      - "3002:3002"
    networks:
      - asn-network

networks:
  asn-network:
    driver: bridge
```

### Jika backend di host machine
Gunakan `host.docker.internal`:
```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://host.docker.internal:3002/api
```

## 📊 Docker Compose Structure

```yaml
version: '3.8'

services:
  asn-acad-frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: asn-acad-frontend
    ports:
      - "3004:3004"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3002/api
    restart: unless-stopped
    networks:
      - asn-network

networks:
  asn-network:
    driver: bridge
```

## 🎯 Best Practices

### Development
- ✅ Use volume mounting untuk hot reload
- ✅ Use `Dockerfile` (bukan `Dockerfile.prod`)
- ✅ Keep `NODE_ENV=development`
- ✅ Mount source code sebagai volume

### Production
- ✅ Use `Dockerfile.prod` dengan multi-stage build
- ✅ Set `NODE_ENV=production`
- ✅ Don't mount source code
- ✅ Use specific image tags (bukan `latest`)
- ✅ Implement health checks

## 📝 Useful Commands

```bash
# Enter container shell
docker-compose exec asn-acad-frontend sh

# Install new package
docker-compose exec asn-acad-frontend npm install <package>

# Run commands inside container
docker-compose exec asn-acad-frontend npm run build

# Copy files from container
docker cp asn-acad-frontend:/app/file.txt ./

# Check container resource usage
docker stats asn-acad-frontend

# Inspect container
docker inspect asn-acad-frontend
```

## 🔐 Security Tips

- Don't commit `.env` files
- Use secrets management untuk production
- Keep Docker images updated
- Scan images untuk vulnerabilities:
  ```bash
  docker scan asn-acad-frontend
  ```

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)

---

**Happy Dockerizing! 🐳**
