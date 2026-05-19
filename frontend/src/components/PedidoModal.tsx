import { useState } from 'react';
import { Button, Modal } from '../components/ui';
import { useCarritoStore } from '../stores';
import { useAuthStore } from '../stores/authStore';
import { request } from '../api/clienteAxios';
import './PedidoModal.css';

interface PedidoModalProps {
  item: any;
  seccion: 'servicios' | 'productos' | 'todos';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PedidoModal = ({ item, seccion, open, onOpenChange }: PedidoModalProps) => {
  const { agregarProducto } = useCarritoStore();
  const { usuario } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medida: '',
    color: '',
    diseno: '',
    material: '',
    nombre: usuario?.nombre || '',
    telefono: usuario?.whatsapp || '',
    email: usuario?.email || '',
    notas: '',
  });
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  if (!open || !item) return null;

  const isProduct = item.tipo === 'producto' || seccion === 'productos';
  const tipo = isProduct ? 'producto' : 'servicio';

  const handleRegistrarPedido = () => {
    setShowForm(true);
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const response = await request('/pedidos', {
        method: 'POST',
        data: {
          itemId: item.id,
          itemNombre: item.nombre,
          itemPrecio: isProduct ? item.precio : item.precioBase,
          itemDescripcion: item.descripcion,
          tipo,
          medida: form.medida,
          color: form.color,
          diseno: form.diseno,
          material: form.material,
          nombre: form.nombre,
          telefono: form.telefono,
          email: form.email,
          notas: form.notas,
},
      });
      
      agregarProducto({
        id: item.id,
        nombre: item.nombre,
        precio: isProduct ? (item.precioOferta || item.precio) : item.precioBase,
        categoria: isProduct ? (item.categoria || 'producto') : 'servicio',
        descripcion: `${form.medida ? `Medida: ${form.medida}` : ''} ${form.color ? `Color: ${form.color}` : ''} ${form.material ? `Material: ${form.material}` : ''}`.trim(),
        ventas: 0,
        fechaAgregado: new Date().toISOString(),
        enOferta: !!item.precioOferta,
      });

      onOpenChange(false);
      setShowForm(false);
      setForm({
        medida: '',
        color: '',
        diseno: '',
        material: '',
        nombre: '',
        telefono: '',
        email: '',
        notas: '',
      });
      alert('Pedido registrado correctamente');
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error al registrar pedido'));
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={item?.nombre || ''} size="md">
      {!showForm ? (
        <div className="pedido-preview">
          <div className="pedido-imagen">
            {item?.imagen ? (
              <img src={item.imagen} alt={item.nombre} />
            ) : (
              <span className="icono-grande">{isProduct ? '📦' : item?.icono || '🛠️'}</span>
            )}
          </div>
          <div className="pedido-info">
            <p className="pedido-descripcion">{item?.descripcion || 'Sin descripción'}</p>
            <p className="pedido-precio">
              Precio: S/ {isProduct ? (item?.precioOferta || item?.precio || 0) : (item?.precioBase || 0)}
              {item?.precioOferta && <span className="precio-oferta"> (Oferta: S/ {item.precioOferta})</span>}
            </p>
            <p className="pedido-categoria">Categoría: {isProduct ? (item?.categoria || 'Producto') : 'Servicio'}</p>
            
            {mostrarDetalle && (
              <div className="detalle-tecnico">
                <h4>Detalles Técnicos</h4>
                <ul>
                  <li><strong>Unidad:</strong> {item?.unidad || 'und'}</li>
                  {isProduct && <li><strong>Stock disponible:</strong> {item?.stock || 0}</li>}
                  <li><strong>Tipo:</strong> {tipo}</li>
                  {item?.slug && <li><strong>Slug:</strong> {item.slug}</li>}
                </ul>
              </div>
            )}
            
            <div className="pedido-acciones">
              <Button variant="outline" onClick={() => setMostrarDetalle(!mostrarDetalle)}>
                {mostrarDetalle ? 'Ocultar Detalle' : 'Ver Detalle'}
              </Button>
              <Button onClick={handleRegistrarPedido}>
                Registrar Pedido
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pedido-form">
          <div className="form-seccion">
            <h4>Detalles del {tipo === 'producto' ? 'Producto' : 'Servicio'}</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Medida</label>
                <input 
                  type="text" 
                  value={form.medida}
                  onChange={(e) => setForm({ ...form, medida: e.target.value })}
                  placeholder="Ej: A4, 10x15cm, etc."
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input 
                  type="text" 
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="Ej: Blanco, Negro, etc."
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Diseño</label>
                <input 
                  type="text" 
                  value={form.diseno}
                  onChange={(e) => setForm({ ...form, diseno: e.target.value })}
                  placeholder="Descripción del diseño"
                />
              </div>
              <div className="form-group">
                <label>Material</label>
                <input 
                  type="text" 
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                  placeholder="Tipo de material"
                />
              </div>
            </div>
          </div>

          <div className="form-seccion">
            <h4>Datos del Cliente</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono / WhatsApp</label>
                <input 
                  type="tel" 
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+51 999 999 999"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email (para recibir boleta)</label>
              <input 
                type="email" 
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tu@email.com"
              />
            </div>
            <div className="form-group">
              <label>Notas adicionales</label>
              <textarea 
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                rows={2}
                placeholder="Indicaciones especiales..."
              />
            </div>
          </div>

          <div className="form-resumen">
            <p><strong>Producto:</strong> {item?.nombre}</p>
            <p><strong>Precio:</strong> S/ {isProduct ? (item?.precioOferta || item?.precio || 0) : (item?.precioBase || 0)}</p>
          </div>

          <div className="form-acciones">
            <Button variant="outline" onClick={() => setShowForm(false)}>Atrás</Button>
            <Button onClick={handleGuardar} disabled={saving || !form.nombre || !form.telefono}>
              {saving ? 'Guardando...' : 'Guardar Pedido'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};