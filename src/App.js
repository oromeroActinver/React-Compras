import React, { useState } from 'react';
import Login from './login';
import TablaPedidos from './components/TablaPedidos';

function Home({ apiUrl }) {  // Recibe apiUrl como prop
  return (
    <div>
      <TablaPedidos apiUrl={apiUrl} /> 
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL; // Obtiene la URL del .env

  
  return (
    <div className="App">
      {!token ? 
        <Login setToken={setToken} apiUrl={apiUrl} /> : 
        <Home apiUrl={apiUrl} />
      }
    </div>
  );
}

export default App;