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
    costo: 0,      // Cambiado de '' a 0
    envio: 0,      // Cambiado de '' a 0
    costo_compra: 0 // Cambiado de '' a 0
  });
  const [editandoId, setEditandoId] = useState(null);
  const [comision, setComision] = useState(0);
  const [impuestosImportacion, setImpuestosImportacion] = useState(0);
  const [abono, setAbono] = useState(0);
  const [descuentos, setDescuentos] = useState(0);
  const [envio] = useState(0);
  const [columnFilters, setColumnFilters] = useState([]);
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
        envio: parseFloat(nuevoPedido.envio) || 0,  // Asegúrate de enviar este campo
        costo_compra: parseFloat(nuevoPedido.costo_compra) || 0  // Asegúrate de enviar este campo
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
      accessorKey: 'costo_compra',  // Cambiado de 'costoCompra' a 'costo_compra'
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


  const totalConComisionEImpuestos = useMemo(() => {
    return totalCostoFiltrado +
      (Number(comision) || 0) +
      (Number(impuestosImportacion) || 0) +
      totalEnvios +
      (Number(envio) || 0); // Envío adicional manual
  }, [totalCostoFiltrado, comision, impuestosImportacion, totalEnvios, envio]);

  const totalFinal = useMemo(() => {
    return totalConComisionEImpuestos - (Number(abono) || 0);
  }, [totalConComisionEImpuestos, abono]);

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
➕ Impuestos: $${impuestosImportacion.toFixed(2)}
${totalEnvios > 0 ? `➕ Total Envíos: $${totalEnvios.toFixed(2)}` : '➕ Envío: GRATIS'}
➖ Abono: $${abono.toFixed(2)}
━━━━━━━━━━━━━━━━━━
💵 *TOTAL FINAL: $${totalFinal.toFixed(2)}*

*📲 Datos de contacto:*
📧 Email: 
  romeromaciasorlando@gmail.com
  nayegonza0130@gmail.com
