import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Backend returned HTTP ${res.status}`);
        }

        return res.json();
      })
      .then((result) => setData(result))
      .catch((err) => {
        console.error('API request failed:', err);
        setError(err.message);
      });
  }, []);

  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: '80px',
        fontFamily: 'Arial',
      }}
    >
      <h1>Private 3-Tier Application</h1>
      <h3>Frontend + Backend + RDS + Redis</h3>
      <hr />

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {data ? (
        <div>
          <p>
            <strong>Source:</strong> {data.source}
          </p>
          <pre>{JSON.stringify(data.data, null, 2)}</pre>
        </div>
      ) : (
        !error && <p>Loading data...</p>
      )}
    </div>
  );
}

export default App;