import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { wizardApi, archivosApi, disenosApi, materialesApi } from '../../api/endpoints';
import { useUIStore } from '../../stores';
import type { Servicio, Diseno, Material, DisenoSeleccionado } from '../../types';
import { serviciosDemo, disenosDemo, materialesDemo } from '../../api/demoData';
import { Button, Spinner, LoadingOverlay } from '../../components/ui';
import styles from './WizardBase.module.css';

interface WizardProps {
  servicioSlug: string;
}

type ModoCarga = 'catalogo' | 'archivo';

interface ArchivoLocal {
  nombre: string;
  url: string;
  tamaño: number;
  formato: string;
}

export const WizardBase = ({ servicioSlug }: WizardProps) => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  
  const [modoCarga, setModoCarga] = useState<ModoCarga>('catalogo');
  const [disenoSeleccionado, setDisenoSeleccionado] = useState<DisenoSeleccionado | null>(null);
  const [archivoLocal, setArchivoLocal] = useState<ArchivoLocal | null>(null);
  const [materialSeleccionado, setMaterialSeleccionado] = useState<Material | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarDetalle, setMostrarDetalle] = useState<number | null>(null);
  const [mostrarDetalleMat, setMostrarDetalleMat] = useState<number | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [detallePedido, setDetallePedido] = useState('');
  const [dimensiones, setDimensiones] = useState({ ancho: '', alto: '' });
  const [archivosReferencia, setArchivosReferencia] = useState<{nombre: string; url: string; tipo: string}[]>([]);
  const [archivosComplementarios, setArchivosComplementarios] = useState<{nombre: string; url: string; tipo: string}[]>([]);
  // Estados específicos por servicio
  const [impresion, setImpresion] = useState({ tamano: 'A4', orientacion: 'vertical', resolucion: '300', tipoPapel: 'bond', color: 'color' });
  const [empastado, setEmpastado] = useState({ tipoTapa: 'blanda', grabado: 'ninguno', correccionAcademica: false, impresionInterna: false });
  const [fotocheck, setFotocheck] = useState({ usaDisenoPropio: false, cargaMasiva: false, urlCsv: '', notas: '' });
  const [sello, setSello] = useState({ tipoSello: 'tradicional', mecanismo: 'automatico', forma: 'circular', contenidoTexto: '', usaDisenoExistente: false, firmaVectorizada: false });
  const [edicionVideo, setEdicionVideo] = useState({ enlaceExterno: '', duracionEstimada: '', formatoSalida: 'mp4', instrucciones: '' });
  const [disenoLogo, setDisenoLogo] = useState({ nombreMarca: '', estilo: 'moderno', coloresRef: '' });
  const esDisenoLogos = servicioSlug === 'diseno-logos';

  const { data: servicioData, isLoading: loadingServicio, isError: servicioError } = useQuery({
    queryKey: ['servicio', servicioSlug],
    queryFn: async () => {
      try {
        return await wizardApi.getServicio(servicioSlug);
      } catch (err) {
        console.warn('Error fetching servicio, usando demo:', err);
        const demo = serviciosDemo.find(s => s.slug === servicioSlug);
        return { success: true, data: demo || null, mensaje: demo ? undefined : 'Servicio no encontrado' };
      }
    },
    staleTime: 0,
    retry: false,
  });

  const servicio: Servicio | null = servicioData?.data || null;

  const { data: disenosData } = useQuery({
    queryKey: ['disenos', servicio?.id],
    queryFn: async () => {
      try {
        return await disenosApi.getAll(servicio!.id);
      } catch (err) {
        console.warn('Error fetching disenos, usando demo:', err);
        return { success: true, data: disenosDemo.filter(d => d.servicioId === servicio!.id) };
      }
    },
    enabled: !!servicio,
    staleTime: 0,
  });

  const { data: materialesData } = useQuery({
    queryKey: ['materiales', servicio?.id],
    queryFn: async () => {
      try {
        return await materialesApi.getAll(servicio!.id);
      } catch (err) {
        console.warn('Error fetching materiales, usando demo:', err);
        return { success: true, data: materialesDemo.filter(m => m.servicioId === servicio!.id) };
      }
    },
    enabled: !!servicio,
    staleTime: 0,
  });

  const disenos: Diseno[] = disenosData?.data || [];
  const materiales: Material[] = materialesData?.data || [];

  useEffect(() => {
    if (servicioError) {
      setError('Servicio no encontrado o ha sido desactivado');
    } else if (servicioData && !servicioData.success) {
      setError(servicioData.mensaje || 'Error al cargar el servicio');
    } else if (!loadingServicio && !servicio) {
      setError('Servicio no disponible');
    }
  }, [servicioData, servicioError, loadingServicio, servicio]);

  const handleReferenciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['jpg','jpeg','png','gif','svg','pdf'].includes(ext)) continue;
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setArchivosReferencia(prev => [...prev, { nombre: file.name, url, tipo: ext || 'unknown' }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const eliminarReferencia = (index: number) => {
    setArchivosReferencia(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplementarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['jpg','jpeg','png','gif','svg','pdf','doc','docx','xls','xlsx','ai','psd','zip','rar'].includes(ext)) continue;
      if (file.size > 10 * 1024 * 1024) continue; // skip files over 10MB for base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setArchivosComplementarios(prev => [...prev, { nombre: file.name, url, tipo: ext || 'unknown' }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const eliminarComplementario = (index: number) => {
    setArchivosComplementarios(prev => prev.filter((_, i) => i !== index));
  };

  const handleArchivoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formatosPermitidos = ['pdf', 'ai', 'jpg', 'jpeg', 'png', 'svg', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!ext || !formatosPermitidos.includes(ext)) {
      setError('Formato no válido. Use: PDF, AI, DOC, JPG, PNG, SVG');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('El archivo excede 50MB');
      return;
    }

    setUploadingFile(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setArchivoLocal({
          nombre: file.name,
          url: reader.result as string,
          tamaño: file.size,
          formato: ext,
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error al procesar el archivo');
    } finally {
      setUploadingFile(false);
    }
  }, []);

  const validarPaso = (): boolean => {
    if (pasoActual === 1) {
      if (modoCarga === 'catalogo' && !disenoSeleccionado) {
        setError('Selecciona un diseño del catálogo');
        return false;
      }
      if (modoCarga === 'archivo' && !archivoLocal) {
        setError('Carga un archivo');
        return false;
      }
    } else if (pasoActual === 2) {
      if (!materialSeleccionado) {
        setError('Selecciona un material');
        return false;
      }
      if (cantidad < 1) {
        setError('La cantidad debe ser al menos 1');
        return false;
      }
      if (materialSeleccionado && cantidad > materialSeleccionado.stock) {
        setError('Cantidad excede el stock disponible');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSiguiente = () => {
    if (!validarPaso()) return;
    setPasoActual((p) => Math.min(p + 1, 3));
  };

  const handleAnterior = () => {
    setPasoActual((p) => Math.max(p - 1, 1));
    setError('');
  };

  const handleFinalizar = async () => {
    if (!validarPaso()) return;

    setLoadingSubmit(true);
    setError('');

    try {
      const disenoData = modoCarga === 'catalogo' && disenoSeleccionado
        ? { 
            disenoId: disenoSeleccionado.disenoId, 
            tipoCarga: 'catalogo' as const,
            archivoUrl: disenoSeleccionado.archivoUrl,
            archivoNombre: disenoSeleccionado.archivoNombre,
          }
        : archivoLocal
          ? { 
              archivoUrl: archivoLocal.url, 
              archivoNombre: archivoLocal.nombre, 
              tipoCarga: 'archivo' as const 
            }
          : {};

      const configData = {
        materialId: materialSeleccionado?.id,
        cantidad,
        precioUnitario: materialSeleccionado?.precioUnitario,
        opciones: {
          complementarios: archivosComplementarios.map(f => ({ nombre: f.nombre, url: f.url, tipo: f.tipo })),
          // Datos específicos por servicio
          ...(servicioSlug === 'impresiones' ? { ...impresion } : {}),
          ...(servicioSlug === 'empastados' ? { ...empastado } : {}),
          ...(servicioSlug === 'fotocheck' ? { ...fotocheck } : {}),
          ...(servicioSlug === 'sellos-personalizados' ? { ...sello } : {}),
          ...(servicioSlug === 'edicion-audio-video' ? { ...edicionVideo } : {}),
          ...(servicioSlug === 'diseno-logos' ? { nombreMarca: disenoLogo.nombreMarca, estilo: disenoLogo.estilo, coloresRef: disenoLogo.coloresRef, detalle: detallePedido, dimensiones: { ancho: dimensiones.ancho, alto: dimensiones.alto }, referencias: archivosReferencia.map(r => ({ nombre: r.nombre, url: r.url, tipo: r.tipo })) } : {}),
        },
      };

      const result = await wizardApi.crearPedido(servicioSlug, disenoData, configData);

      if (result.success) {
        const trackingId = result.data?.trackingId;
        showToast({
          tipo: 'success',
          titulo: '¡Pedido creado!',
          mensaje: trackingId ? `Tu código de seguimiento: ${trackingId}` : 'Tu pedido ha sido registrado exitosamente',
        });
        navigate('/usuario/perfil', { state: { pedidoCreado: true, trackingId } });
      } else {
        setError(result.mensaje || 'Error al crear el pedido');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const calcularTotal = (): number => {
    if (!materialSeleccionado) return 0;
    const precio = Number(materialSeleccionado.precioUnitario) || 0;
    const cant = Number(cantidad) || 1;
    return precio * cant;
  };

  // Calcular valores para la calculadora en vivo
  const calcPrecio = materialSeleccionado ? (Number(materialSeleccionado.precioUnitario) || 0) : 0;
  const calcTotal = calcPrecio * cantidad;
  const totalKey = `total-${materialSeleccionado?.id || 'none'}-${cantidad}`;

  if (loadingServicio) {
    return <LoadingOverlay message="Cargando servicio..." />;
  }

  if (servicioError || (error && !servicio) || (servicioData && !servicioData.success && !servicio)) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error || 'Servicio no encontrado o ha sido desactivado'}</p>
        <Button onClick={() => navigate('/usuario/servicios')}>Volver a Servicios</Button>
      </div>
    );
  }

  return (
    <div className={styles.wizardBase}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/usuario/servicios')}>
          ← Volver
        </Button>
        <div className={styles.titulo}>
          {servicio?.imagen ? (
            <img src={servicio.imagen} alt={servicio.nombre} className={styles.servicioImagen} />
          ) : (
            <span className={styles.icono}>{servicio?.icono}</span>
          )}
          <h1>{servicio?.nombre}</h1>
        </div>
      </header>

      <nav className={styles.pasos}>
        <div className={`${styles.paso} ${pasoActual >= 1 ? styles.active : ''} ${pasoActual > 1 ? styles.completed : ''}`}>
          <span className={styles.pasoNum}>1</span>
          <span className={styles.pasoLabel}>Diseño</span>
        </div>
        <div className={styles.linea}></div>
        <div className={`${styles.paso} ${pasoActual >= 2 ? styles.active : ''} ${pasoActual > 2 ? styles.completed : ''}`}>
          <span className={styles.pasoNum}>2</span>
          <span className={styles.pasoLabel}>Configuración</span>
        </div>
        <div className={styles.linea}></div>
        <div className={`${styles.paso} ${pasoActual >= 3 ? styles.active : ''}`}>
          <span className={styles.pasoNum}>3</span>
          <span className={styles.pasoLabel}>Confirmar</span>
        </div>
      </nav>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <main className={styles.contenido}>
        {pasoActual === 1 && (
          <div className={styles.pasoContenido}>
            <h2>Paso 1: Selecciona el Diseño</h2>
            <p className={styles.descripcion}>Elige un diseño del catálogo o carga tu propio archivo</p>

            <div className={styles.opciones}>
              <Button
                variant={modoCarga === 'catalogo' ? 'primary' : 'outline'}
                onClick={() => { setModoCarga('catalogo'); setArchivoLocal(null); }}
              >
                Catálogo
              </Button>
              <Button
                variant={modoCarga === 'archivo' ? 'primary' : 'outline'}
                onClick={() => { setModoCarga('archivo'); setDisenoSeleccionado(null); }}
              >
                Cargar Archivo
              </Button>
            </div>

            {modoCarga === 'catalogo' ? (
              <div className={styles.grid}>
                {disenos.map((d) => (
                  <div
                    key={d.id}
                    className={`${styles.card} ${disenoSeleccionado?.disenoId === d.id ? styles.selected : ''}`}
                    onClick={() => setDisenoSeleccionado({ disenoId: d.id, diseno: d, tipoCarga: 'catalogo' })}
                  >
                    <div className={styles.preview}>
                      {d.imagen ? <img src={d.imagen} alt={d.nombre} className={styles.previewImg} /> : <span>📄</span>}
                    </div>
                    <h3>{d.nombre}</h3>
                    <p>{d.ancho && d.alto ? `${d.ancho}x${d.alto} ${d.unidad || 'cm'}` : 'Medida personalizada'}</p>
                    <button 
                      className={styles.detalleBtn}
                      onClick={(e) => { e.stopPropagation(); setMostrarDetalle(d.id === mostrarDetalle ? null : d.id); }}
                    >
                      ⓘ Detalle
                    </button>
                  </div>
                ))}
                {disenos.length === 0 && (
                  <p className={styles.sinDatos}>No hay diseños disponibles</p>
                )}
              </div>
            ) : (
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept=".pdf,.ai,.doc,.docx,.jpg,.jpeg,.png,.svg"
                  onChange={handleArchivoChange}
                  disabled={uploadingFile}
                />
                {uploadingFile && <Spinner size="sm" />}
                {archivoLocal && (
                  <div className={styles.archivoSeleccionado}>
                    <span>✓</span> {archivoLocal.nombre}
                    {archivoLocal.url && /\.(jpg|jpeg|png|gif|svg)$/i.test(archivoLocal.nombre) && (
                      <img src={archivoLocal.url} alt="Preview" className={styles.uploadPreview} />
                    )}
                  </div>
                )}
              </div>
            )}

            {mostrarDetalle !== null && (
              <>
                <div className={styles.popupOverlay} onClick={() => setMostrarDetalle(null)} />
                <div className={styles.popupDetalle}>
                  <button className={styles.popupClose} onClick={() => setMostrarDetalle(null)}>✕</button>
                  {(() => {
                    const d = disenos.find(dd => dd.id === mostrarDetalle);
                    if (!d) return null;
                    return (
                      <>
                        <div className={styles.popupHeader}>
                          {d.imagen ? (
                            <img src={d.imagen} alt={d.nombre} className={styles.popupImg} />
                          ) : (
                            <span className={styles.popupIcon}>📄</span>
                          )}
                          <h4>{d.nombre}</h4>
                        </div>
                        {d.descripcion && <p className={styles.popupDesc}>{d.descripcion}</p>}
                        <div className={styles.popupInfo}>
                          <p><strong>Medida:</strong> {d.ancho && d.alto ? `${d.ancho}x${d.alto} ${d.unidad || 'cm'}` : 'Personalizada'}</p>
                          <p><strong>Servicio:</strong> {servicio?.nombre || '-'}</p>
                          {d.parametros && Object.keys(d.parametros).length > 0 && (
                            <p><strong>Parámetros:</strong> {JSON.stringify(d.parametros)}</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {pasoActual === 2 && (
          <div className={styles.pasoContenido}>
            <h2>Paso 2: Configuración</h2>
            <p className={styles.descripcion}>Selecciona el material y cantidad</p>

            <div className={styles.grid}>
              {materiales.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.card} ${materialSeleccionado?.id === m.id ? styles.selected : ''}`}
                  onClick={() => setMaterialSeleccionado(m)}
                >
                  <h3>{m.nombre}</h3>
                  <p className={styles.tipo}>{m.tipo}</p>
                  <div className={styles.precio}>
                    <span>S/ {(Number(m.precioUnitario) || 0).toFixed(2)}</span>
                    <span className={styles.stock}>Stock: {m.stock || 0}</span>
                  </div>
                  {materialSeleccionado?.id === m.id && (
                    <div className={styles.selectedPrice}>
                      <span className={styles.selectedLabel}>✓ SELECCIONADO</span>
                    </div>
                  )}
                  <button 
                    className={styles.detalleBtn}
                    onClick={(e) => { e.stopPropagation(); setMostrarDetalleMat(m.id === mostrarDetalleMat ? null : m.id); }}
                  >
                    ⓘ Detalle
                  </button>
                </div>
              ))}
            </div>

            {mostrarDetalleMat !== null && (
              <>
                <div className={styles.popupOverlay} onClick={() => setMostrarDetalleMat(null)} />
                <div className={styles.popupDetalle}>
                  <button className={styles.popupClose} onClick={() => setMostrarDetalleMat(null)}>✕</button>
                  {(() => {
                    const m = materiales.find(mm => mm.id === mostrarDetalleMat);
                    if (!m) return null;
                    return (
                      <>
                        <div className={styles.popupHeader}>
                          <span className={styles.popupIcon}>📦</span>
                          <h4>{m.nombre}</h4>
                        </div>
                        {m.descripcion && <p className={styles.popupDesc}>{m.descripcion}</p>}
                        <div className={styles.popupInfo}>
                          <p><strong>Tipo:</strong> {m.tipo}</p>
                          <p><strong>Precio Unitario:</strong> S/ {(m.precioUnitario || 0).toFixed(2)}</p>
                          <p><strong>Stock:</strong> {m.stock}</p>
                          <p><strong>Servicio:</strong> {servicio?.nombre || '-'}</p>
                          {m.disponible !== undefined && (
                            <p><strong>Disponible:</strong> {m.disponible ? 'Sí' : 'No'}</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}

            <div className={styles.calculadoraSection}>
              {materialSeleccionado ? (
                <div className={styles.calculadora}>
                  <div className={styles.calcRow}>
                    <span className={styles.calcLabel}>Precio unitario:</span>
                    <span key={`precio-${materialSeleccionado?.id}`} className={styles.calcValue}>S/ {calcPrecio.toFixed(2)}</span>
                  </div>
                  <div className={styles.calcRow}>
                    <span className={styles.calcLabel}>Cantidad:</span>
                    <div className={styles.calcCantidad}>
                      <button className={styles.calcBtn} type="button" onClick={() => {
                        setCantidad(prev => Math.max(1, prev - 1));
                      }}>−</button>
                      <input
                        className={styles.calcInput}
                        type="number"
                        min="1"
                        max={materialSeleccionado?.stock || 999999}
                        value={cantidad}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') { setCantidad(1); return; }
                          const num = parseInt(raw, 10);
                          if (isNaN(num) || num < 1) { setCantidad(1); return; }
                          const max = materialSeleccionado?.stock || 999999;
                          setCantidad(Math.min(num, max));
                        }}
                      />
                      <button className={styles.calcBtn} type="button" onClick={() => {
                        setCantidad(prev => {
                          const max = materialSeleccionado?.stock || 999999;
                          return Math.min(prev + 1, max);
                        });
                      }}>+</button>
                      <span className={styles.calcStock}>Stock: {materialSeleccionado.stock || 0}</span>
                    </div>
                  </div>
                  {cantidad >= (materialSeleccionado?.stock || 0) && (
                    <p className={styles.stockWarning}>Stock máximo: {materialSeleccionado.stock}</p>
                  )}
                  <div className={styles.calcTotal}>
                    <span className={styles.calcTotalLabel}>Total a pagar:</span>
                    <span key={totalKey} className={styles.calcTotalValue}>S/ {calcTotal.toFixed(2)}</span>
                  </div>
                    <div key={`debug-${totalKey}`} style={{fontSize:10,color:'#94a3b8',textAlign:'right',marginTop:4}}>
                    {calcPrecio.toFixed(2)} x {cantidad} = {calcTotal.toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className={styles.calcPlaceholder}>
                  <p>Selecciona un material para ver el cálculo</p>
                </div>
              )}
            </div>

            {/* Secciones específicas por tipo de servicio */}
            {servicioSlug === 'impresiones' && (
              <div className={styles.extraSection}>
                <h3 className={styles.extraTitle}>Detalles de Impresión</h3>
                <div className={styles.extraGrid}>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Tamaño</label>
                    <select className={styles.extraInput} value={impresion.tamano} onChange={(e) => setImpresion(p => ({ ...p, tamano: e.target.value }))}>
                      <option value="A4">A4</option>
                      <option value="A3">A3</option>
                      <option value="Oficio">Oficio</option>
                      <option value="Carta">Carta</option>
                    </select>
                  </div>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Orientación</label>
                    <select className={styles.extraInput} value={impresion.orientacion} onChange={(e) => setImpresion(p => ({ ...p, orientacion: e.target.value }))}>
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                  </div>
                </div>
                <div className={styles.extraGrid}>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Resolución (DPI)</label>
                    <select className={styles.extraInput} value={impresion.resolucion} onChange={(e) => setImpresion(p => ({ ...p, resolucion: e.target.value }))}>
                      <option value="150">150 DPI</option>
                      <option value="300">300 DPI</option>
                      <option value="600">600 DPI</option>
                    </select>
                  </div>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Color</label>
                    <select className={styles.extraInput} value={impresion.color} onChange={(e) => setImpresion(p => ({ ...p, color: e.target.value }))}>
                      <option value="color">Color</option>
                      <option value="blanco_negro">Blanco y Negro</option>
                    </select>
                  </div>
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.extraLabel}>Tipo de Papel</label>
                  <select className={styles.extraInput} value={impresion.tipoPapel} onChange={(e) => setImpresion(p => ({ ...p, tipoPapel: e.target.value }))}>
                    <option value="bond">Bond</option>
                    <option value="couche">Couché</option>
                    <option value="adhesivo">Adhesivo</option>
                    <option value="cartulina">Cartulina</option>
                  </select>
                </div>
              </div>
            )}

            {servicioSlug === 'empastados' && (
              <div className={styles.extraSection}>
                <h3 className={styles.extraTitle}>Detalles de Empastado</h3>
                <div className={styles.extraGrid}>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Tipo de Tapa</label>
                    <select className={styles.extraInput} value={empastado.tipoTapa} onChange={(e) => setEmpastado(p => ({ ...p, tipoTapa: e.target.value }))}>
                      <option value="blanda">Tapa Blanda</option>
                      <option value="dura">Tapa Dura</option>
                      <option value="cuero">Tapa Cuero</option>
                    </select>
                  </div>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Grabado</label>
                    <select className={styles.extraInput} value={empastado.grabado} onChange={(e) => setEmpastado(p => ({ ...p, grabado: e.target.value }))}>
                      <option value="ninguno">Ninguno</option>
                      <option value="titulo">Solo Título</option>
                      <option value="completo">Título + Autor</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </div>
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={empastado.correccionAcademica} onChange={(e) => setEmpastado(p => ({ ...p, correccionAcademica: e.target.checked }))} />
                    Corrección académica (ortografía y redacción)
                  </label>
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={empastado.impresionInterna} onChange={(e) => setEmpastado(p => ({ ...p, impresionInterna: e.target.checked }))} />
                    Incluir impresión interna (hojas interiores)
                  </label>
                </div>
              </div>
            )}

            {servicioSlug === 'fotocheck' && (
              <div className={styles.extraSection}>
                <h3 className={styles.extraTitle}>Detalles de Fotocheck</h3>
                <div className={styles.extraGroup}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={fotocheck.usaDisenoPropio} onChange={(e) => setFotocheck(p => ({ ...p, usaDisenoPropio: e.target.checked }))} />
                    Tengo mi propio diseño
                  </label>
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={fotocheck.cargaMasiva} onChange={(e) => setFotocheck(p => ({ ...p, cargaMasiva: e.target.checked }))} />
                    Carga masiva (archivo CSV con datos)
                  </label>
                </div>
                {fotocheck.cargaMasiva && (
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>URL del archivo CSV</label>
                    <input className={styles.extraInput} type="text" placeholder="http://..." value={fotocheck.urlCsv} onChange={(e) => setFotocheck(p => ({ ...p, urlCsv: e.target.value }))} />
                  </div>
                )}
                <div className={styles.extraGroup}>
                  <label className={styles.extraLabel}>Notas adicionales</label>
                  <textarea className={styles.extraTextarea} rows={3} value={fotocheck.notas} onChange={(e) => setFotocheck(p => ({ ...p, notas: e.target.value }))} placeholder="Indicaciones para los fotochecks..." />
                </div>
              </div>
            )}

            {servicioSlug === 'sellos-personalizados' && (
              <div className={styles.extraSection}>
                <h3 className={styles.extraTitle}>Detalles del Sello</h3>
                <div className={styles.extraGrid}>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Tipo de Sello</label>
                    <select className={styles.extraInput} value={sello.tipoSello} onChange={(e) => setSello(p => ({ ...p, tipoSello: e.target.value }))}>
                      <option value="tradicional">Tradicional</option>
                      <option value="automatico">Automático</option>
                      <option value="fecha">Con Fecha</option>
                    </select>
                  </div>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Mecanismo</label>
                    <select className={styles.extraInput} value={sello.mecanismo} onChange={(e) => setSello(p => ({ ...p, mecanismo: e.target.value }))}>
                      <option value="automatico">Automático</option>
                      <option value="madera">Madera</option>
                      <option value="bolsillo">Bolsillo</option>
                    </select>
                  </div>
                </div>
                <div className={styles.extraGrid}>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Forma</label>
                    <select className={styles.extraInput} value={sello.forma} onChange={(e) => setSello(p => ({ ...p, forma: e.target.value }))}>
                      <option value="circular">Circular</option>
                      <option value="rectangular">Rectangular</option>
                      <option value="cuadrada">Cuadrada</option>
                    </select>
                  </div>
                  <div className={styles.extraGroup}>
                    <label className={styles.checkLabel}>
                      <input type="checkbox" checked={sello.firmaVectorizada} onChange={(e) => setSello(p => ({ ...p, firmaVectorizada: e.target.checked }))} />
                      Firma vectorizada
                    </label>
                  </div>
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.extraLabel}>Texto del Sello</label>
                  <textarea className={styles.extraTextarea} rows={3} value={sello.contenidoTexto} onChange={(e) => setSello(p => ({ ...p, contenidoTexto: e.target.value }))} placeholder="Texto que irá en el sello..." />
                </div>
              </div>
            )}

            {servicioSlug === 'edicion-audio-video' && (
              <div className={styles.extraSection}>
                <h3 className={styles.extraTitle}>Detalles de Edición de Video</h3>
                <div className={styles.extraGrid}>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Enlace externo (opcional)</label>
                    <input className={styles.extraInput} type="text" placeholder="https://..." value={edicionVideo.enlaceExterno} onChange={(e) => setEdicionVideo(p => ({ ...p, enlaceExterno: e.target.value }))} />
                  </div>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Formato de salida</label>
                    <select className={styles.extraInput} value={edicionVideo.formatoSalida} onChange={(e) => setEdicionVideo(p => ({ ...p, formatoSalida: e.target.value }))}>
                      <option value="mp4">MP4</option>
                      <option value="mov">MOV</option>
                      <option value="avi">AVI</option>
                      <option value="wmv">WMV</option>
                    </select>
                  </div>
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.extraLabel}>Duración estimada</label>
                  <input className={styles.extraInput} type="text" placeholder="Ej: 5:30 min" value={edicionVideo.duracionEstimada} onChange={(e) => setEdicionVideo(p => ({ ...p, duracionEstimada: e.target.value }))} />
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.extraLabel}>Instrucciones</label>
                  <textarea className={styles.extraTextarea} rows={4} value={edicionVideo.instrucciones} onChange={(e) => setEdicionVideo(p => ({ ...p, instrucciones: e.target.value }))} placeholder="Describe el tipo de edición que necesitas: cortes, transiciones, música, etc..." />
                </div>
              </div>
            )}

            {servicioSlug === 'diseno-logos' && (
              <div className={styles.extraSection}>
                <h3 className={styles.extraTitle}>Detalles del Diseño de Logos</h3>
                <div className={styles.extraGrid}>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Nombre de la Marca</label>
                    <input className={styles.extraInput} type="text" placeholder="Nombre de la empresa/marca" value={disenoLogo.nombreMarca} onChange={(e) => setDisenoLogo(p => ({ ...p, nombreMarca: e.target.value }))} />
                  </div>
                  <div className={styles.extraGroup}>
                    <label className={styles.extraLabel}>Estilo</label>
                    <select className={styles.extraInput} value={disenoLogo.estilo} onChange={(e) => setDisenoLogo(p => ({ ...p, estilo: e.target.value }))}>
                      <option value="moderno">Moderno</option>
                      <option value="minimalista">Minimalista</option>
                      <option value="corporativo">Corporativo</option>
                      <option value="elegante">Elegante</option>
                      <option value="creativo">Creativo</option>
                    </select>
                  </div>
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.extraLabel}>Colores de referencia</label>
                  <input className={styles.extraInput} type="text" placeholder="Ej: Azul corporativo, Rojo, Blanco" value={disenoLogo.coloresRef} onChange={(e) => setDisenoLogo(p => ({ ...p, coloresRef: e.target.value }))} />
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.extraLabel}>Detalle del Pedido</label>
                  <textarea className={styles.extraTextarea} rows={4} placeholder="Describe lo que necesitas: estilo, referencias, texto a incluir, etc..." value={detallePedido} onChange={(e) => setDetallePedido(e.target.value)} />
                </div>
                <div className={styles.extraGroup}>
                  <label className={styles.extraLabel}>Dimensiones (opcional)</label>
                  <div className={styles.extraGrid}>
                    <input className={styles.extraInput} type="number" min="1" placeholder="Ancho cm" value={dimensiones.ancho} onChange={(e) => setDimensiones(p => ({ ...p, ancho: e.target.value }))} />
                    <input className={styles.extraInput} type="number" min="1" placeholder="Alto cm" value={dimensiones.alto} onChange={(e) => setDimensiones(p => ({ ...p, alto: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            <div className={styles.extraSection}>
              <h3 className={styles.extraTitle}>Archivos Complementarios</h3>
              <div className={styles.extraGroup}>
                <div className={styles.refUploadArea}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ai,.psd,.zip,.rar"
                    multiple
                    onChange={handleComplementarioChange}
                    className={styles.refInput}
                  />
                  <span className={styles.refHint}>Sube archivos (imágenes, PDFs, documentos, ZIPs) - puedes seleccionar varios</span>
                </div>
                {archivosComplementarios.length > 0 && (
                  <div className={styles.refList}>
                    {archivosComplementarios.map((f, i) => (
                      <div key={i} className={styles.refItem}>
                        <span className={styles.refIcon}>{f.tipo === 'pdf' ? '📕' : f.tipo.match(/doc|xls|ai|psd/) ? '📄' : '🖼️'}</span>
                        <span className={styles.refName}>{f.nombre}</span>
                        <button type="button" className={styles.refRemove} onClick={() => eliminarComplementario(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {pasoActual === 3 && (
          <div className={styles.pasoContenido}>
            <h2>Paso 3: Resumen del Pedido</h2>
            <p className={styles.descripcion}>Revisa los detalles antes de confirmar</p>

            <div className={styles.resumen}>
              <div className={styles.resumenSeccion}>
                <h3>Servicio</h3>
                <div className={styles.resumenItem}>
                  {servicio?.imagen ? (
                    <img src={servicio.imagen} alt={servicio.nombre} className={styles.resumenImg} />
                  ) : (
                    <span>{servicio?.icono}</span>
                  )}
                  <span>{servicio?.nombre}</span>
                </div>
              </div>

              <div className={styles.resumenSeccion}>
                <h3>Diseño</h3>
                {disenoSeleccionado?.diseno && (
                  <div className={styles.resumenItem}>
                    {disenoSeleccionado.diseno.imagen ? (
                      <img src={disenoSeleccionado.diseno.imagen} alt={disenoSeleccionado.diseno.nombre} className={styles.resumenImg} />
                    ) : (
                      <span className={styles.resumenIcon}>📄</span>
                    )}
                    <span>Diseño: {disenoSeleccionado.diseno.nombre}</span>
                    {disenoSeleccionado.diseno.ancho && disenoSeleccionado.diseno.alto && (
                      <span className={styles.resumenMedida}>{disenoSeleccionado.diseno.ancho}x{disenoSeleccionado.diseno.alto} {disenoSeleccionado.diseno.unidad || 'cm'}</span>
                    )}
                  </div>
                )}
                {archivoLocal && (
                  <div className={styles.resumenItem}>
                    {archivoLocal.url && /\.(jpg|jpeg|png|gif|svg)$/i.test(archivoLocal.nombre) ? (
                      <img src={archivoLocal.url} alt="Upload" className={styles.resumenImg} />
                    ) : (
                      <span className={styles.resumenIcon}>📄</span>
                    )}
                    <span>Archivo: {archivoLocal.nombre}</span>
                  </div>
                )}
              </div>

              <div className={styles.resumenSeccion}>
                <h3>Configuración</h3>
                {materialSeleccionado && (
                  <>
                    <p>Material: {materialSeleccionado.nombre}</p>
                    <p>Tipo: {materialSeleccionado.tipo}</p>
                    <p>Cantidad: {cantidad}</p>
                  </>
                )}
              </div>

              {archivosComplementarios.length > 0 && (
                <div className={styles.resumenSeccion}>
                  <h3>Archivos Complementarios</h3>
                  <div className={styles.refResumenList}>
                    {archivosComplementarios.map((f, i) => (
                      <div key={i} className={styles.resumenItem}>
                        <span>{f.tipo === 'pdf' ? '📕' : f.tipo.match(/doc|xls|ai|psd/) ? '📄' : '🖼️'}</span>
                        <span>{f.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(servicioSlug === 'diseno-logos') && (detallePedido || dimensiones.ancho || dimensiones.alto) && (
                <div className={styles.resumenSeccion}>
                  <h3>Detalles del Logo</h3>
                  {disenoLogo.nombreMarca && <p>Marca: {disenoLogo.nombreMarca}</p>}
                  {disenoLogo.estilo && <p>Estilo: {disenoLogo.estilo}</p>}
                  {disenoLogo.coloresRef && <p>Colores: {disenoLogo.coloresRef}</p>}
                  {dimensiones.ancho && dimensiones.alto && <p>Dimensiones: {dimensiones.ancho} x {dimensiones.alto} cm</p>}
                  {detallePedido && <p className={styles.resumenDetalle}>{detallePedido}</p>}
                  {archivosReferencia.length > 0 && (
                    <div className={styles.refResumenList}>
                      <p><strong>Referencias ({archivosReferencia.length}):</strong></p>
                      <div className={styles.refResumenGrid}>
                        {archivosReferencia.map((ref, i) => (
                          <div key={i} className={styles.refResumenItem}>
                            {ref.tipo === 'pdf' ? <span>📕</span> : <img src={ref.url} alt={ref.nombre} className={styles.refResumenImg} />}
                            <span className={styles.refResumenName}>{ref.nombre}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {servicioSlug === 'impresiones' && (
                <div className={styles.resumenSeccion}>
                  <h3>Detalles de Impresión</h3>
                  <p>Tamaño: {impresion.tamano}</p>
                  <p>Orientación: {impresion.orientacion}</p>
                  <p>Resolución: {impresion.resolucion} DPI</p>
                  <p>Papel: {impresion.tipoPapel}</p>
                  <p>Color: {impresion.color}</p>
                </div>
              )}
              {servicioSlug === 'empastados' && (
                <div className={styles.resumenSeccion}>
                  <h3>Detalles de Empastado</h3>
                  <p>Tapa: {empastado.tipoTapa}</p>
                  <p>Grabado: {empastado.grabado}</p>
                  <p>Corrección académica: {empastado.correccionAcademica ? 'Sí' : 'No'}</p>
                  <p>Impresión interna: {empastado.impresionInterna ? 'Sí' : 'No'}</p>
                </div>
              )}
              {servicioSlug === 'fotocheck' && (
                <div className={styles.resumenSeccion}>
                  <h3>Detalles de Fotocheck</h3>
                  <p>Diseño propio: {fotocheck.usaDisenoPropio ? 'Sí' : 'No'}</p>
                  <p>Carga masiva: {fotocheck.cargaMasiva ? 'Sí' : 'No'}</p>
                  {fotocheck.notas && <p>Notas: {fotocheck.notas}</p>}
                </div>
              )}
              {servicioSlug === 'sellos-personalizados' && (
                <div className={styles.resumenSeccion}>
                  <h3>Detalles del Sello</h3>
                  <p>Tipo: {sello.tipoSello}</p>
                  <p>Mecanismo: {sello.mecanismo}</p>
                  <p>Forma: {sello.forma}</p>
                  <p>Texto: {sello.contenidoTexto}</p>
                  <p>Firma vectorizada: {sello.firmaVectorizada ? 'Sí' : 'No'}</p>
                </div>
              )}
              {servicioSlug === 'edicion-audio-video' && (
                <div className={styles.resumenSeccion}>
                  <h3>Detalles de Edición</h3>
                  <p>Formato: {edicionVideo.formatoSalida}</p>
                  {edicionVideo.duracionEstimada && <p>Duración: {edicionVideo.duracionEstimada}</p>}
                  {edicionVideo.instrucciones && <p>Instrucciones: {edicionVideo.instrucciones}</p>}
                </div>
              )}

              <div className={styles.resumenTotal}>
                <span>Total a pagar:</span>
                <span className={styles.totalAmount}>S/ {calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.nota}>
              <p>Al confirmar tu pedido, recibirás un correo con el seguimiento y podrás ver el estado en tu perfil.</p>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        {pasoActual > 1 && (
          <Button variant="outline" onClick={handleAnterior}>
            ← Anterior
          </Button>
        )}
        {pasoActual < 3 ? (
          <Button onClick={handleSiguiente}>
            Siguiente →
          </Button>
        ) : (
          <Button onClick={handleFinalizar} isLoading={loadingSubmit}>
            {loadingSubmit ? 'Confirmando...' : 'Confirmar Pedido'}
          </Button>
        )}
      </footer>
    </div>
  );
};

export default WizardBase;