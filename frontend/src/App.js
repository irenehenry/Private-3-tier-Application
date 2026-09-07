import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'Arial' }}>
      <h1>Private 3-Tier Application</h1>
      <h3>Frontend + Backend + RDS + Redis</h3>
      <hr />
      {data ? (
        <div>
          <p><strong>Source:</strong> {data.source}</p>
          <pre>{JSON.stringify(data.data, null, 2)}</pre>
        </div>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
}

export default App;