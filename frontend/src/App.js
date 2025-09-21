import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [events, setEvents] = useState([]);
  const codeRef = useRef('');
  const ws = useRef(null);
  const toastTimeouts = useRef([]);

  useEffect(() => {
    if (!username) {
      const inputName = prompt('Enter your username:', `User${Math.floor(Math.random() * 1000)}`);
      setUsername(inputName || `User${Math.floor(Math.random() * 1000)}`);
    }
  }, [username]);

  useEffect(() => {
    if (!username) return;

    ws.current = new WebSocket('ws://localhost:3000');

    ws.current.onopen = () => {
      setConnectionStatus('Connected');
      ws.current.send(JSON.stringify({ type: 'join', username }));
    };

    ws.current.onclose = () => {
      setConnectionStatus('Disconnected');
    };

    ws.current.onerror = () => {
      setConnectionStatus('Error');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'users') {
        setUsers(message.users);
      } else if (message.type === 'code') {
        if (message.code !== codeRef.current) {
          setCode(message.code);
        }
      } else if (message.type === 'event') {
        addEventNotification(message);
      }
    };

    return () => {
      ws.current.close();
      toastTimeouts.current.forEach(clearTimeout);
      toastTimeouts.current = [];
    };
  }, [username]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const addEventNotification = (message) => {
    setEvents((prev) => [...prev, message]);
    const timeoutId = setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e !== message));
    }, 4000);
    toastTimeouts.current.push(timeoutId);
  };

  const handleEditorChange = (value) => {
    setCode(value);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'code', code: value }));
    }
  };

  // Inline styles similar to the previous version, plus new styles for status and toasts
  const containerStyle = {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
  };

  const sidebarStyle = {
    width: '250px',
    backgroundColor: '#2c2f33',
    color: '#fff',
    padding: '20px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  };

  const userItemStyle = {
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '6px',
    backgroundColor: '#23272a',
  };

  const currentUserItemStyle = {
    ...userItemStyle,
    backgroundColor: '#7289da',
    fontWeight: 'bold',
  };

  const editorContainerStyle = {
    flexGrow: 1,
    padding: '20px',
    boxSizing: 'border-box',
    backgroundColor: '#1e1e1e',
    display: 'flex',
    flexDirection: 'column',
  };

  const languageSelectorStyle = {
    marginBottom: '12px',
    alignSelf: 'flex-start',
  };

  const statusStyle = {
    marginBottom: '12px',
    color:
      connectionStatus === 'Connected'
        ? '#43b581'
        : connectionStatus === 'Disconnected'
        ? '#f04747'
        : '#faa61a',
    fontWeight: 'bold',
  };

  const toastsContainerStyle = {
    position: 'fixed',
    top: 10,
    right: 10,
    zIndex: 1000,
  };

  const toastStyle = {
    backgroundColor: '#23272a',
    color: 'white',
    padding: '10px 20px',
    marginBottom: '10px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0,0,0,0.3)',
    minWidth: '200px',
  };

  return (
    <div style={containerStyle}>
      <aside style={sidebarStyle}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Connected Users</h2>
        <div style={{ marginBottom: '20px' }}>
          <strong>You are:</strong>
          <div style={currentUserItemStyle}>{username}</div>
        </div>
        <div>
          {users.length === 0 && <div>No users connected.</div>}
          {users.map((user) => (
            <div
              key={user}
              style={user === username ? currentUserItemStyle : userItemStyle}
            >
              {user}
            </div>
          ))}
        </div>
        <div style={statusStyle}>Status: {connectionStatus}</div>
      </aside>
      <main style={editorContainerStyle}>
        <h2 style={{ color: 'white' }}>Real-Time Collaborative Code Editor</h2>
        <select
          style={languageSelectorStyle}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        <MonacoEditor
          height="calc(100vh - 160px)"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 16,
            fontFamily: 'monospace',
            minimap: { enabled: false },
          }}
        />
        <div style={toastsContainerStyle}>
          {events.map((event, index) => (
            <div key={index} style={toastStyle}>
              {event.username} has {event.eventType === 'join' ? 'joined' : 'left'} the session.
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
