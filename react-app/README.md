# React Node Docker Todo App

This workspace contains:

- `react-app`: React 19 + Vite frontend
- `server`: Express API backed by MySQL

## Requirements

- Node.js `20.19+` or `22.12+`
- Docker Compose for the local MySQL service or the full stack

## Local development

Use Node 22 before starting either app:

```bash
nvm use 22
```

Start MySQL from the `server` directory:

```bash
cd server
npm run db:up
```

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend:

```bash
cd react-app
npm run dev
```

The frontend uses the Vite dev proxy, so requests to `/api` are forwarded to `http://localhost:3000`.

## Full Docker stack

Run the full stack from the `server` directory:

```bash
cd server
npm run stack:up
```

Services:

- Frontend: `http://localhost`
- Backend: `http://localhost:3000`
- MySQL: `localhost:3306`