📞 Teléfono: 
  +56 3878 3228
  +241 279 0692

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

      <input
        type="text"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Buscar en la tabla..."
        className="mb-4 p-2 border rounded w-full"
      />

      <table className="min-w-full border-collapse border border-gray-300 rounded-lg shadow-lg text-sm">
        <thead className="bg-gray-200 text-gray-700 font-semibold">
          {table.getHeaderGroups().map((headerGroup) => (
            <React.Fragment key={headerGroup.id}>
              <tr>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 border text-left cursor-pointer hover:bg-gray-300 transition"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && ' 🔼'}
                    {header.column.getIsSorted() === 'desc' && ' 🔽'}
                  </th>
                ))}
              </tr>

              <tr>
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;
                  const canFilter = ['pedido', 'cliente', 'tienda', 'estado'].includes(columnId);

                  return (
                    <th key={header.id} className="px-2 py-1 border">
                      {canFilter ? (
                        <input
                          type="text"
                          value={header.column.getFilterValue() ?? ''}
                          onChange={(e) => header.column.setFilterValue(e.target.value)}
                          placeholder={`Filtrar...`}
                          className="w-full px-1 py-1 text-sm border rounded"
                        />
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </React.Fragment>
          ))}
        </thead>

        <tbody className="text-gray-700">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 border">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between items-center">
        <div>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Siguiente
          </button>
        </div>
      </div>


      <div className="flex flex-wrap gap-4 mt-4 w-full">
        {/* Resumen original (izquierda) */}
        <div className="p-4 bg-gray-100 rounded shadow-md w-80 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Subtotal:</label>
            <span>${totalCostoFiltrado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Comisión:</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <input
                type="number"
                value={comision}
                onChange={(e) => setComision(Number(e.target.value) || 0)}
                className="border rounded p-1 w-24 text-right"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Impuestos de importación:</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <input
                type="number"
                value={impuestosImportacion}
                onChange={(e) => setImpuestosImportacion(Number(e.target.value) || 0)}
                className="border rounded p-1 w-24 text-right"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Total Envíos:</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <span className="border rounded p-1 w-24 text-right bg-white">
                {totalEnvios.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-2 font-semibold border-t pt-2">
            <label>Total + Comisión + Impuestos:</label>
            <span>${totalConComisionEImpuestos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Abono:</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <input
                type="number"
                value={abono}
                onChange={(e) => setAbono(Number(e.target.value) || 0)}
                className="border rounded p-1 w-24 text-right"
              />
            </div>
          </div>
          <div className="flex justify-between items-center font-bold border-t pt-2 mt-2">
            <label>Total Final:</label>
            <span>${totalFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* Resumen centro (costo compra) */}
        <div className="p-4 bg-gray-100 rounded shadow-md w-80 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Subtotal (Costo Compra):</label>
            <span>${filteredRows.reduce((sum, row) => sum + (Number(row.original.costo_compra) || 0), 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Impuestos de importación:</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <input
                type="number"
                value={impuestosImportacion}
                onChange={(e) => setImpuestosImportacion(Number(e.target.value) || 0)}
                className="border rounded p-1 w-24 text-right"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Total Envíos:</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <span className="border rounded p-1 w-24 text-right bg-white">
                {totalEnvios.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Descuentos y Cupones:</label>
            <div className="flex items-center">
              <span className="mr-1">$</span>
              <input
                type="number"
                value={descuentos}
                onChange={(e) => setDescuentos(Number(e.target.value) || 0)}
                className="border rounded p-1 w-24 text-right"
              />
            </div>
          </div>
          <div className="flex justify-between items-center font-bold border-t pt-2 mt-2">
            <label>Total Final:</label>
            <span>${(filteredRows.reduce((sum, row) => sum + (Number(row.original.costo_compra) || 0), 0) +
              (Number(impuestosImportacion) || 0) +
              totalEnvios -
              (Number(descuentos) || 0)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center font-bold border-t pt-2 mt-2 text-green-600">
            <label>Ganancia:</label>
            <span>
              ${(totalFinal -
                (filteredRows.reduce((sum, row) => sum + (Number(row.original.costo_compra) || 0), 0)) +
                (Number(impuestosImportacion) || 0) +
                totalEnvios -
                (Number(descuentos) || 0)).toFixed(2)}
            </span>
          </div>
          <button
            onClick={generarTicket}
            className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Generar Ticket para WhatsApp
          </button>
        </div>

        {/* Nueva sección derecha (distribución impuestos) */}
        <div className="p-4 bg-gray-100 rounded shadow-md flex-grow min-w-0">
          <h3 className="font-bold text-lg mb-3">Distribución de Impuestos</h3>

          <div className="mb-3 grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <label className="font-semibold">Total Impuestos:</label>
              <span className="font-mono">${impuestosImportacion.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <label className="font-semibold">Total Costo Compra:</label>
              <span className="font-mono">${filteredRows.reduce((sum, row) => sum + (Number(row.original.costo_compra) || 0), 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 sticky top-0">
                  <th className="p-3 border text-left w-2/5">Producto</th>
                  <th className="p-3 border text-right">Costo</th>
                  <th className="p-3 border text-right">%</th>
                  <th className="p-3 border text-right">Impuesto</th>
                  <th className="p-3 border text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const costo = Number(row.original.costo_compra) || 0;
                  const totalCompra = filteredRows.reduce((sum, r) => sum + (Number(r.original.costo_compra) || 0), 0);
                  const porcentaje = totalCompra > 0 ? (costo / totalCompra) * 100 : 0;
                  const impuestoAsignado = (porcentaje / 100) * (Number(impuestosImportacion) || 0);

                  return (
                    <tr key={row.id} className="hover:bg-gray-50 even:bg-gray-50">
                      <td className="p-3 border text-left truncate max-w-xs" title={row.original.descripcion}>
                        {row.original.descripcion || 'Sin nombre'}
                      </td>
                      <td className="p-3 border text-right font-mono">${costo.toFixed(2)}</td>
                      <td className="p-3 border text-right font-mono">{porcentaje.toFixed(2)}%</td>
                      <td className="p-3 border text-right font-mono">${impuestoAsignado.toFixed(2)}</td>
                      <td className="p-3 border text-right font-mono">${(costo + impuestoAsignado).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-300 grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded">
              <div className="flex justify-between font-semibold">
                <span>Total asignado:</span>
                <span className="font-mono">${filteredRows.reduce((sum, row) => {
                  const costo = Number(row.original.costo_compra) || 0;
                  const totalCompra = filteredRows.reduce((s, r) => s + (Number(r.original.costo_compra) || 0), 0);
                  const porcentaje = totalCompra > 0 ? (costo / totalCompra) : 0;
                  return sum + (porcentaje * (Number(impuestosImportacion) || 0));
                }, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Diferencia:</span>
                <span className="font-mono">${(impuestosImportacion - filteredRows.reduce((sum, row) => {
                  const costo = Number(row.original.costo_compra) || 0;
                  const totalCompra = filteredRows.reduce((s, r) => s + (Number(r.original.costo_compra) || 0), 0);
                  const porcentaje = totalCompra > 0 ? (costo / totalCompra) : 0;
                  return sum + (porcentaje * (Number(impuestosImportacion) || 0));
                }, 0)).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded">
              <div className="flex justify-between font-semibold">
                <span>Total Costo + Impuestos:</span>
                <span className="font-mono">${(filteredRows.reduce((sum, row) => sum + (Number(row.original.costo_compra) || 0), 0) + (Number(impuestosImportacion) || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg mt-6 font-semibold">
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
            className="p-2 border rounded"
          />
        ))}

        {/* Campos numéricos */}
        <input
          name="costo"
          type="number"
          step="0.01"
          value={nuevoPedido.costo || ''}
          onChange={handleChange}
          placeholder="Costo"
          className="p-2 border rounded"
        />

        <input
          name="envio"
          type="number"
          step="0.01"
          value={nuevoPedido.envio}
          onChange={handleChange}
          placeholder="Envío"
          className="p-2 border rounded"
        />

        <input
          name="costo_compra"
          type="number"
          step="0.01"
          value={nuevoPedido.costo_compra}
          onChange={handleChange}
          placeholder="Costo de Compra"
          className="p-2 border rounded"
        />


      </div>

      <button
        onClick={editandoId ? handleActualizar : handleAgregar}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {editandoId ? 'Actualizar' : 'Agregar'}
      </button>
    </div>
  );
};

export default TablaPedidos;