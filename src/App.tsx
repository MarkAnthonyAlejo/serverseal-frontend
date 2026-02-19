import { useEffect, useState } from 'react'
import './App.css'
import type { Shipment } from './types';

function App() {
 const [shipments, setShipments] = useState<Shipment[]>([]);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  //Call Flask API
  fetch('http://localhost:5050/api/shipments')
    .then(res => {
      if(!res.ok) throw new Error('Failed to fetch shipments');
      return res.json();
    })
    .then(data => setShipments(data))
    .catch(err => setError(err.message));
 }, [])

  return (
   <>
    <div>
      <h1>ServerSeal Dashboard</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <ul>
        {shipments.map(s => (
          <li key={s.shipment_id}>
            <strong>{s.bol_number}</strong> - {s.status}
            <br /> From: {s.origin} To: {s.destination}
          </li>
        ))}
      </ul>
    </div>
   </>
  )
}

export default App
