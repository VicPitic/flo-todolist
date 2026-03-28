import cors from 'cors';
import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../db.json');

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

async function readDb() {
  const file = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(file);
}

async function writeDb(nextData) {
  await fs.writeFile(DB_PATH, `${JSON.stringify(nextData, null, 2)}\n`, 'utf8');
}

app.get('/api/tasks', async (_req, res) => {
  try {
    const db = await readDb();
    res.json(Array.isArray(db.tasks) ? db.tasks : []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to read tasks.' });
  }
});

app.post('/api/tasks', async (req, res) => {
  if (!Array.isArray(req.body)) {
    res.status(400).json({ message: 'Request body must be an array of tasks.' });
    return;
  }

  try {
    const db = await readDb();
    const nextDb = {
      ...db,
      tasks: req.body,
    };
    await writeDb(nextDb);
    res.json(nextDb.tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save tasks.' });
  }
});

app.get('/api/contacts', async (_req, res) => {
  try {
    const db = await readDb();
    res.json(Array.isArray(db.contacts) ? db.contacts : []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to read contacts.' });
  }
});

app.post('/api/contacts', async (req, res) => {
  if (!Array.isArray(req.body)) {
    res.status(400).json({ message: 'Request body must be an array of contacts.' });
    return;
  }

  try {
    const db = await readDb();
    const nextDb = {
      ...db,
      contacts: req.body,
    };
    await writeDb(nextDb);
    res.json(nextDb.contacts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save contacts.' });
  }
});

app.listen(PORT, () => {
  console.log(`Flo API running at http://localhost:${PORT}`);
});
