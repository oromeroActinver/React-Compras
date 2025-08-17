import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TablaTotales = ({ impuestosProveedor }) => {
  const [resumenes, setResumenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="p-4 text-blue-600">Cargando resumenes...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!resumenes || resumenes.length === 0) return <div className="p-4 text-gray-600">No hay resumenes para mostrar.</div>;

  // Aplanar los detalles de cada resumen
  const datosGanancias = resumenes.flatMap(resumen =>
    resumen.detalles.map(detalle => {
      const costo = Number(detalle.venta) || 0;
      const costoCompra = Number(detalle.costo) || 0;
      const envio = Number(detalle.envio) || 0;

      // Total de compra general para calcular proporción de impuestos
      const totalCompraGeneral = resumen.detalles.reduce((sum, d) => sum + (Number(d.costo) || 0), 0);
      const porcentajeImpuestos = totalCompraGeneral > 0 ? (costoCompra / totalCompraGeneral) : 0;
      const impuestosAsignados = porcentajeImpuestos * (Number(impuestosProveedor) || 0);

      const costosTotalesProveedor = costoCompra + impuestosAsignados + envio;
      const ganancia = costo - costosTotalesProveedor;
      const margen = costosTotalesProveedor > 0 ? ((ganancia / costosTotalesProveedor) * 100) : 0;

      return {
        resumenId: resumen.id,
        cliente: detalle.cliente,
        pedido: detalle.pedido,
        costo,
        costoCompra,
        envio,
        impuestosAsignados,
        costosTotalesProveedor,
        ganancia,
        margen
      };
    })
  );

  // Totales generales
  const totales = {
    costo: datosGanancias.reduce((sum, d) => sum + d.costo, 0),
    costoCompra: datosGanancias.reduce((sum, d) => sum + d.costoCompra, 0),
    envio: datosGanancias.reduce((sum, d) => sum + d.envio, 0),
    impuestos: Number(impuestosProveedor) || 0,
    ganancia: datosGanancias.reduce((sum, d) => sum + d.ganancia, 0)
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4 text-blue-800">Tabla de Ganancias</h3>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="flex justify-between font-semibold">
              <span>Total Ventas:</span>
              <span className="font-mono">${totales.costo.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="flex justify-between font-semibold">
              <span>Total Costos:</span>
              <span className="font-mono">${(totales.costoCompra + totales.impuestos).toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="flex justify-between font-semibold text-green-600">
              <span>Ganancia Total:</span>
              <span className="font-mono">${totales.ganancia.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-3 border border-blue-700 text-left">Resumen</th>
                <th className="p-3 border border-blue-700 text-left">Cliente</th>
                <th className="p-3 border border-blue-700 text-left">Pedido</th>
                <th className="p-3 border border-blue-700 text-right">Venta</th>
                <th className="p-3 border border-blue-700 text-right">Costo Compra</th>
                <th className="p-3 border border-blue-700 text-right">Impuestos</th>
                <th className="p-3 border border-blue-700 text-right">Envío</th>
                <th className="p-3 border border-blue-700 text-right">Ganancia</th>
                <th className="p-3 border border-blue-700 text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              {datosGanancias.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50 even:bg-gray-50">
                  <td className="p-3 border border-gray-200">{item.resumenId}</td>
                  <td className="p-3 border border-gray-200 truncate max-w-xs">{item.cliente}</td>
                  <td className="p-3 border border-gray-200 truncate max-w-xs">{item.pedido}</td>
                  <td className="p-3 border border-gray-200 text-right font-mono">${item.costo.toFixed(2)}</td>
                  <td className="p-3 border border-gray-200 text-right font-mono">${item.costoCompra.toFixed(2)}</td>
                  <td className="p-3 border border-gray-200 text-right font-mono">${item.impuestosAsignados.toFixed(2)}</td>
                  <td className="p-3 border border-gray-200 text-right font-mono">${item.envio.toFixed(2)}</td>
                  <td className={`p-3 border border-gray-200 text-right font-mono ${item.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${item.ganancia.toFixed(2)}
                  </td>
                  <td className={`p-3 border border-gray-200 text-right font-mono ${item.margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.margen.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-100 font-semibold">
                <td className="p-3 border border-gray-300 text-left" colSpan="3">Totales</td>
                <td className="p-3 border border-gray-300 text-right font-mono">${totales.costo.toFixed(2)}</td>
                <td className="p-3 border border-gray-300 text-right font-mono">${totales.costoCompra.toFixed(2)}</td>
                <td className="p-3 border border-gray-300 text-right font-mono">${totales.impuestos.toFixed(2)}</td>
                <td className="p-3 border border-gray-300 text-right font-mono">${totales.envio.toFixed(2)}</td>
                <td className="p-3 border border-gray-300 text-right font-mono ${totales.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}">${totales.ganancia.toFixed(2)}</td>
                <td className="p-3 border border-gray-300 text-right font-mono ${totales.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}">
                  {((totales.ganancia / (totales.costoCompra + totales.impuestos)) * 100 || 0).toFixed(2)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TablaTotales;
