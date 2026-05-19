import { useNavigate } from 'react-router-dom';
import { useServicios } from '../api/queries';
import { Spinner } from '../components/ui';
import './Servicios.css';

interface Servicio {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  icono: string;
  imagen?: string;
  precioBase: number;
  unidad: string;
}

export const Servicios = () => {
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useServicios();
  const servicios = response?.servicios || [];

  const handleSeleccionarServicio = (slug: string) => {
    navigate(`/usuario/wizard/${slug}`);
  };

  if (isLoading) return <div className="servicios-page"><Spinner /></div>;
  
  if (error) return <div className="servicios-page"><p>Error: {error.message}</p></div>;

  return (
    <div className="servicios-page">
      <header className="servicios-header">
        <h1>CROMA - Servicios de Imprent</h1>
        <p>Encuentra el servicio perfecto para tu proyecto</p>
      </header>

      <main className="servicios-grid">
        {servicios.map((servicio: Servicio) => (
          <div 
            key={servicio.id} 
            className="servicio-card"
            onClick={() => handleSeleccionarServicio(servicio.slug)}
          >
            <div className="servicio-imagen">
              {servicio.imagen ? (
                <img src={servicio.imagen} alt={servicio.nombre} />
              ) : (
                <div className="servicio-icono">{servicio.icono}</div>
              )}
            </div>
            <h2 className="servicio-nombre">{servicio.nombre}</h2>
            <p className="servicio-desc">{servicio.descripcion}</p>
            <div className="servicio-precio">
              Desde S/ {servicio.precioBase.toFixed(2)} / {servicio.unidad}
            </div>
            <button className="btn-solicitar">Solicitar</button>
          </div>
        ))}
      </main>
    </div>
  );
};