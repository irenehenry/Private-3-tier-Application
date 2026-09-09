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
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT || 6379),
  },
});

redisClient.on('error', (error) => {
  console.error('Redis Client Error:', error);
});

async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection failed:', error);
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
    if (redisClient.isReady) {
      const cachedData = await redisClient.get('sample_data');

      if (cachedData) {
        return res.json({
          source: 'Redis Cache',
          data: JSON.parse(cachedData),
        });
      }
    }

    const result = await pool.query(
      'SELECT NOW() AS current_time'
    );

    const data = {
      message: 'Data from RDS PostgreSQL',
      time: result.rows[0].current_time,
    };

    if (redisClient.isReady) {
      await redisClient.setEx(
        'sample_data',
        60,
        JSON.stringify(data)
      );
    }

    return res.json({
      source: 'RDS Database',
      data,
    });
  } catch (error) {
    console.error('API error:', error);

    return res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on port ${port}`);
});