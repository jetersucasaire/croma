import React, { useState } from 'react';
import { Navbar } from './Navbar';
import './Tienda.css';

// 1. Ampliamos la interfaz con los campos necesarios para medir la popularidad
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  descripcion: string;
  ventas: number;        // Para "Más Vendidos"
  fechaAgregado: string; // Para "Más Nuevos"
  enOferta: boolean;     // Para "En Oferta"
}

export const Tienda = () => {
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todas');
  
  const [ordenPrecio, setOrdenPrecio] = useState<string>('');
  const [ordenPopularidad, setOrdenPopularidad] = useState<string>('');
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  // 2. Base de datos simulada con los nuevos atributos
  const productos: Producto[] = [
    { id: 1, nombre: 'Monitor Gamer 4K', precio: 1200, categoria: 'Hardware', descripcion: 'Monitor de 27 pulgadas con panel IPS...', ventas: 150, fechaAgregado: '2026-01-15', enOferta: false },
    { id: 2, nombre: 'Teclado Mecánico RGB', precio: 350, categoria: 'Periféricos', descripcion: 'Switches Cherry MX Red...', ventas: 500, fechaAgregado: '2025-11-20', enOferta: true },
    { id: 3, nombre: 'Silla Ergonómica Pro', precio: 850, categoria: 'Mobiliario', descripcion: 'Soporte lumbar ajustable...', ventas: 80, fechaAgregado: '2026-03-10', enOferta: false },
    { id: 4, nombre: 'Mouse Óptico 16k DPI', precio: 150, categoria: 'Periféricos', descripcion: 'Sensor óptico de ultra precisión...', ventas: 300, fechaAgregado: '2026-04-01', enOferta: true },
    { id: 5, nombre: 'Laptop Ryzen 7', precio: 4500, categoria: 'Computadoras', descripcion: 'Procesador Ryzen 7 8845HS...', ventas: 45, fechaAgregado: '2026-02-28', enOferta: false },
    { id: 6, nombre: 'Headset Wireless', precio: 280, categoria: 'Audio', descripcion: 'Sonido envolvente 7.1...', ventas: 210, fechaAgregado: '2025-12-05', enOferta: false },
    { id: 7, nombre: 'Tarjeta de Video RTX 4060', precio: 1800, categoria: 'Hardware', descripcion: 'Arquitectura Ada Lovelace...', ventas: 120, fechaAgregado: '2026-04-20', enOferta: true },
  ];

  const categorias = ['Todas', ...Array.from(new Set(productos.map((p) => p.categoria)))];

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---

  // A. Primero aplicamos los filtros estrictos (Categoría, Búsqueda y Si está en oferta)
  let productosProcesados = productos.filter((prod) => {
    const coincideCategoria = categoriaActiva === 'Todas' || prod.categoria === categoriaActiva;
    const coincideNombre = prod.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase());
    const coincideOferta = ordenPopularidad === 'ofertas' ? prod.enOferta : true; 
    
    return coincideCategoria && coincideNombre && coincideOferta;
  });

  // B. Luego aplicamos el ordenamiento (Sort)
  if (ordenPopularidad === 'mas-vendidos') {
    // Ordena de mayor a menor número de ventas
    productosProcesados.sort((a, b) => b.ventas - a.ventas);
  } else if (ordenPopularidad === 'nuevos') {
    // Compara las fechas para poner las más recientes primero
    productosProcesados.sort((a, b) => new Date(b.fechaAgregado).getTime() - new Date(a.fechaAgregado).getTime());
  }

  // C. Si el usuario elige precio, este sobreescribe el orden visual
  if (ordenPrecio === 'menor') {
    productosProcesados.sort((a, b) => a.precio - b.precio);
  } else if (ordenPrecio === 'mayor') {
    productosProcesados.sort((a, b) => b.precio - a.precio);
  }

  // Funciones manejadoras para evitar que ambos selectores de orden se pisen visualmente
  const handleCambioPrecio = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrdenPrecio(e.target.value);
    setOrdenPopularidad(''); // Limpia el filtro de popularidad
  };

  const handleCambioPopularidad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrdenPopularidad(e.target.value);
    setOrdenPrecio(''); // Limpia el filtro de precio
  };

  return (
    <div className="tienda-page">
      <Navbar 
        categorias={categorias} 
        onSelectCategoria={setCategoriaActiva} 
        terminoBusqueda={terminoBusqueda}
        onBuscar={setTerminoBusqueda}
      />

      <div className="filtros-bar-container">
        <span className="filtros-label">FILTROS:</span>
        <select className="filtro-select" value={categoriaActiva} onChange={(e) => setCategoriaActiva(e.target.value)}>
          {categorias.map(cat => <option key={cat} value={cat}>{cat === 'Todas' ? 'Categoría (Todas)' : cat}</option>)}
        </select>
        
        {/* Actualizamos los selectores para usar las nuevas funciones */}
        <select className="filtro-select" value={ordenPrecio} onChange={handleCambioPrecio}>
          <option value="">Precio</option>
          <option value="menor">Menor a Mayor</option>
          <option value="mayor">Mayor a Menor</option>
        </select>

        <select className="filtro-select" value={ordenPopularidad} onChange={handleCambioPopularidad}>
          <option value="">Popularidad</option>
          <option value="mas-vendidos">Más Vendidos</option>
          <option value="nuevos">Más Nuevos</option>
          <option value="ofertas">En Oferta</option>
        </select>
      </div>

      <header className="tienda-header-simple">
        <h1 className="tienda-title">GALERÍA DE PRODUCTOS</h1>
      </header>

      <main className="tienda-layout-dividido">
        
        <section className="columna-lista">
          <div className="productos-grid-columna">
            {productosProcesados.map((prod) => (
              <div key={prod.id} className={`producto-card-horizontal ${productoSeleccionado?.id === prod.id ? 'seleccionado' : ''}`}>
                <div className="producto-imagen-mini"><span>[IMG]</span></div>
                <div className="producto-info-horizontal">
                  <h3 className="producto-nombre">
                    {prod.nombre} 
                    {/* Pequeño indicador visual si está en oferta */}
                    {prod.enOferta && <span style={{color: '#ff4d4d', fontSize: '0.8rem', marginLeft: '10px'}}>¡OFERTA!</span>}
                  </h3>
                  <span className="producto-specs-basicas">Categoría: {prod.categoria} | Ventas: {prod.ventas}</span>
                  <div className="producto-footer-horizontal">
                    <span className="producto-precio">S/ {prod.precio.toFixed(2)}</span>
                    <button className="btn-ver-detalle" onClick={() => setProductoSeleccionado(prod)}>
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {productosProcesados.length === 0 && (
              <div className="sin-resultados"><h3>No se encontraron productos.</h3></div>
            )}
          </div>
        </section>

        <aside className="columna-detalle">
          {productoSeleccionado ? (
            <div className="panel-detalle-tarjeta">
              <h2 className="detalle-titulo">{productoSeleccionado.nombre}</h2>
              <div className="detalle-imagen-principal"><span>[IMG PRINCIPAL]</span></div>
              <div className="detalle-specs">
                <p><strong>Categoría:</strong> {productoSeleccionado.categoria}</p>
                <p><strong>Precio:</strong> S/ {productoSeleccionado.precio.toFixed(2)}</p>
                <p><strong>Agregado:</strong> {productoSeleccionado.fechaAgregado}</p>
                <p className="detalle-descripcion">{productoSeleccionado.descripcion}</p>
              </div>
              <div className="detalle-portafolio">
                <h4>PORTAFOLIO</h4>
                <div className="portafolio-imagenes">
                  <div className="portafolio-img"><span>[IMG]</span></div>
                  <div className="portafolio-img"><span>[IMG]</span></div>
                </div>
              </div>
              <button className="btn-registrar-pedido">Registrar pedido</button>
            </div>
          ) : (
            <div className="panel-detalle-vacio">
              <p>Selecciona un producto de la galería para ver sus detalles técnicos aquí.</p>
            </div>
          )}
        </aside>

      </main>
    </div>
  );
};