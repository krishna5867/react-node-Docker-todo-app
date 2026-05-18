# React Node Docker Todo App

This project is a small full-stack todo application with:

- a React 19 + Vite frontend
- an Express API
- a MySQL database
- Docker Compose support for the full stack

## Project structure

- `react-app/` - frontend application
- `server/` - backend API
- `docker-compose.yml` - MySQL, backend, and frontend services

## Prerequisites

For local development without running the full stack in Docker, install:

- Node.js `22.12.0` or later in the supported range from `react-app/package.json`
- npm
- Docker with Docker Compose

The repository already includes `.nvmrc`, so if you use `nvm` you can run:

```bash
nvm use
```

## Environment configuration

After cloning the repository, create a root `.env` file from the provided example:

```bash
cp .env.example .env
```

Default values in `.env.example`:

```env
APP_HOST=localhost
FRONTEND_PORT=90
BACKEND_PORT=3000
MYSQL_PORT=3307
```

What these values control:

- `APP_HOST` - hostname shown in the backend startup links
- `FRONTEND_PORT` - host port for the frontend container
- `BACKEND_PORT` - host port for the backend container
- `MYSQL_PORT` - host port for the MySQL container

If you keep the default values, you do not need to change anything after copying the file.

If one of these ports is already in use on your machine, update the `.env` file before running Docker Compose.

## Option 1: Run locally for development

This mode runs:

- MySQL in Docker
- the backend on your machine
- the frontend with the Vite dev server

### 1. Install dependencies

From the project root:

```bash
cd server && npm install
cd ../react-app && npm install
cd ..
```

### 2. Start MySQL

From the project root:

```bash
docker compose up -d mysql
```

MySQL will be available on `localhost:3307`.

### 3. Start the backend

Open a terminal in `server/` and run:

```bash
DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=root DB_PASSWORD=password DB_NAME=todo_app npm run dev
```

The API will start on `http://localhost:3000`.

Useful endpoint:

- `GET http://localhost:3000/api/health`

### 4. Start the frontend

Open a second terminal in `react-app/` and run:

```bash
npm run dev
```

The frontend will be available on `http://localhost:90`.

During local development, Vite proxies `/api` requests to `http://localhost:3000`.

## Option 2: Run the full stack with Docker Compose

Make sure you created the root `.env` file first, then start the stack.

From the project root:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:90`
- Backend: `http://localhost:3000`
- MySQL: `localhost:3307`

To stop the stack:

```bash
docker compose down
```

To stop and remove the database volume:

```bash
docker compose down -v
```

## Development notes

- The backend creates the `todos` table automatically on startup if it does not exist.
- The frontend container serves the production build through nginx.
- In Docker, nginx forwards `/api` requests from the frontend container to the backend container.

## CI/CD deployment to EC2

This repository includes a GitHub Actions workflow at `.github/workflows/ci-cd.yml`.

What it does:

- on pull requests to `main`, it installs dependencies, lints the frontend, builds the frontend, checks backend syntax, and validates `docker-compose.yml`
- on pushes to `main`, it runs the same CI steps and then deploys to your EC2 instance over SSH

How deployment works:

- GitHub Actions connects to your EC2 instance with an SSH private key
- it changes into your application directory on the EC2 host
- it pulls the latest `main` branch
- it runs `docker compose up -d --build --remove-orphans`

### 1. Prepare the EC2 server

Install these on the EC2 instance:

- Git
- Docker Engine
- Docker Compose plugin

Then clone this repository onto the EC2 instance, for example:

```bash
git clone <your-repository-url> /home/ec2-user/react-node-docker
cd /home/ec2-user/react-node-docker
cp .env.example .env
```

Update `.env` with the correct host and ports for your server.

Recommended security group rules:

- allow inbound HTTP on the frontend port you want to expose
- allow inbound SSH only from trusted IPs
- do not expose MySQL publicly

### 2. Add GitHub repository secrets

Set these repository secrets in GitHub:

- `EC2_HOST` - public IP or DNS name of your EC2 instance
- `EC2_USERNAME` - SSH username such as `ec2-user` or `ubuntu`
- `EC2_SSH_KEY` - private key content used to SSH into the instance
- `EC2_APP_DIR` - absolute path to the cloned repository on the instance
- `EC2_PORT` - optional SSH port if you are not using the default port `22`

### 3. Push to `main`

After the secrets are configured, every push to `main` will:

- run CI checks
- redeploy the Docker Compose stack on EC2 automatically

If you need to trigger it manually, use the `workflow_dispatch` option from the GitHub Actions tab.

## Troubleshooting

If the backend cannot connect to MySQL locally:

- make sure the MySQL container is running: `docker compose ps`
- make sure you started the backend with `DB_PORT=3307`
- wait a few seconds for MySQL to finish starting, then retry

If port `90` is already in use:

- stop the process using that port, or
- change the frontend port mapping in `docker-compose.yml`, and if needed update the Vite port in `react-app/vite.config.js`