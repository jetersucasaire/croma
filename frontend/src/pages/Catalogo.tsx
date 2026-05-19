import { useState, useMemo } from 'react';
import { useServicios, useProductos, useCategoriasProductos } from '../api/queries';
import { Spinner, Skeleton } from '../components/ui';
import { PedidoModal } from '../components/PedidoModal';
import './Catalogo.css';

type Seccion = 'todos' | 'servicios' | 'productos';

export const Catalogo = () => {
  const [seccion, setSeccion] = useState<Seccion>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [ordenarPor, setOrdenarPor] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const { data: serviciosResponse, isLoading: loadingServicios } = useServicios();
  const { data: productosResponse, isLoading: loadingProductos } = useProductos();
  const { data: categoriasData } = useCategoriasProductos();
  
  const servicios = serviciosResponse?.servicios || [];
  const productos = productosResponse?.productos || [];
  const categoriasProductos = ['Todas', ...(categoriasData?.categorias || [])];

  const categoriasServicios = useMemo((): string[] => {
    const cats = servicios.map((s: any) => s.nombre as string);
    return ['Todas', ...new Set(cats)];
  }, [servicios]);

  const itemsFiltrados = useMemo(() => {
    const items = seccion === 'productos' ? productos : seccion === 'servicios' ? servicios : [...servicios, ...productos.map(p => ({ ...p, tipo: 'producto' }))];
    
    if (seccion === 'productos') {
      return items.filter((p: any) => {
        const coincideBusqueda = !busqueda || 
          p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;
        return coincideBusqueda && coincideCategoria;
      });
    } else if (seccion === 'servicios') {
      return items.filter((s: any) => {
        const coincideBusqueda = !busqueda || 
          s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          s.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideCategoria = categoriaActiva === 'Todas' || s.nombre === categoriaActiva;
        return coincideBusqueda && coincideCategoria;
      });
    } else {
      return items.filter((i: any) => {
        const coincideBusqueda = !busqueda || 
          i.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          i.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideCategoria = categoriaActiva === 'Todas' || (i.categoria === categoriaActiva) || (i.tipo === 'servicio' && i.nombre === categoriaActiva);
        return coincideBusqueda && coincideCategoria;
      });
    }
  }, [servicios, productos, busqueda, categoriaActiva, seccion]);

  const itemsOrdenados = useMemo(() => {
    const sorted = [...itemsFiltrados];
    switch (ordenarPor) {
      case 'precio-asc':
        return sorted.sort((a: any, b: any) => (a.precioBase || a.precio || 0) - (b.precioBase || b.precio || 0));
      case 'precio-desc':
        return sorted.sort((a: any, b: any) => (b.precioBase || b.precio || 0) - (a.precioBase || a.precio || 0));
      case 'nombre':
        return sorted.sort((a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || ''));
      default:
        return sorted;
    }
  }, [itemsFiltrados, ordenarPor]);

  const isLoading = loadingServicios || loadingProductos;
  
  const categoriasUnicas = useMemo(() => {
    const cats = new Set<string>();
    if (seccion === 'todos') {
      categoriasServicios.forEach(c => { if (c !== 'Todas') cats.add(c); });
      (categoriasData?.categorias || []).forEach((c: string) => cats.add(c));
    } else if (seccion === 'productos') {
      categoriasProductos.forEach(c => { if (c !== 'Todas') cats.add(c); });
    } else {
      categoriasServicios.forEach(c => { if (c !== 'Todas') cats.add(c); });
    }
    return ['Todas', ...Array.from(cats)];
  }, [seccion, categoriasServicios, categoriasData]);
  
  const placeholderBusqueda = seccion === 'productos' ? 'Buscar productos...' : seccion === 'servicios' ? 'Buscar servicios...' : 'Buscar servicios y productos...';
  const titulo = seccion === 'productos' ? 'Catálogo de Productos' : seccion === 'servicios' ? 'Catálogo de Servicios' : 'Catálogo Completo';

  const handleAgregar = (item: any) => {
    let tipo = 'servicio';
    if (seccion === 'productos') {
      tipo = 'producto';
    } else if (seccion === 'servicios') {
      tipo = 'servicio';
    } else {
      // Para "todos", determinar por la propiedad categoria o si tiene precio (producto)
      tipo = item.categoria || item.precio ? 'producto' : 'servicio';
    }
    setSelectedItem({ ...item, tipo });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <div className="catalogo-page">
        <header className="catalogo-header">
          <h1>Cargando...</h1>
        </header>
        <div className="catalogo-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="producto-card">
              <Skeleton height="200px" variant="rectangular" />
              <div className="producto-info">
                <Skeleton height="24px" width="80%" />
                <Skeleton height="16px" width="60%" />
                <Skeleton height="20px" width="40%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="catalogo-page">
      <header className="catalogo-header">
        <h1>{titulo}</h1>
      </header>
      
      <div className="seccion-selector">
        <label>
          <input type="radio" name="seccion" value="todos" checked={seccion === 'todos'} onChange={() => { setSeccion('todos'); setCategoriaActiva('Todas'); }} />
          Todos
        </label>
        <label>
          <input type="radio" name="seccion" value="servicios" checked={seccion === 'servicios'} onChange={() => { setSeccion('servicios'); setCategoriaActiva('Todas'); }} />
          Servicios
        </label>
        <label>
          <input type="radio" name="seccion" value="productos" checked={seccion === 'productos'} onChange={() => { setSeccion('productos'); setCategoriaActiva('Todas'); }} />
          Productos
        </label>
      </div>
      
      <div className="filtros-bar">
        <input 
          type="text" 
          placeholder={placeholderBusqueda}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="busqueda-input"
        />
        <select value={categoriaActiva} onChange={(e) => setCategoriaActiva(e.target.value)}>
          {categoriasUnicas.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)}>
          <option value="">Ordenar por...</option>
          <option value="precio-asc">Precio: Menor a Mayor</option>
          <option value="precio-desc">Precio: Mayor a Menor</option>
          <option value="nombre">Nombre</option>
        </select>
      </div>
      
      <main className="catalogo-grid">
        {itemsOrdenados.map((item: any) => {
          const key = (item.tipo === 'producto' || seccion === 'productos') ? `prod-${item.id}` : `serv-${item.id}`;
          return (
          <div key={key} className="producto-card">
            <div className="producto-imagen">
              {item.tipo === 'producto' || seccion === 'productos' ? (
                item.imagen ? <img src={item.imagen} alt={item.nombre} /> : <span className="servicio-icono">📦</span>
              ) : (
                <span className="servicio-icono">{item.icono || '📦'}</span>
              )}
            </div>
            <div className="producto-info">
              <h3>{item.tipo === 'producto' || seccion === 'productos' ? '' : item.icono} {item.nombre}</h3>
              <p className="producto-cat">{item.descripcion || (item.categoria || 'Servicio profesional')}</p>
              <p className="producto-desc">
                {(item.tipo === 'producto' || seccion === 'productos') 
                  ? (item.precioOferta ? `Oferta: S/ ${item.precioOferta.toFixed(2)}` : `Precio: S/ ${(item.precio || 0).toFixed(2)}`)
                  : `Precio base: S/ ${typeof item.precioBase === 'number' ? item.precioBase.toFixed(2) : 'Consultar'}`
                }
              </p>
              <p className="producto-precio">
                Desde S/ {((item.tipo === 'producto' || seccion === 'productos') ? (item.precioOferta || item.precio) : item.precioBase) || 0}
              </p>
              <button onClick={() => handleAgregar(item)}>
                Agregar al Carrito
              </button>
            </div>
          </div>
          );
        })}
        {itemsOrdenados.length === 0 && (
          <p className="sin-resultados">No se encontraron resultados</p>
        )}
      </main>
      <PedidoModal 
        item={selectedItem} 
        seccion={seccion} 
        open={showModal} 
        onOpenChange={handleCloseModal} 
      />
    </div>
  );
};