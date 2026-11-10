# 🐳 Docker Deployment Guide — Unique Classes Tuition Management System

Yeh guide aapko Unique Classes project ko Docker containers ke through chalane ke saare steps batati hai.

---

## 📁 Banaye Gaye Files (Created Architecture)

| File | Description |
| :--- | :--- |
| [`Dockerfile`](file:///d:/New%20folder/Unique%20Classes%20Project%20Using%20MySQL/Dockerfile) | React Vite Frontend ka multi-stage production build (Node.js 20 -> Nginx Alpine) |
| [`.dockerignore`](file:///d:/New%20folder/Unique%20Classes%20Project%20Using%20MySQL/.dockerignore) | Frontend context optimization file (`node_modules`, `dist` ignore) |
| [`nginx.conf`](file:///d:/New%20folder/Unique%20Classes%20Project%20Using%20MySQL/nginx.conf) | Nginx SPA routing & Backend `/api/` aur `/uploads/` reverse proxy configuration |
| [`server/Dockerfile`](file:///d:/New%20folder/Unique%20Classes%20Project%20Using%20MySQL/server/Dockerfile) | Express REST API Backend ka lightweight Node.js 20 Alpine container |
| [`server/.dockerignore`](file:///d:/New%20folder/Unique%20Classes%20Project%20Using%20MySQL/server/.dockerignore) | Backend context optimization file |
| [`docker-compose.yml`](file:///d:/New%20folder/Unique%20Classes%20Project%20Using%20MySQL/docker-compose.yml) | Teeno services (`frontend`, `backend`, `mysql`) ko ek saath orchestrate karne ke liye |
| [`.env.docker.example`](file:///d:/New%20folder/Unique%20Classes%20Project%20Using%20MySQL/.env.docker.example) | Custom ports aur database passwords configure karne ke liye environment template |

---

## 🚀 Docker Se Run Kaise Karein (Step-by-Step)

### 1. Docker Desktop Start Karein
Agar aap Windows par hain, toh pehle **Docker Desktop** application ko open karke start hone dein.

### 2. Containers Build Aur Start Karein
Project ke root directory me terminal open karke yeh command run karein:

```bash
docker compose up -d --build
```

> **Kya hoga:**
> 1. MySQL 8.0 download hokar start hoga aur `schema.sql` automatically run hokar tables & master classes/subjects seed ho jayenge.
> 2. Backend Node.js Express API build hokar database se connect ho jayegi.
> 3. Frontend React Vite app build hokar Nginx ke through serve ho jayegi.

---

## 🌐 URLs & Access Points

| Service | URL | Default Credentials / Note |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost](http://localhost) | Port 80 par live |
| **Backend API Healthcheck** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | API Status `OK` verify karein |
| **MySQL Database** | `localhost:3306` | User: `tuition_user` / Pass: `tuition_password` |
| **Admin Login** | [http://localhost](http://localhost) | Email: `askkmane@gmail.com` / Password: `UCadmin` |

---

## 🛠️ Useful Docker Commands

### Containers ka Status Dekhein
```bash
docker compose ps
```

### Live Logs Check Karein
```bash
# Teeno services ke live logs
docker compose logs -f

# Sirf Backend ke logs
docker compose logs -f backend

# Sirf MySQL ke logs
docker compose logs -f mysql
```

### Containers Stop Karein
```bash
docker compose down
```

### Database Data Aur Volumes Ke Saath Reset Karna Ho
```bash
# WARNING: Isse MySQL data aur volume delete hoga
docker compose down -v
```

---

## 📦 Individual Images Build Karni Ho (Docker Hub Ke Liye)

Agar aapko Docker Hub par images push karni ho ya alag se build karni ho:

```bash
# 1. Backend Image build
docker build -t your-username/unique-backend:latest ./server

# 2. Frontend Image build
docker build -t your-username/unique-frontend:latest .

# 3. Docker Hub par push
docker push your-username/unique-backend:latest
docker push your-username/unique-frontend:latest
```

---

## 💾 Uploads & Persistence (Data Kahan Save Hota Hai?)
- **Photos & Assignments**: Aapke local host folder `server/uploads` me bind mount hain. Container restart hone par bhi saare photos aur documents safe rahenge.
- **MySQL Data**: Docker volume `mysql_data` me safely persist hota hai.
