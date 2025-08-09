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
    costo: '',
  });
  const [editandoId, setEditandoId] = useState(null);
  const [comision, setComision] = useState(0);
  const [impuestosImportacion, setImpuestosImportacion] = useState(0);
  const [abono, setAbono] = useState(0);
  const [envio, setEnvio] = useState(0);
  const [columnFilters, setColumnFilters] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL;

  const fetchPedidos = useCallback(async () => {
    const res = await fetch(`${apiUrl}/pedidos`);
    const data = await res.json();

    const pedidosNormalizados = data.map((p) => ({
      ...p,
      costo: parseFloat(p.costo) || 0,
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
      body: JSON.stringify({ ...nuevoPedido, costo: parseFloat(nuevoPedido.costo) }),
    });
    setNuevoPedido({ pedido: '', cliente: '', tienda: '', descripcion: '', estado: '', costo: '' });
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
      body: JSON.stringify({ ...nuevoPedido, costo: parseFloat(nuevoPedido.costo) }),
    });
    setNuevoPedido({ pedido: '', cliente: '', tienda: '', descripcion: '', estado: '', costo: '' });
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

  const totalConComisionEImpuestos = useMemo(() => {
    return totalCostoFiltrado + (Number(comision) || 0) + (Number(impuestosImportacion) || 0) + (Number(envio) || 0);
  }, [totalCostoFiltrado, comision, impuestosImportacion, envio]);

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
   → Costo: $${parseFloat(row.original.costo).toFixed(2)}`
    ).join('\n\n')}

*💰 TOTALES:*
➖ Subtotal: $${totalCostoFiltrado.toFixed(2)}
➕ Comisión: $${comision.toFixed(2)}
➕ Impuestos: $${impuestosImportacion.toFixed(2)}
${envio > 0 ? `➕ Envío: $${envio.toFixed(2)}` : '➕ Envío: GRATIS'}
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

      <div className="mt-4 p-4 bg-gray-100 rounded shadow-md max-w-md">
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
          <label className="font-semibold">Envío:</label>
          <div className="flex items-center">
            <span className="mr-1">$</span>
            <input
              type="number"
              value={envio}
              onChange={(e) => setEnvio(Number(e.target.value) || 0)}
              className="border rounded p-1 w-24 text-right"
            />
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

      <h3 className="text-lg mt-6 font-semibold">{editandoId ? 'Editar Pedido' : 'Agregar Pedido'}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
        {['pedido', 'cliente', 'tienda', 'descripcion', 'estado'].map((campo) => (
          <input
            key={campo}
            name={campo}
            value={nuevoPedido[campo]}
            onChange={handleChange}
            placeholder={campo.charAt(0).toUpperCase() + campo.slice(1)}
            className="p-2 border rounded"
          />
        ))}
        <input
          name="costo"
          type="number"
          value={nuevoPedido.costo}
          onChange={handleChange}
          placeholder="Costo"
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