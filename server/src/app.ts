import express from 'express';
import http from 'http';
import cors from 'cors';
import { environment } from './config/environment';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

server.listen(environment.serverPort, '0.0.0.0', () => {
  console.log(`Server running on port ${environment.serverPort} [${environment.nodeEnv}]`);
});
