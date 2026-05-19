import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarritoStore } from '../stores';
import { useAuthStore } from '../stores/authStore';
import { wizardApi } from '../api/endpoints';
import { request } from '../api/clienteAxios';
import { Button, Spinner, Modal } from '../components/ui';
import './Carrito.css';

type CheckoutStep = 'carrito' | 'datos' | 'pago' | 'confirmacion';

interface DatosEntrega {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  notas: string;
}

export const Carrito = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const { items, eliminarProducto, actualizarCantidad, vaciarCarrito, total } = useCarritoStore();
  
  const [step, setStep] = useState<CheckoutStep>('carrito');
  const [loading, setLoading] = useState(false);
  const [datosEntrega, setDatosEntrega] = useState<DatosEntrega>({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    telefono: usuario?.whatsapp || '',
    direccion: '',
    notas: '',
  });
  const [metodoPago, setMetodoPago] = useState<'mercadopago' | 'tienda' | 'transferencia'>('tienda');
  const [resultado, setResultado] = useState<{ success: boolean; trackingId?: string; mensaje?: string } | null>(null);
  const [pedidosAnteriores, setPedidosAnteriores] = useState<any[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  useEffect(() => {
    cargarPedidosAnteriores();
  }, []);

  const cargarPedidosAnteriores = async () => {
    setLoadingPedidos(true);
    try {
      const response = await wizardApi.getPedidos();
      if (response.success && response.data) {
        setPedidosAnteriores(response.data.slice(0, 5));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingPedidos(false);
    }
  };

  const handleCantidadChange = (id: number, cantidad: number) => {
    if (cantidad < 1) {
      eliminarProducto(id);
    } else {
      actualizarCantidad(id, cantidad);
    }
  };

  const handleContinuar = () => {
    setStep('datos');
  };

  const handleDatosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('pago');
  };

  const handlePagar = async () => {
    setLoading(true);

    try {
      const itemsParaEnvio = items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        descripcion: item.descripcion || '',
        tipo: item.categoria === 'servicio' ? 'servicio' : 'producto' as const,
      }));

      const response = await request('/pagos/crear-checkout', {
        method: 'POST',
        data: {
          items: itemsParaEnvio,
          email: usuario?.email || datosEntrega.email || '',
          nombre: datosEntrega.nombre,
          telefono: datosEntrega.telefono,
          direccion: datosEntrega.direccion,
          notas: datosEntrega.notas,
        },
      });

      if (response.success) {
        setResultado({
          success: true,
          trackingId: response.orden?.trackingId,
          mensaje: metodoPago === 'tienda' 
            ? 'Pedido creado. Paga en tienda para confirmar.'
            : 'Serás redirigido al método de pago seleccionado.',
        });
        setStep('confirmacion');
        
        if (metodoPago === 'tienda') {
          vaciarCarrito();
        }
      } else {
        setResultado({
          success: false,
          mensaje: response.mensaje || 'Error al procesar el pedido',
        });
      }
    } catch (err: any) {
      setResultado({
        success: false,
        mensaje: 'Error de conexión. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderCarrito = () => (
    <>
      {items.length === 0 ? (
        <div className="carrito-vacio">
          <span className="empty-icon">🛒</span>
          <p>Tu carrito está vacío</p>
          <Button onClick={() => navigate('/')}>Ver Catálogo</Button>
        </div>
      ) : (
        <main className="carrito-lista">
          <table className="carrito-tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="carrito-producto">
                      <div className="carrito-img">📦</div>
                      <div>
                        <h4>{item.nombre}</h4>
                        <p className="carrito-categoria">{item.categoria}</p>
                        {item.descripcion && <p className="carrito-desc">{item.descripcion}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cantidad-controls">
                      <button onClick={() => handleCantidadChange(item.id, item.cantidad - 1)}>-</button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => handleCantidadChange(item.id, item.cantidad + 1)}>+</button>
                    </div>
                  </td>
                  <td>S/ {item.precio.toFixed(2)}</td>
                  <td>S/ {(item.precio * item.cantidad).toFixed(2)}</td>
                  <td>
                    <button className="btn-eliminar" onClick={() => eliminarProducto(item.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="carrito-total">
            <h3>Total: S/ {total.toFixed(2)}</h3>
            <Button onClick={handleContinuar}>Continuar →</Button>
          </div>
        </main>
      )}
    </>
  );

  const renderDatosEntrega = () => (
    <div className="checkout-form">
      <h2>Datos de Entrega</h2>
      <form onSubmit={handleDatosSubmit}>
        <div className="form-group">
          <label>Nombre completo</label>
          <input 
            type="text" 
            value={datosEntrega.nombre}
            onChange={(e) => setDatosEntrega({ ...datosEntrega, nombre: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={datosEntrega.email}
            onChange={(e) => setDatosEntrega({ ...datosEntrega, email: e.target.value })}
            placeholder="tu@email.com"
          />
        </div>
        <div className="form-group">
          <label>Teléfono / WhatsApp</label>
          <input 
            type="tel" 
            value={datosEntrega.telefono}
            onChange={(e) => setDatosEntrega({ ...datosEntrega, telefono: e.target.value })}
            required
            placeholder="+51 999 999 999"
          />
        </div>
        <div className="form-group">
          <label>Dirección de entrega</label>
          <input 
            type="text" 
            value={datosEntrega.direccion}
            onChange={(e) => setDatosEntrega({ ...datosEntrega, direccion: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Notas adicionales</label>
          <textarea 
            value={datosEntrega.notas}
            onChange={(e) => setDatosEntrega({ ...datosEntrega, notas: e.target.value })}
            rows={3}
            placeholder="Indicaciones especiales para la entrega..."
          />
        </div>
        <div className="form-actions">
          <Button variant="outline" type="button" onClick={() => setStep('carrito')}>
            ← Volver
          </Button>
          <Button type="submit">Continuar al Pago →</Button>
        </div>
      </form>
    </div>
  );

  const renderPago = () => (
    <div className="checkout-form">
      <h2>Método de Pago</h2>
      
      <div className="metodos-pago">
        <label className={`metodo-pago ${metodoPago === 'tienda' ? 'selected' : ''}`}>
          <input 
            type="radio" 
            name="pago" 
            value="tienda"
            checked={metodoPago === 'tienda'}
            onChange={() => setMetodoPago('tienda')}
          />
          <div className="metodo-content">
            <span className="metodo-icon">🏪</span>
            <div>
              <h4>Pagar en Tienda</h4>
              <p>Acude a nuestra tienda y paga en efectivo</p>
            </div>
          </div>
        </label>

        <label className={`metodo-pago ${metodoPago === 'mercadopago' ? 'selected' : ''}`}>
          <input 
            type="radio" 
            name="pago" 
            value="mercadopago"
            checked={metodoPago === 'mercadopago'}
            onChange={() => setMetodoPago('mercadopago')}
          />
          <div className="metodo-content">
            <span className="metodo-icon">💳</span>
            <div>
              <h4>MercadoPago</h4>
              <p>Paga con tarjeta, saldo o QR</p>
            </div>
          </div>
        </label>

        <label className={`metodo-pago ${metodoPago === 'transferencia' ? 'selected' : ''}`}>
          <input 
            type="radio" 
            name="pago" 
            value="transferencia"
            checked={metodoPago === 'transferencia'}
            onChange={() => setMetodoPago('transferencia')}
          />
          <div className="metodo-content">
            <span className="metodo-icon">🏦</span>
            <div>
              <h4>Transferencia Bancaria</h4>
              <p>Transferencia a cuenta BCP / BBVA</p>
            </div>
          </div>
        </label>
      </div>

      <div className="resumen-pedido">
        <h3>Resumen del Pedido</h3>
        <div className="resumen-items">
          {items.map(item => (
            <div key={item.id} className="resumen-item">
              <span>{item.nombre} x{item.cantidad}</span>
              <span>S/ {(item.precio * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="resumen-total">
          <span>Total:</span>
          <span>S/ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="form-actions">
        <Button variant="outline" type="button" onClick={() => setStep('datos')}>
          ← Volver
        </Button>
        <Button onClick={handlePagar} disabled={loading}>
          {loading ? <><Spinner size="sm" /> Procesando...</> : `Confirmar Pedido - S/ ${total.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );

  const renderConfirmacion = () => (
    <div className="confirmacion-checkout">
      <div className={`confirmacion-icon ${resultado?.success ? 'success' : 'error'}`}>
        {resultado?.success ? '✓' : '✗'}
      </div>
      <h2>{resultado?.success ? '¡Pedido Confirmado!' : 'Error en el Pedido'}</h2>
      <p className="confirmacion-mensaje">{resultado?.mensaje}</p>
      
      {resultado?.trackingId && (
        <div className="tracking-info">
          <span className="tracking-label">Tu código de seguimiento:</span>
          <span className="tracking-code">{resultado.trackingId}</span>
        </div>
      )}

      <div className="confirmacion-actions">
        <Button variant="outline" onClick={() => { setStep('carrito'); setResultado(null); }}>
          Hacer Otro Pedido
        </Button>
        <Button onClick={() => navigate('/usuario/perfil')}>
          Ver Mis Pedidos
        </Button>
      </div>
    </div>
  );

  return (
    <div className="carrito-page">
      <header className="carrito-header">
        <h1>
          {step === 'carrito' && 'Carrito de Compras'}
          {step === 'datos' && 'Datos de Entrega'}
          {step === 'pago' && 'Método de Pago'}
          {step === 'confirmacion' && 'Confirmación'}
        </h1>
        {step !== 'confirmacion' && items.length > 0 && (
          <button className="btn-vaciar" onClick={vaciarCarrito}>Vaciar Carrito</button>
        )}
      </header>

      {step === 'carrito' && (
        <>
          {renderCarrito()}
          {pedidosAnteriores.length > 0 && (
            <section className="pedidos-anteriores">
              <h2>Mis pedidos anteriores</h2>
              {loadingPedidos ? (
                <Spinner size="sm" />
              ) : (
                <table className="pedidos-anteriores-tabla">
                  <thead>
                    <tr>
                      <th>Tracking</th>
                      <th>Servicio</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosAnteriores.map((p: any) => (
                      <tr key={p.id}>
                        <td>{p.trackingId || `#${p.id}`}</td>
                        <td>{p.servicioIcono} {p.servicioNombre}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>S/ {Number(p.total).toFixed(2)}</td>
                        <td><span className={`estado-badge ${p.estadoProduccion}`}>{p.estadoProduccion}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </>
      )}
      {step === 'datos' && renderDatosEntrega()}
      {step === 'pago' && renderPago()}
      {step === 'confirmacion' && renderConfirmacion()}
    </div>
  );
};

export default Carrito;