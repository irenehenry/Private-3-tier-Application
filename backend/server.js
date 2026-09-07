const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const port = 8080;

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Redis connection
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
});

redisClient.connect().catch(console.error);

app.get('/', (req, res) => {
  res.send('Backend is running successfully!');
});

app.get('/api/data', async (req, res) => {
  try {
    // First check Redis
    const cachedData = await redisClient.get('sample_data');
    
    if (cachedData) {
      return res.json({
        source: 'Redis Cache',
        data: JSON.parse(cachedData)
      });
    }

    // If not in Redis, get from RDS
    const result = await pool.query('SELECT NOW() as current_time');
    
    const data = {
      message: 'Data from RDS',
      time: result.rows[0].current_time
    };

    // Store in Redis for 60 seconds
    await redisClient.setEx('sample_data', 60, JSON.stringify(data));

    res.json({
      source: 'RDS Database',
      data: data
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});