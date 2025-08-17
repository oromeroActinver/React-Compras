import React, { useState, useEffect, useMemo } from 'react';
import { useCallback } from 'react';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

const TablaPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [nuevoPedido, setNuevoPedido] = useState({
    pedido: '',
    cliente: '',
    tienda: '',
    descripcion: '',
    estado: '',
    costo: 0,
    envio: 0,
    costo_compra: 0
  });
  const [editandoId, setEditandoId] = useState(null);
  const [comision, setComision] = useState(0);
  const [impuestosImportacionCliente, setImpuestosImportacionCliente] = useState(0);
  const [impuestosImportacionProveedor, setImpuestosImportacionProveedor] = useState(0);
  const [abono, setAbono] = useState(0);
  const [descuentos, setDescuentos] = useState(0);
  const [envio] = useState(0);
  const [columnFilters, setColumnFilters] = useState([]);
  const [historialGuardado, setHistorialGuardado] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL;

  const fetchPedidos = useCallback(async () => {
    const res = await fetch(`${apiUrl}/pedidos`);
    const data = await res.json();

    const pedidosNormalizados = data.map((p) => ({
      ...p,
      costo: parseFloat(p.costo) || 0,
      envio: parseFloat(p.envio) || 0,
      costo_compra: parseFloat(p.costo_compra) || 0,
    }));

    setPedidos(pedidosNormalizados);
  }, [apiUrl]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const handleChange = (e) => {
    setNuevoPedido({ ...nuevoPedido, [e.target.name]: e.target.value });
  };

  const handleAgregar = async () => {
    await fetch(`${apiUrl}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...nuevoPedido,
        costo: parseFloat(nuevoPedido.costo) || 0,
        envio: parseFloat(nuevoPedido.envio) || 0,
        costo_compra: parseFloat(nuevoPedido.costo_compra) || 0
      }),
    });
    setNuevoPedido({
      pedido: '',
      cliente: '',
      tienda: '',
      descripcion: '',
      estado: '',
      costo: 0,
      envio: 0,
      costo_compra: 0
    });
    fetchPedidos();
  };

  const handleEliminar = useCallback(async (id) => {
    await fetch(`${apiUrl}/pedidos/${id}`, { method: 'DELETE' });
    fetchPedidos();
  }, [apiUrl, fetchPedidos]);

  const handleEditar = useCallback((pedido) => {
    setEditandoId(pedido.id);
    setNuevoPedido(pedido);
  }, []);

  const handleActualizar = async () => {
    await fetch(`${apiUrl}/pedidos/${editandoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...nuevoPedido,
        costo: parseFloat(nuevoPedido.costo) || 0,
        envio: parseFloat(nuevoPedido.envio) || 0,
        costo_compra: parseFloat(nuevoPedido.costo_compra) || 0
      }),
    });
    setNuevoPedido({
      pedido: '',
      cliente: '',
      tienda: '',
      descripcion: '',
      estado: '',
      costo: 0,
      envio: 0,
      costo_compra: 0
    });
    setEditandoId(null);
    fetchPedidos();
  };

  const columns = useMemo(() => [
    { accessorKey: 'pedido', header: 'Pedido' },
    { accessorKey: 'cliente', header: 'Cliente' },
    { accessorKey: 'tienda', header: 'Tienda' },
    { accessorKey: 'descripcion', header: 'Descripción' },
    { accessorKey: 'estado', header: 'Estado' },
    {
      accessorKey: 'costo',
      header: 'Costo',
      cell: ({ getValue }) => `$${parseFloat(getValue()).toFixed(2)}`
    },
    {
      accessorKey: 'envio',
      header: 'Envío',
      cell: ({ getValue }) => `$${parseFloat(getValue() || 0).toFixed(2)}`
    },
    {
      accessorKey: 'costo_compra',
      header: 'Costo de Compra',
      cell: ({ getValue }) => `$${parseFloat(getValue() || 0).toFixed(2)}`
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button className="text-blue-600" onClick={() => handleEditar(row.original)}>Editar</button>
          <button className="text-red-600" onClick={() => handleEliminar(row.original.id)}>Eliminar</button>
        </div>
      )
    }
  ], [handleEditar, handleEliminar]);

  const table = useReactTable({
    data: pedidos,
    columns,
    state: {
      globalFilter,
      columnFilters
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const filteredRows = table.getRowModel().rows;

  const totalCostoFiltrado = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + (Number(row.original.costo) || 0), 0);
  }, [filteredRows]);

  const totalEnvios = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + (Number(row.original.envio) || 0), 0);
  }, [filteredRows]);

  const totalCostoCompra = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + (Number(row.original.costo_compra) || 0), 0);
  }, [filteredRows]);

  const totalConComisionEImpuestos = useMemo(() => {
    return totalCostoFiltrado +
      (Number(comision) || 0) +
      (Number(impuestosImportacionCliente) || 0) +
      totalEnvios +
      (Number(envio) || 0);
  }, [totalCostoFiltrado, comision, impuestosImportacionCliente, totalEnvios, envio]);

  const totalConCostosProveedor = useMemo(() => {
    return totalCostoCompra +
      (Number(impuestosImportacionProveedor) || 0) +
      totalEnvios;
  }, [totalCostoCompra, impuestosImportacionProveedor, totalEnvios]);

  const totalFinal = useMemo(() => {
    return totalConComisionEImpuestos - (Number(abono) || 0) -
      (Number(descuentos) || 0);
  }, [totalConComisionEImpuestos, abono, descuentos]);

  const guardarResumen = async () => {
    const resumen = {
      fecha: new Date().toISOString(),
      totalVentas: totalConComisionEImpuestos,
      totalCostos: totalConCostosProveedor,
      ganancia: totalFinal - totalConCostosProveedor,
      comision,
      impuestosCliente: impuestosImportacionCliente,
      impuestosProveedor: impuestosImportacionProveedor,
      abono,
      descuentos,
      detalles: filteredRows.map(row => ({
        pedido: row.original.pedido,
        cliente: row.original.cliente,
        venta: Number(row.original.costo) || 0,       // venta del detalle
        costo: Number(row.original.costo_compra) || 0, // costo del detalle
        envio: Number(row.original.envio) || 0       // envío del detalle
      }))
    };

    try {
      // Guardar en la API
      const response = await fetch(`${apiUrl}/resumenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumen)
      });

      if (response.ok) {
        alert("Resumen guardado correctamente");
        // Actualizar el historial local con el resumen recién guardado
        setHistorialGuardado(prev => [...prev, resumen]);
      } else {
        const errorData = await response.json();
        console.error("Error guardando resumen:", errorData);
        alert("No se pudo guardar el resumen. Revisa la consola.");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Ocurrió un error al guardar el resumen.");
    }
  };


  const generarTicket = () => {
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();

    let ticketContent = `
*🏷️ TICKET DE COMPRA 🏷️*
*📅 Fecha:* ${fecha} ⏰ ${hora}

*📦 ARTÍCULOS:*
${filteredRows.map((row, index) =>
      `${index + 1}. ${row.original.descripcion || 'Artículo sin descripción'} 
   → Tienda: ${row.original.tienda || 'Sin tienda'} 
   → Costo: $${parseFloat(row.original.costo).toFixed(2)}
   → Envío: $${parseFloat(row.original.envio || 0).toFixed(2)}`
    ).join('\n\n')}

*💰 TOTALES:*
➖ Subtotal: $${totalCostoFiltrado.toFixed(2)}
➕ Comisión: $${comision.toFixed(2)}
➕ Impuestos: $${impuestosImportacionCliente.toFixed(2)}
${totalEnvios > 0 ? `➕ Total Envíos: $${totalEnvios.toFixed(2)}` : '➕ Envío: GRATIS'}
➖ Abono: $${abono.toFixed(2)}
➖ Descuentos y Cupones: $${(descuentos || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━
💵 *TOTAL FINAL: $${totalFinal.toFixed(2)}*

Mi cuenta BBVA: 
Cuenta CLABE: 012 180 01523123878 0

¡Gracias por su preferencia! 🎉`;

    const encodedContent = encodeURIComponent(ticketContent);
    const whatsappUrl = `https://wa.me/?text=${encodedContent}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Pedidos</h2>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-lg mt-2 font-semibold text-blue-800">
          {editandoId ? 'Editar Pedido' : 'Agregar Pedido'}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
          {['pedido', 'cliente', 'tienda', 'descripcion', 'estado'].map((campo) => (
            <input
              key={campo}
              name={campo}
              value={nuevoPedido[campo] || ''}
              onChange={handleChange}
              placeholder={campo.charAt(0).toUpperCase() + campo.slice(1)}
              className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ))}

          <input
            name="costo"
            type="number"
            step="0.01"
            value={nuevoPedido.costo || ''}
            onChange={handleChange}
            placeholder="Costo"
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <input
            name="envio"
            type="number"
            step="0.01"
            value={nuevoPedido.envio || ''}
            onChange={handleChange}
            placeholder="Envío"
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <input
            name="costo_compra"
            type="number"
            step="0.01"
            value={nuevoPedido.costo_compra || ''}
            onChange={handleChange}
            placeholder="Costo de Compra"
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={editandoId ? handleActualizar : handleAgregar}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition duration-200"
          >
            {editandoId ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      </div>


      {/* Reemplaza la sección actual de la tabla principal con esto: */}

      <div className="mb-8">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar en la tabla..."
          className="mb-4 p-2 border rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  {table.getHeaderGroups()[0].headers.map(header => (
                    <th
                      key={header.id}
                      className="p-3 border border-blue-700 text-left cursor-pointer hover:bg-blue-700"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center justify-between">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
                <tr className="bg-blue-500 text-white">
                  {table.getHeaderGroups()[0].headers.map(header => {
                    const columnId = header.column.id;
                    const canFilter = ['pedido', 'cliente', 'tienda', 'estado'].includes(columnId);

                    return (
                      <th key={header.id} className="p-2 border border-blue-600">
                        {canFilter && (
                          <input
                            type="text"
                            value={header.column.getFilterValue() ?? ''}
                            onChange={(e) => header.column.setFilterValue(e.target.value)}
                            placeholder={`Filtrar ${header.column.columnDef.header}`}
                            className="w-full px-2 py-1 text-sm border rounded bg-blue-50 text-blue-900"
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="max-h-96 overflow-y-auto">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-blue-50 even:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-3 border border-gray-200">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Resumen original (izquierda) */}
        <div className="p-4 bg-blue-50 rounded shadow-md border border-blue-100">
          <h3 className="font-bold text-lg mb-3 text-blue-800">Resumen Cliente</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold">Subtotal:</label>
              <span>${totalCostoFiltrado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Comisión:</label>
              <div className="flex items-center">
                <span className="mr-1">$</span>
                <input
                  type="number"
                  value={comision}
                  onChange={(e) => setComision(Number(e.target.value) || 0)}
                  className="border rounded p-1 w-24 text-right focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Impuestos de importación (Cliente):</label>
              <div className="flex items-center">
                <span className="mr-1">$</span>
                <input
                  type="number"
                  value={impuestosImportacionCliente}
                  onChange={(e) => setImpuestosImportacionCliente(Number(e.target.value) || 0)}
                  className="border rounded p-1 w-24 text-right focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Total Envíos:</label>
              <div className="flex items-center">
                <span className="mr-1">$</span>
                <span className="border rounded p-1 w-24 text-right bg-white">
                  {totalEnvios.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center font-semibold border-t pt-2 text-blue-800">
              <label>Total + Comisión + Impuestos:</label>
              <span>${totalConComisionEImpuestos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Abono:</label>
              <div className="flex items-center">
                <span className="mr-1">$</span>
                <input
                  type="number"
                  value={abono}
                  onChange={(e) => setAbono(Number(e.target.value) || 0)}
                  className="border rounded p-1 w-24 text-right focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Descuentos y Cupones:</label>
              <div className="flex items-center">
                <span className="mr-1">$</span>
                <input
                  type="number"
                  value={descuentos}
                  onChange={(e) => setDescuentos(Number(e.target.value) || 0)}
                  className="border rounded p-1 w-24 text-right focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between items-center font-bold border-t pt-2 mt-2 text-lg text-blue-800">
              <label>Total Final (Cliente):</label>
              <span>${totalFinal.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={generarTicket}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition duration-200 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Generar Ticket para WhatsApp
          </button>
        </div>

        {/* Resumen centro (costo compra) */}
        <div className="p-4 bg-blue-50 rounded shadow-md border border-blue-100">
          <h3 className="font-bold text-lg mb-3 text-blue-800">Resumen Proveedor</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold">Subtotal (Costo Compra):</label>
              <span>${totalCostoCompra.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Impuestos de importación (Proveedor):</label>
              <div className="flex items-center">
                <span className="mr-1">$</span>
                <input
                  type="number"
                  value={impuestosImportacionProveedor}
                  onChange={(e) => setImpuestosImportacionProveedor(Number(e.target.value) || 0)}
                  className="border rounded p-1 w-24 text-right focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="font-semibold">Total Envíos:</label>
              <span>${totalEnvios.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center font-bold border-t pt-2 mt-2 text-blue-800">
              <label>Total Final (Proveedor):</label>
              <span>${totalConCostosProveedor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-bold border-t pt-2 mt-2 text-lg text-green-600">
              <label>Ganancia:</label>
              <span>${(totalFinal - totalConCostosProveedor).toFixed(2)}</span>
            </div>
            <button
              onClick={guardarResumen}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition duration-200"
            >
              Guardar Resumen
            </button>
          </div>
        </div>


      </div>

      {/* Nueva sección derecha (distribución impuestos) */}
      <div className="p-4 bg-blue-50 rounded shadow-md flex-1 min-w-0 border border-blue-100">
        <h3 className="font-bold text-lg mb-3 text-blue-800">Distribución de Impuestos</h3>

        <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center p-2 bg-white rounded border border-blue-200">
            <label className="font-semibold">Total Impuestos:</label>
            <span className="font-mono">${impuestosImportacionProveedor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded border border-blue-200">
            <label className="font-semibold">Total Costo Compra:</label>
            <span className="font-mono">${filteredRows.reduce((sum, row) => sum + (Number(row.original.costo_compra) || 0), 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white sticky top-0">
                <th className="p-3 border border-blue-700 text-left w-2/5">Producto</th>
                <th className="p-3 border border-blue-700 text-right">Costo</th>
                <th className="p-3 border border-blue-700 text-right">%</th>
                <th className="p-3 border border-blue-700 text-right">Impuesto</th>
                <th className="p-3 border border-blue-700 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const costo = Number(row.original.costo_compra) || 0;
                const totalCompra = filteredRows.reduce((sum, r) => sum + (Number(r.original.costo_compra) || 0), 0);
                const porcentaje = totalCompra > 0 ? (costo / totalCompra) * 100 : 0;
                const impuestoAsignado = (porcentaje / 100) * (Number(impuestosImportacionProveedor) || 0);

                return (
                  <tr key={row.id} className="hover:bg-blue-50 even:bg-gray-50">
                    <td className="p-3 border border-gray-200 text-left truncate max-w-xs" title={row.original.descripcion}>
                      {row.original.descripcion || 'Sin nombre'}
                    </td>
                    <td className="p-3 border border-gray-200 text-right font-mono">${costo.toFixed(2)}</td>
                    <td className="p-3 border border-gray-200 text-right font-mono">{porcentaje.toFixed(2)}%</td>
                    <td className="p-3 border border-gray-200 text-right font-mono">${impuestoAsignado.toFixed(2)}</td>
                    <td className="p-3 border border-gray-200 text-right font-mono">${(costo + impuestoAsignado).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 pt-2 border-t border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="flex justify-between font-semibold">
              <span>Total asignado:</span>
              <span className="font-mono">${filteredRows.reduce((sum, row) => {
                const costo = Number(row.original.costo_compra) || 0;
                const totalCompra = filteredRows.reduce((s, r) => s + (Number(r.original.costo_compra) || 0), 0);
                const porcentaje = totalCompra > 0 ? (costo / totalCompra) : 0;
                return sum + (porcentaje * (Number(impuestosImportacionProveedor) || 0));
              }, 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Diferencia:</span>
              <span className="font-mono">${(impuestosImportacionProveedor - filteredRows.reduce((sum, row) => {
                const costo = Number(row.original.costo_compra) || 0;
                const totalCompra = filteredRows.reduce((s, r) => s + (Number(r.original.costo_compra) || 0), 0);
                const porcentaje = totalCompra > 0 ? (costo / totalCompra) : 0;
                return sum + (porcentaje * (Number(impuestosImportacionProveedor) || 0));
              }, 0)).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="flex justify-between font-semibold">
              <span>Total Costo + Impuestos:</span>
              <span className="font-mono">${(filteredRows.reduce((sum, row) => sum + (Number(row.original.costo_compra) || 0), 0) + (Number(impuestosImportacionProveedor) || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default TablaPedidos;