const express = require('express');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;

const users = new Set();

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let username = 'Anonymous';

  const broadcastUsers = () => {
    const userList = Array.from(users);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'users', users: userList }));
      }
    });
  };

  const broadcastEvent = (eventType, username) => {
    const event = { type: 'event', eventType, username };
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  };

  ws.on('message', (msg) => {
    try {
      const message = JSON.parse(msg);

      if (message.type === 'join') {
        username = message.username;
        users.add(username);
        broadcastUsers();
        broadcastEvent('join', username);
      } else if (message.type === 'code') {
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'code', code: message.code }));
          }
        });
      }
    } catch {
      // fallback for plain text messages
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
    broadcastEvent('leave', username);
  });
});
