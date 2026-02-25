process.removeAllListeners('warning');

import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();
const PORT = process.env.PORT || 3000;

app.get('/', (c) => c.json({ name: 'Roni', status: 'running' }));

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Roni OS listening on port ${PORT}`);
});

process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled:', reason));