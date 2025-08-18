import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrashIcon } from '@heroicons/react/24/solid'; // ícono de papelera

const TablaTotales = () => {
  const [resumenes, setResumenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchResumenes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/resumenes`);
        setResumenes(response.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los resumenes.');
      } finally {
        setLoading(false);
      }
    };
    fetchResumenes();
  }, [apiUrl]);

  // Función para eliminar
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este resumen?")) return;
    try {
      await axios.delete(`${apiUrl}/resumenes/${id}`);
      setResumenes(resumenes.filter(r => r.id !== id));
      alert("Resumen eliminado correctamente");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el resumen");
    }
  };

  // Totales generales
  const totales = {
    totalVentas: resumenes.reduce((sum, r) => sum + (Number(r.totalVentas) || 0), 0),
    totalCostos: resumenes.reduce((sum, r) => sum + (Number(r.totalCostos) || 0), 0),
    totalGanancia: resumenes.reduce((sum, r) => sum + (Number(r.ganancia) || 0), 0)
  };

  if (loading) return <div className="p-4 text-blue-600">Cargando resumenes...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!resumenes || resumenes.length === 0) return <div className="p-4 text-gray-600">No hay resumenes para mostrar.</div>;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4 text-blue-800">Tabla de Resumenes</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-3 border border-blue-700 text-left">Resumen</th>
              <th className="p-3 border border-blue-700 text-right">Total Ventas</th>
              <th className="p-3 border border-blue-700 text-right">Total Costos</th>
              <th className="p-3 border border-blue-700 text-right">Ganancia</th>
              <th className="p-3 border border-blue-700 text-center">Detalles</th>
              <th className="p-3 border border-blue-700 text-center">Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {resumenes.map((resumen) => (
              <React.Fragment key={resumen.id}>
                <tr className="hover:bg-blue-50 even:bg-gray-50">
                  <td className="p-3 border border-gray-200">{resumen.id}</td>
                  <td className="p-3 border border-gray-200 text-right font-mono">${resumen.totalVentas.toFixed(2)}</td>
                  <td className="p-3 border border-gray-200 text-right font-mono">${resumen.totalCostos.toFixed(2)}</td>
                  <td className={`p-3 border border-gray-200 text-right font-mono ${resumen.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${resumen.ganancia.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-200 text-center">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      onClick={() => setDetalleAbierto(detalleAbierto === resumen.id ? null : resumen.id)}
                    >
                      {detalleAbierto === resumen.id ? 'Ocultar' : 'Detalle'}
                    </button>
                  </td>
                  <td className="p-3 border border-gray-200 text-center">
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleEliminar(resumen.id)}
                    >
                      <TrashIcon className="w-5 h-5 inline-block" />
                    </button>
                  </td>
                </tr>

                {/* Fila de detalles */}
                {detalleAbierto === resumen.id && (
                  <tr className="bg-gray-100">
                    <td colSpan="6" className="p-3 border border-gray-200">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-300">
                            <th className="p-2 border">Pedido</th>
                            <th className="p-2 border">Cliente</th>
                            <th className="p-2 border text-right">Venta</th>
                            <th className="p-2 border text-right">Costo</th>
                            <th className="p-2 border text-right">Envío</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumen.detalles.map((detalle) => (
                            <tr key={detalle.id} className="even:bg-gray-50">
                              <td className="p-2 border">{detalle.pedido}</td>
                              <td className="p-2 border">{detalle.cliente}</td>
                              <td className="p-2 border text-right font-mono">${detalle.venta.toFixed(2)}</td>
                              <td className="p-2 border text-right font-mono">${detalle.costo.toFixed(2)}</td>
                              <td className="p-2 border text-right font-mono">${detalle.envio.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-100 font-semibold">
              <td className="p-3 border border-gray-300 text-left">Totales</td>
              <td className="p-3 border border-gray-300 text-right font-mono">${totales.totalVentas.toFixed(2)}</td>
              <td className="p-3 border border-gray-300 text-right font-mono">${totales.totalCostos.toFixed(2)}</td>
              <td className={`p-3 border border-gray-300 text-right font-mono ${totales.totalGanancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totales.totalGanancia.toFixed(2)}
              </td>
              <td className="p-3 border border-gray-300 text-center"></td>
              <td className="p-3 border border-gray-300 text-center"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TablaTotales;
