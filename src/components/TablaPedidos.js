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
    // 👇 aquí se aplica el formato con símbolo de $
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

  const totalConComision = useMemo(() => {
    return totalCostoFiltrado + (Number(comision) || 0);
  }, [totalCostoFiltrado, comision]);

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
          <label className="font-semibold">Total:</label>
          <span>${totalCostoFiltrado.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold">Comisión:</label>
          <input
            type="number"
            value={comision}
            onChange={(e) => setComision(Number(e.target.value) || 0)}
            className="border rounded p-1 w-24 text-right"
          />
        </div>
        <div className="flex justify-between items-center">
          <label className="font-semibold">Total + Comisión:</label>
          <span>${totalConComision.toFixed(2)}</span>
        </div>
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