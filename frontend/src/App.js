import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const codeRef = useRef('');
  const ws = useRef(null);

  useEffect(() => {
    if (!username) {
  const inputName = prompt("Enter your username:", `User${Math.floor(Math.random() * 1000)}`);
  setUsername(inputName || `User${Math.floor(Math.random() * 1000)}`);
  return null; // Render nothing until username is set
  }
  }, [username]);

  useEffect(() => {
    if (!username) return;

    ws.current = new WebSocket('ws://localhost:3000');
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: 'join', username }));
    };
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'users') {
        setUsers(message.users);
      } else if (message.type === 'code') {
        if (message.code !== codeRef.current) {
          setCode(message.code);
        }
      }
    };
    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };
    return () => {
      ws.current.close();
    };
  }, [username]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const handleEditorChange = (value) => {
    setCode(value);
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'code', code: value }));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Real-Time Collaborative Code Editor</h2>
      <div style={{ marginBottom: '12px' }}>
        <strong>Logged in as:</strong> {username}
      </div>
      <div style={{ marginBottom: '12px' }}>
        <strong>Connected users:</strong> {users.join(', ')}
      </div>
      <select value={language} onChange={e => setLanguage(e.target.value)} style={{ marginBottom: '12px' }}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
      </select>
      <MonacoEditor
        height="500px"
        language={language}
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          fontSize: 16,
          fontFamily: 'monospace',
          minimap: { enabled: false }
        }}
      />
    </div>
  );
}

export default App;
