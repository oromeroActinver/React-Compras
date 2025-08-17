import React, { useState } from 'react';
import Login from './login';
import TablaPedidos from './components/TablaPedidos';
import TablaTotales from './components/TablaTotales'; // Asegúrate de crear este componente

function Home({ apiUrl }) {
  const [activeTab, setActiveTab] = useState('pedidos'); // Estado para controlar la pestaña activa

  return (
    <div>
      {/* Menú de navegación */}
      <nav className="bg-blue-600 p-4 shadow-md">
        <div className="container mx-auto flex justify-start">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`px-4 py-2 mr-2 rounded-md font-medium ${
              activeTab === 'pedidos' 
                ? 'bg-white text-blue-600' 
                : 'text-white hover:bg-blue-500'
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('totales')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'totales' 
                ? 'bg-white text-blue-600' 
                : 'text-white hover:bg-blue-500'
            }`}
          >
            Totales
          </button>
        </div>
      </nav>

      {/* Contenido según pestaña seleccionada */}
      <div className="container mx-auto p-4">
        {activeTab === 'pedidos' ? (
          <TablaPedidos apiUrl={apiUrl} />
        ) : (
          <TablaTotales apiUrl={apiUrl} />
        )}
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;

  return (
    <div className="App">
      {!token ? (
        <Login setToken={setToken} apiUrl={apiUrl} />
      ) : (
        <Home apiUrl={apiUrl} />
      )}
    </div>
  );
}

export default App;