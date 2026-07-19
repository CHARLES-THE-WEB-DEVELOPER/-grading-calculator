const cluster = require('cluster');
const os = require('os');
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ===== CLUSTERING FOR SCALABILITY =====
const numCPUs = os.cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  console.log(`Master process ${process.pid} spawning ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  app.use(helmet());
  app.use(compression());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  const cors = require('cors');
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    maxAge: 3600,
  }));

  const cache = new Map();
  const CACHE_TTL = 60000;

  function getCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
    if (cache.size > 10000) {
      for (const [k, v] of cache.entries()) {
        if (Date.now() - v.timestamp > CACHE_TTL) {
          cache.delete(k);
        }
      }
    }
  }

  const institutions = [
    {
      id: 'uni-a',
      name: 'University A',
      scale: [
        { min: 70, max: 100, grade: 'A', gp: 4.0, class: 'First Class' },
        { min: 60, max: 69, grade: 'B', gp: 3.0, class: 'Second Class (Upper)' },
        { min: 50, max: 59, grade: 'C', gp: 2.0, class: 'Second Class (Lower)' },
        { min: 40, max: 49, grade: 'D', gp: 1.0, class: 'Pass' },
        { min: 0, max: 39, grade: 'F', gp: 0.0, class: 'Fail' },
      ],
    },
    {
      id: 'uni-b',
      name: 'University B',
      scale: [
        { min: 80, max: 100, grade: 'A', gp: 4.0, class: 'First Class' },
        { min: 70, max: 79, grade: 'B', gp: 3.0, class: 'Second Class (Upper)' },
        { min: 60, max: 69, grade: 'C', gp: 2.0, class: 'Second Class (Lower)' },
        { min: 50, max: 59, grade: 'D', gp: 1.0, class: 'Pass' },
        { min: 0, max: 49, grade: 'F', gp: 0.0, class: 'Fail' },
      ],
    },
  ];

  function findScaleById(id) {
    return institutions.find((i) => i.id === id)?.scale || institutions[0].scale;
  }

  function scoreToGP(score, scale) {
    const rule = scale.find((r) => score >= r.min && score <= r.max);
    return rule ? rule.gp : 0.0;
  }

  function getGrade(gp) {
    if (gp >= 3.5) return 'A';
    if (gp >= 3.0) return 'B';
    if (gp >= 2.0) return 'C';
    if (gp >= 1.0) return 'D';
    return 'F';
  }

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', worker: process.pid });
  });

  app.get('/api/institutions', (req, res) => {
    res.json(institutions.map((i) => ({ id: i.id, name: i.name })));
  });

  app.post('/api/calculate/gpa', (req, res) => {
    try {
      const { courses, institutionId } = req.body;

      if (!Array.isArray(courses) || courses.length === 0) {
        return res.status(400).json({ error: 'Courses required' });
      }

      const cacheKey = `gpa:${institutionId}:${JSON.stringify(courses)}`;
      let result = getCache(cacheKey);

      if (!result) {
        const scale = findScaleById(institutionId);
        let totalCredits = 0;
        let totalPoints = 0;

        for (const c of courses) {
          const score = Math.max(0, Math.min(100, Number(c.score) || 0));
          const credits = Math.max(0, Number(c.credits) || 0);
          const gp = scoreToGP(score, scale);
          totalCredits += credits;
          totalPoints += gp * credits;
        }

        const gpa = totalCredits ? totalPoints / totalCredits : 0;
        result = {
          gpa: Number(gpa.toFixed(2)),
          totalCredits,
          grade: getGrade(gpa),
          status: gpa >= 2.0 ? 'Pass' : 'Fail',
        };

        setCache(cacheKey, result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Calculation failed' });
    }
  });

  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: false,
  }));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  });
}
