const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const port = 8080;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  port: Number(process.env.DB_PORT || 5432),
});

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
    keepAlive: true,
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        console.error('Redis: Too many retries, stopping reconnection');
        return new Error('Redis connection failed permanently');
      }
      // Exponential backoff (max 3 seconds)
      return Math.min(retries * 200, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => console.log('Redis connecting...'));
redisClient.on('ready', () => console.log('Redis connected and ready!'));
redisClient.on('reconnecting', () => console.log('Redis reconnecting...'));

async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Redis connection failed:', error.message);
  }
}

connectRedis();

app.get('/', (req, res) => {
  res.status(200).send('Backend is running successfully!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'backend',
  });
});

app.get('/api/data', async (req, res) => {
  try {
    // Try Redis first (only if connected)
    if (redisClient.isReady) {
      try {
        const cachedData = await redisClient.get('sample_data');
        if (cachedData) {
          return res.json({
            source: 'Redis Cache',
            data: JSON.parse(cachedData),
          });
        }
      } catch (redisErr) {
        console.warn('Redis read failed, falling back to RDS:', redisErr.message);
      }
    }

    // Fallback to RDS
    const result = await pool.query('SELECT NOW() AS current_time');

    const data = {
      message: 'Data from RDS PostgreSQL',
      time: result.rows[0].current_time,
    };

    // Try to cache in Redis (ignore if Redis is down)
    if (redisClient.isReady) {
      try {
        await redisClient.setEx('sample_data', 60, JSON.stringify(data));
      } catch (err) {
        console.warn('Failed to cache in Redis:', err.message);
      }
    }

    return res.json({
      source: 'RDS Database',
      data,
    });

  } catch (error) {
    console.error('API error:', error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
});

// Start the server

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on port ${port}`);
});