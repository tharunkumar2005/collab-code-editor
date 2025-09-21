const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = 4000;
const users = new Set();


// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Set up WebSocket server on the same HTTP server
// filepath: e:\collab-code-editor\backend\index.js

const wss = new WebSocket.Server({ server, path: '/ws' });


wss.on('connection', (ws) => {
  let username = 'Anonymous';

  ws.on('message', (msg) => {
    try {
      const message = JSON.parse(msg);

      if (message.type === 'join') {
        username = message.username;
        users.add(username);
        // Broadcast user list to all clients
        broadcastUsers();
      } else if (message.type === 'code') {
        // Broadcast code edit to all others
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'code', code: message.code }));
          }
        });
      }
    } catch {
      // fallback for plain code (older clients)
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }
  });

  ws.on('close', () => {
    users.delete(username);
    broadcastUsers();
  });

  function broadcastUsers() {
    const userList = Array.from(users);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'users', users: userList }));
      }
    });
  }
});
