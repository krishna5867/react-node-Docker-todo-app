const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT) || 3000;
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'todo_app'
};
const serviceUrls = {
  frontend: process.env.FRONTEND_URL || 'http://localhost:90',
  backend: process.env.BACKEND_URL || `http://localhost:${port}`,
  mysql: process.env.MYSQL_URL || `localhost:${dbConfig.port}`
};
const terminalStyles = {
  green: '\x1b[32m',
  reset: '\x1b[0m'
};

function green(text) {
  return `${terminalStyles.green}${text}${terminalStyles.reset}`;
}

let pool;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true
  })
);
app.use(express.json());

async function connectWithRetry(retries = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10
      });

      await pool.query('SELECT 1');
      console.log('MySQL connected');
      return;
    } catch (error) {
      if (pool) {
        await pool.end().catch(() => {});
        pool = undefined;
      }

      console.error(
        `MySQL connection attempt ${attempt} failed: ${error.code || error.message}`
      );

      if (attempt === retries) {
        error.message = `${error.message}. Start MySQL with \`npm run db:up\` in /server or run the full Docker stack with \`npm run stack:up\`.`;
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id BIGINT PRIMARY KEY,
      text VARCHAR(255) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ message: 'Database unavailable' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Todo API' });
});

app.get('/api/todos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, text, completed FROM todos ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Text is required' });
  }

  const todo = {
    id: Date.now(),
    text: text.trim(),
    completed: false
  };

  try {
    await pool.query(
      'INSERT INTO todos (id, text, completed) VALUES (?, ?, ?)',
      [todo.id, todo.text, todo.completed]
    );

    return res.status(201).json(todo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to add todo' });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  const { completed } = req.body;

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'Completed must be a boolean' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE todos SET completed = ? WHERE id = ?',
      [completed, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    return res.json({ id: Number(req.params.id), completed });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM todos WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete todo' });
  }
});

async function startServer() {
  try {
    await connectWithRetry();
    await ensureSchema();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log('----------------------------------------');
      console.log('Services:');
      console.log(`- Frontend: ${green(serviceUrls.frontend)}`);
      console.log(`- Backend: ${green(serviceUrls.backend)}`);
      console.log(`- MySQL: ${green(serviceUrls.mysql)}`);
      console.log('----------------------------------------');
    });
  } catch (error) {
    console.error('Unable to start server', error);
    process.exit(1);
  }
}

startServer();