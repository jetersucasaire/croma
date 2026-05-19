import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCatalogo } from '../store/CatalogoContext';
import { usePedido } from '../store/PedidoContext';
import { PasoDiseno } from './Pasos/PasoDiseno';
import { PasoConfig } from './Pasos/PasoConfig';
import { PasoResumen } from './Pasos/PasoResumen';
import './ServicioWizard.css';

export const ServicioWizard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { servicios, disenosPorServicio, materialesPorServicio, agregarPedido } = useCatalogo();
  const { iniciarPedido, establecerDiseno, establecerConfiguracion, disenoSeleccionado, configuracionSeleccionada, calcularTotal, confirmarPedido, cancelarPedido } = usePedido();
  
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');

  const servicioId = parseInt(id || '0');
  const servicio = servicios.find(s => s.id === servicioId);
  
  const disenos = disenosPorServicio(servicioId);
  const materiales = materialesPorServicio(servicioId);

  useEffect(() => {
    if (servicio) {
      iniciarPedido(servicio);
    }
    return () => {
      cancelarPedido();
    };
  }, [servicioId]);

  if (!servicio) {
    return (
      <div className="wizard-error">
        <h2>Servicio no encontrado</h2>
        <button onClick={() => navigate('/usuario/servicios')}>Volver a Servicios</button>
      </div>
    );
  }

  const handleSiguiente = () => {
    setError('');
    
    if (paso === 1) {
      if (!disenoSeleccionado) {
        setError('Selecciona un diseño o carga un archivo');
        return;
      }
      establecerDiseno(disenoSeleccionado);
      setPaso(2);
    } else if (paso === 2) {
      if (!configuracionSeleccionada || !configuracionSeleccionada.material) {
        setError('Selecciona un material y cantidad');
        return;
      }
      if (configuracionSeleccionada.cantidad > configuracionSeleccionada.material.stock) {
        setError('Cantidad excede el stock disponible');
        return;
      }
      establecerConfiguracion(configuracionSeleccionada);
      setPaso(3);
    } else if (paso === 3) {
      const pedido = confirmarPedido();
      if (pedido) {
        agregarPedido(pedido);
        navigate('/usuario/perfil');
      }
    }
  };

  const handleAnterior = () => {
    setError('');
    if (paso > 1) {
      setPaso(paso - 1);
    }
  };

  const renderizarPaso = () => {
    switch (paso) {
      case 1:
        return (
          <PasoDiseno 
            disenos={disenos}
            onSeleccionar={establecerDiseno}
            seleccionActual={disenoSeleccionado}
          />
        );
      case 2:
        return (
          <PasoConfig
            materiales={materiales}
            onSeleccionar={establecerConfiguracion}
            seleccionActual={configuracionSeleccionada}
          />
        );
      case 3:
        return (
          <PasoResumen
            servicio={servicio}
            diseno={disenoSeleccionado}
            config={configuracionSeleccionada}
            total={calcularTotal()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="wizard-page">
      <header className="wizard-header">
        <button className="btn-volver" onClick={() => navigate('/usuario/servicios')}>← Volver</button>
        <div className="wizard-titulo">
          <span className="servicio-icono">{servicio.icono}</span>
          <h1>{servicio.nombre}</h1>
        </div>
      </header>

      <nav className="wizard-steps">
        <div className={`step ${paso >= 1 ? 'active' : ''} ${paso > 1 ? 'completed' : ''}`}>
          <span className="step-num">1</span>
          <span className="step-label">Diseño</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${paso >= 2 ? 'active' : ''} ${paso > 2 ? 'completed' : ''}`}>
          <span className="step-num">2</span>
          <span className="step-label">Configuración</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${paso >= 3 ? 'active' : ''}`}>
          <span className="step-num">3</span>
          <span className="step-label">Resumen</span>
        </div>
      </nav>

      {error && <div className="wizard-error-msg">{error}</div>}

      <main className="wizard-contenido">
        {renderizarPaso()}
      </main>

      <footer className="wizard-footer">
        {paso > 1 && (
          <button className="btn-anterior" onClick={handleAnterior}>← Anterior</button>
        )}
        <button className="btn-siguiente" onClick={handleSiguiente}>
          {paso === 3 ? 'Confirmar Pedido' : 'Siguiente →'}
        </button>
      </footer>
    </div>
  );
};