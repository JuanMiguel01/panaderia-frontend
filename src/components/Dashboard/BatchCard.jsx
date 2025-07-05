// src/components/Dashboard/BatchCard.jsx - EJEMPLO DE COMO IMPLEMENTAR PERMISOS

export function BatchCard({ 
  batch, 
  user, // ✅ NUEVO: Recibir usuario
  onCreateSale, 
  onUpdateSale, 
  onDeleteSale, 
  onDeleteBatch,
  canDeleteSale, // ✅ NUEVO: Recibir función de permisos
  isAdmin // ✅ NUEVO: Recibir estado de admin
}) {
  // ... resto del código del componente ...

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      {/* Header del lote */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-brown-700">{batch.breadType}</h3>
          <p className="text-brown-600">Creado por: {batch.createdBy}</p>
        </div>
        
        {/* ✅ MODIFICADO: Botón de eliminar lote solo para administradores */}
        {isAdmin && (
          <button
            onClick={() => onDeleteBatch(batch.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar lote"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Información del lote */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-brown-600">Cantidad</p>
          <p className="font-semibold text-brown-800">{batch.quantityMade}</p>
        </div>
        <div>
          <p className="text-sm text-brown-600">Precio</p>
          <p className="font-semibold text-brown-800">${batch.price}</p>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="space-y-3">
        <h4 className="font-semibold text-brown-700">Ventas:</h4>
        
        {batch.sales.map(sale => (
          <div key={sale.id} className="flex items-center justify-between p-3 bg-brown-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-brown-800">{sale.personName}</p>
              <p className="text-sm text-brown-600">Cantidad: {sale.quantitySold}</p>
              <div className="flex space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  sale.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {sale.isPaid ? 'Pagado' : 'Pendiente'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  sale.isDelivered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {sale.isDelivered ? 'Entregado' : 'No entregado'}
                </span>
              </div>
            </div>
            
            {/* ✅ MODIFICADO: Botones de acción con permisos */}
            <div className="flex space-x-2">
              {/* Botón de marcar como pagado - solo admins */}
              {isAdmin && !sale.isPaid && (
                <button
                  onClick={() => onUpdateSale(batch.id, sale.id, { isPaid: true })}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Marcar como pagado"
                >
                  💰
                </button>
              )}
              
              {/* Botón de marcar como entregado - todos los usuarios */}
              {!sale.isDelivered && (
                <button
                  onClick={() => onUpdateSale(batch.id, sale.id, { isDelivered: true })}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Marcar como entregado"
                >
                  📦
                </button>
              )}
              
              {/* ✅ MODIFICADO: Botón de eliminar venta - solo admins */}
              {canDeleteSale && canDeleteSale(user) && (
                <button
                  onClick={() => onDeleteSale(batch.id, sale.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar venta"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
        
        {/* Formulario para añadir nueva venta */}
        <AddSaleForm onCreateSale={(saleData) => onCreateSale(batch.id, saleData)} />
      </div>
    </div>
  );
}