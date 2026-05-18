import { useEffect, useState } from 'react';
import '../css/Todo.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchTodos = async () => {
      try {
        setError('');
        setLoading(true);
        const res = await fetch(`${API_URL}/todos`);

        if (!res.ok) {
          throw new Error('Request failed');
        }

        const data = await res.json();

        if (!ignore) {
          setTodos(data);
        }
      } catch {
        if (!ignore) {
          setError("Failed to fetch todos");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchTodos();

    return () => {
      ignore = true;
    };
  }, []);

  const addTodo = async () => {
    if (!input.trim()) return;

    try {
      setError('');
      const res = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: input })
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const createdTodo = await res.json();
      setTodos((currentTodos) => [createdTodo, ...currentTodos]);
      setInput("");
    } catch {
      setError("Failed to add todo");
    }
  };

  const toggleComplete = async (id) => {
    const todo = todos.find(t => t.id === id);

    if (!todo) {
      return;
    }

    try {
      setError('');
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          completed: !todo.completed
        })
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      setTodos(
        todos.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch {
      setError("Failed to update todo");
    }
  };

  const deleteTodo = async (id) => {
    try {
      setError('');
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      setTodos((currentTodos) => currentTodos.filter(todo => todo.id !== id));
    } catch {
      setError("Failed to delete todo");
    }
  };

  return (
    <div className="container">
      <h2>Todo App</h2>

      <div className="input-row">
        <input
          className="input"
          type="text"
          value={input}
          placeholder="Add Todos"
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="button" onClick={addTodo}>
          Add
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <ul className="list">
        {todos.map((todo) => (
          <li className="list-item" key={todo.id}>
            <div className="left">
              <input
                type="checkbox"
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onChange={() => toggleComplete(todo.id)}
              />

              <label
                htmlFor={`todo-${todo.id}`}
                className={`text ${todo.completed ? "completed" : ""}`}
              >
                {todo.text}
              </label>
            </div>

            {todo.completed && (
              <button
                className="delete-btn"
                onClick={() => deleteTodo(todo.id)}
              >
                🗑
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};