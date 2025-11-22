const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" } // for dev only
});

// Serve static files
app.use(express.static('public'));

// Socket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('send-message', (data) => {
    // Broadcast to everyone except sender
    socket.broadcast.emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// ====== LIVE NEWS FEED (SSE) ======
const clients = new Set();

// Simulated news sources & headlines (replace with real API later)
const sources = ['TechWire', 'Global News', 'DevDaily', 'StartupFeed'];
const headlines = [
  'AI model breaks new benchmark in reasoning',
  'Major security patch released for Node.js',
  'WebRTC adoption surges in chat apps',
  'GitHub announces new collaboration features',
  'Quantum computing startup raises $200M',
  'New WebSocket standard draft published',
];

// Generate random news
function generateNews() {
  return {
    headline: headlines[Math.floor(Math.random() * headlines.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    timestamp: Date.now()
  };
}

// SSE endpoint
app.get('/news-stream', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now() + Math.random();
  clients.add(res);

  // Send first update immediately
  const firstNews = generateNews();
  res.write(`data: ${JSON.stringify(firstNews)}\n\n`);

  // Handle disconnect
  req.on('close', () => {
    clients.delete(res);
    console.log(`Client ${clientId} disconnected. ${clients.size} remaining.`);
  });

  console.log(`Client ${clientId} connected. Total: ${clients.size}`);
});

// Broadcast news every 15 seconds
setInterval(() => {
  if (clients.size === 0) return;
  const news = generateNews();
  const payload = `data: ${JSON.stringify(news)}\n\n`;
  clients.forEach(client => {
    client.write(payload);
  });
}, 15000); // every 15 sec