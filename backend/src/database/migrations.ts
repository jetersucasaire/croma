import { runExec, runQuery, runInsert } from './connection';
import { v4 as uuidv4 } from 'uuid';

export function ejecutarMigraciones(): void {
  runExec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT DEFAULT 'cliente',
      whatsapp TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try { runQuery('SELECT activo FROM usuarios LIMIT 1'); } 
  catch { runExec('ALTER TABLE usuarios ADD COLUMN activo INTEGER DEFAULT 1'); }

  runExec(`
    CREATE TABLE IF NOT EXISTS password_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      password TEXT NOT NULL,
      changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      descripcion TEXT,
      icono TEXT,
      imagen TEXT,
      requisitos TEXT,
      categoria TEXT,
      precio_base REAL DEFAULT 0,
      unidad TEXT DEFAULT 'und',
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      descripcion TEXT,
      imagen TEXT,
      categoria TEXT,
      precio REAL DEFAULT 0,
      precio_oferta REAL,
      stock INTEGER DEFAULT 0,
      unidad TEXT DEFAULT 'und',
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS disenos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      servicio_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      imagen TEXT,
      ancho REAL DEFAULT 0,
      alto REAL DEFAULT 0,
      unidad TEXT DEFAULT 'cm',
      parametros TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    )
  `);
  try { runQuery('SELECT descripcion FROM disenos LIMIT 1'); } 
  catch { runExec('ALTER TABLE disenos ADD COLUMN descripcion TEXT'); }
  try { runQuery('SELECT activo FROM disenos LIMIT 1'); } 
  catch { runExec('ALTER TABLE disenos ADD COLUMN activo INTEGER DEFAULT 1'); }

  runExec(`
    CREATE TABLE IF NOT EXISTS materiales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      servicio_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      tipo TEXT,
      gramaje INTEGER,
      compatible_formato TEXT,
      precio_unitario REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    )
  `);
  try { runQuery('SELECT descripcion FROM materiales LIMIT 1'); } 
  catch { runExec('ALTER TABLE materiales ADD COLUMN descripcion TEXT'); }
  try { runQuery('SELECT activo FROM materiales LIMIT 1'); } 
  catch { runExec('ALTER TABLE materiales ADD COLUMN activo INTEGER DEFAULT 1'); }

  runExec(`
    CREATE TABLE IF NOT EXISTS armazones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      mecanismo TEXT NOT NULL,
      forma TEXT,
      dimensiones_max TEXT,
      precio REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS archivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      usuario_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      url TEXT NOT NULL,
      formato TEXT,
      tamano INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS pedido_archivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      pedido_id INTEGER NOT NULL,
      tipo TEXT DEFAULT 'otros',
      nombre TEXT NOT NULL,
      url TEXT NOT NULL,
      formato TEXT,
      tamano INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      usuario_id INTEGER,
      servicio_id INTEGER,
      diseniador_id INTEGER,
      fase TEXT DEFAULT 'diseno',
      estado_produccion TEXT DEFAULT 'pendiente',
      total REAL DEFAULT 0,
      tracking_id TEXT,
      notas TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    )
  `);

  try { runQuery('SELECT diseniador_id FROM pedidos LIMIT 1'); }
  catch { runExec('ALTER TABLE pedidos ADD COLUMN diseniador_id INTEGER REFERENCES usuarios(id)'); }

  const pedidosColumnas = [
    'cliente_nombre TEXT',
    'cliente_email TEXT',
    'cliente_telefono TEXT',
    'tipo_item TEXT DEFAULT \'servicio\'',
    'item_nombre TEXT',
    'item_descripcion TEXT',
    'medida TEXT',
    'color TEXT',
    'diseno_personalizado TEXT',
    'material TEXT',
  ];
  for (const col of pedidosColumnas) {
    const name = col.split(' ')[0];
    try { runQuery(`SELECT ${name} FROM pedidos LIMIT 1`); }
    catch { runExec(`ALTER TABLE pedidos ADD COLUMN ${col}`); }
  }

  try {
    runExec(`
      UPDATE pedidos SET
        cliente_nombre = (SELECT nombre FROM usuarios WHERE usuarios.id = pedidos.usuario_id),
        cliente_email = (SELECT email FROM usuarios WHERE usuarios.id = pedidos.usuario_id),
        cliente_telefono = (SELECT whatsapp FROM usuarios WHERE usuarios.id = pedidos.usuario_id)
      WHERE usuario_id IS NOT NULL AND (cliente_nombre IS NULL OR cliente_nombre = '')
    `);
  } catch { /* ignore */ }

  runExec(`
    CREATE TABLE IF NOT EXISTS pedido_disenio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      diseno_id INTEGER,
      archivo_url TEXT,
      archivo_nombre TEXT,
      tipo_carga TEXT DEFAULT 'catalogo',
      enlace_externo TEXT,
      parametros TEXT,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (diseno_id) REFERENCES disenos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS pedido_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      material_id INTEGER,
      cantidad INTEGER DEFAULT 1,
      precio_unitario REAL DEFAULT 0,
      opciones TEXT,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (material_id) REFERENCES materiales(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS pedido_seguimiento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      estado TEXT NOT NULL,
      nota TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      servicio_id INTEGER,
      nombre TEXT NOT NULL,
      icono TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS mensajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER,
      remitente_id INTEGER,
      tipo TEXT DEFAULT 'mensaje',
      contenido TEXT NOT NULL,
      leido INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (remitente_id) REFERENCES usuarios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      tipo TEXT,
      titulo TEXT,
      mensaje TEXT,
      referencia_id INTEGER,
      leido INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS historial_contacto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER,
      canal TEXT,
      mensaje TEXT,
      enviado_por INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (enviado_por) REFERENCES usuarios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS proyectos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      usuario_id INTEGER NOT NULL,
      servicio_id INTEGER NOT NULL,
      estado TEXT DEFAULT 'briefing',
      fase_actual INTEGER DEFAULT 1,
      presupuesto REAL DEFAULT 0,
      tracking_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS proyecto_entregas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      etiqueta TEXT DEFAULT 'boceto',
      archivos_json TEXT,
      observaciones TEXT,
      estado TEXT DEFAULT 'pendiente',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS proyecto_preferencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      colores_hex TEXT,
      tipografias TEXT,
      estilo TEXT,
      valores_marca TEXT,
      public_objetivo TEXT,
      eslogan TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS importaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      archivo_original TEXT,
      registros_exitosos INTEGER DEFAULT 0,
      errores_json TEXT,
      estado TEXT DEFAULT 'procesando',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS cotizacion_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_producto TEXT NOT NULL,
      dimensiones_json TEXT,
      orientacion TEXT,
      resolucion INTEGER DEFAULT 300,
      material_preferido TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS pedido_seguimiento_detallado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      tipo_item TEXT DEFAULT 'producto',
      item_id INTEGER,
      item_nombre TEXT,
      item_descripcion TEXT,
      medida TEXT,
      color TEXT,
      diseno TEXT,
      material TEXT,
      cliente_nombre TEXT,
      cliente_telefono TEXT,
      cliente_email TEXT,
      estado TEXT NOT NULL,
      notificado_cliente INTEGER DEFAULT 0,
      notificado_whatsapp INTEGER DEFAULT 0,
      notificado_email INTEGER DEFAULT 0,
      etiqueta_despacho TEXT,
      tracking_id TEXT,
      notas TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS impresion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      tamano VARCHAR(20) NOT NULL,
      orientacion VARCHAR(20) NOT NULL,
      resolucion INTEGER NOT NULL,
      tipo_papel VARCHAR(50) NOT NULL,
      cantidad INTEGER NOT NULL,
      color VARCHAR(20) NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS empastado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      tipo_tapa VARCHAR(50) NOT NULL,
      grabado VARCHAR(30) NOT NULL,
      correccion_academica INTEGER DEFAULT 0,
      impresion_interna INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS diseno_grafico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      tipo_producto VARCHAR(50) NOT NULL,
      tipo_tapa VARCHAR(50),
      material VARCHAR(50),
      acabado VARCHAR(50),
      paleta_colores VARCHAR(255),
      tipografia VARCHAR(100),
      cantidad_tiraje INTEGER NOT NULL,
      estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
      usa_diseno_existente INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS fotocheck (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      usa_diseno_propio INTEGER DEFAULT 0,
      carga_masiva INTEGER DEFAULT 0,
      url_csv VARCHAR(500),
      cantidad INTEGER NOT NULL,
      notas TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS sello_personalizado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      tipo_sello VARCHAR(50) NOT NULL,
      mecanismo VARCHAR(50) NOT NULL,
      forma VARCHAR(30) NOT NULL,
      contenido_texto VARCHAR(300) NOT NULL,
      usa_diseno_existente INTEGER DEFAULT 0,
      firma_vectorizada INTEGER DEFAULT 0,
      estado_produccion VARCHAR(50) NOT NULL DEFAULT 'pendiente',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS edicion_video (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      enlace_externo VARCHAR(500),
      duracion_estimada TEXT,
      formato_salida VARCHAR(20) NOT NULL,
      instrucciones TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS diseno_logo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      nombre_marca VARCHAR(100) NOT NULL,
      estilo VARCHAR(50) NOT NULL,
      colores_ref VARCHAR(100),
      estado_aprobacion VARCHAR(30) NOT NULL DEFAULT 'pendiente',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS version_logo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logo_id INTEGER NOT NULL,
      numero INTEGER NOT NULL,
      url_preview VARCHAR(500) NOT NULL,
      url_vector VARCHAR(500),
      estado VARCHAR(30) NOT NULL,
      comentario_cliente TEXT,
      fecha_subida TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (logo_id) REFERENCES diseno_logo(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS consulta_cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      mensaje TEXT NOT NULL,
      prioridad VARCHAR(20) NOT NULL DEFAULT 'normal',
      respondido INTEGER DEFAULT 0,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS color_producto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diseno_id INTEGER NOT NULL,
      nombre VARCHAR(50) NOT NULL,
      hex VARCHAR(7) NOT NULL,
      FOREIGN KEY (diseno_id) REFERENCES diseno_grafico(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS portafolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      servicio_id INTEGER NOT NULL,
      titulo VARCHAR(150) NOT NULL,
      descripcion TEXT,
      url_imagen TEXT NOT NULL,
      es_portada INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS entrega (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      url_descarga TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      fecha_generacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_expiracion TEXT NOT NULL,
      acceso_restringido INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  runExec(`
    CREATE TABLE IF NOT EXISTS administrador (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL UNIQUE,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  try { runExec('UPDATE disenos SET activo = 1 WHERE activo IS NULL'); } catch {}
  try { runExec('UPDATE materiales SET activo = 1 WHERE activo IS NULL'); } catch {}
  
  // Migrar columnas nuevas en entrega
  try { runQuery('SELECT version FROM entrega LIMIT 1'); } 
  catch { runExec('ALTER TABLE entrega ADD COLUMN version TEXT DEFAULT "1.0"'); }
  try { runQuery('SELECT comentario FROM entrega LIMIT 1'); } 
  catch { runExec('ALTER TABLE entrega ADD COLUMN comentario TEXT'); }

  insertarDatosDemo();
}

function insertarDatosDemo(): void {
  try {
    const result = runQuery('SELECT COUNT(*) as count FROM servicios');
    const count = result.length > 0 && result[0].count ? result[0].count : 0;
    
    if (count === 0) {
      const servicios = [
        [uuidv4(), 'TARJETAS PERSONALES', 'tarjetas-personales', 'Tarjetas de presentacion personalizadas', '🪪', 50, 'millar'],
        [uuidv4(), 'LANYARDS', 'lanyards', 'Lanyards con diseno personalizado', '📿', 30, 'und'],
        [uuidv4(), 'MENUS', 'menus', 'Menus para restaurantes', '📋', 40, 'und'],
        [uuidv4(), 'FOTOCHECK', 'fotocheck', 'Fotochecks para eventos', '🪪', 25, 'und'],
        [uuidv4(), 'IMPRESIONES', 'impresiones', 'Servicios de impresion digital', '🖨️', 10, 'und'],
        [uuidv4(), 'EMPASTADOS', 'empastados', 'Encuadernacion y empaste', '📚', 80, 'und'],
        [uuidv4(), 'EDICION AUDIO/VIDEO', 'edicion-audio-video', 'Edicion profesional multimedia', '🎬', 150, 'hora'],
        [uuidv4(), 'DISENO DE LOGOS', 'diseno-logos', 'Diseno de identidad visual', '🎨', 200, 'proyecto'],
        [uuidv4(), 'SELLOS PERSONALIZADOS', 'sellos-personalizados', 'Sellos grabados personalizados', '🔴', 60, 'und'],
      ];

      for (const s of servicios) {
        runInsert(
          'INSERT INTO servicios (uuid, nombre, slug, descripcion, icono, precio_base, unidad) VALUES (?, ?, ?, ?, ?, ?, ?)',
          s
        );
      }

      const materiales = [
        [uuidv4(), 4, 'Plastificado', 'plastificado', 2, 20000],
        [uuidv4(), 4, 'Mate', 'mate', 1.5, 15000],
        [uuidv4(), 4, 'Hilo', 'hilo', 3, 10000],
        [uuidv4(), 5, 'Papel Bond 80g', 'papel', 0.5, 50000],
        [uuidv4(), 5, 'Papel Couche 150g', 'papel', 1, 30000],
        [uuidv4(), 5, 'Papel Adhesivo', 'adhesivo', 2, 10000],
        [uuidv4(), 6, 'Tapa Dura', 'tapa', 25, 500],
        [uuidv4(), 6, 'Tapa Blanda', 'tapa', 15, 800],
        [uuidv4(), 6, 'Tapa Cuero', 'tapa', 45, 200],
        [uuidv4(), 1, 'Cartulina 300g', 'papel', 45, 10000],
        [uuidv4(), 1, 'Papel Mate 250g', 'papel', 35, 8000],
        [uuidv4(), 9, 'Goma Natural', 'goma', 20, 200],
        [uuidv4(), 9, 'Goma Premium', 'goma', 35, 100],
      ];

      for (const m of materiales) {
        runInsert(
          'INSERT INTO materiales (uuid, servicio_id, nombre, tipo, precio_unitario, stock) VALUES (?, ?, ?, ?, ?, ?)',
          m
        );
      }

      const disenos = [
        [uuidv4(), 1, 'Tarjeta Clasica', 9, 5, 'cm'],
        [uuidv4(), 1, 'Tarjeta Moderna', 9, 5, 'cm'],
        [uuidv4(), 4, 'Fotocheck Basico', 5.4, 8.6, 'cm'],
        [uuidv4(), 4, 'Fotocheck VIP', 5.4, 8.6, 'cm'],
        [uuidv4(), 5, 'A4 Blanco', 21, 29.7, 'cm'],
        [uuidv4(), 5, 'A3 Color', 29.7, 42, 'cm'],
      ];

      for (const d of disenos) {
        runInsert(
          'INSERT INTO disenos (uuid, servicio_id, nombre, ancho, alto, unidad) VALUES (?, ?, ?, ?, ?, ?)',
          d
        );
      }

      const armazones = [
        [uuidv4(), 'Automatico Escritorio', 'automatico', 'rectangular', '{"ancho":5,"alto":3}', 45, 50],
        [uuidv4(), 'Automatico Bolsillo', 'automatico', 'circular', '{"ancho":4,"alto":4}', 35, 30],
      ];

      for (const a of armazones) {
        runInsert(
          'INSERT INTO armazones (uuid, nombre, mecanismo, forma, dimensiones_max, precio, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
          a
        );
      }

      console.log('Datos demo insertados en la base de datos');
    }
  } catch (e) {
    console.log('Error inserting demo data:', e);
  }

  try {
    const hashDiseniadorDev = '$2a$10$gBN1rfS.yh4yXarD.5uyve9kPBMVWjoVR9fPm/orZ50JRaBAOMCRW';
    const userResult = runQuery('SELECT COUNT(*) as count FROM usuarios');
    const userCount = userResult.length > 0 && userResult[0].count ? userResult[0].count : 0;
    if (userCount < 2) {
      const hash = '$2a$10$8KzQMGx5C5Kc5Qy5Q5z5Q.5z5Q5z5Q5z5Q5z5Q5z5Q5z5Q5z5Q';
      const usuariosPrueba = [
        [uuidv4(), 'Carlos Lopez', 'carlos@example.com', hash, 'cliente', '999111222'],
        [uuidv4(), 'Maria Garcia', 'maria@example.com', hash, 'cliente', '999333444'],
        [uuidv4(), 'Juan Perez', 'juan@example.com', hash, 'cliente', '999555666'],
        [uuidv4(), 'Ana Lopez', 'ana@croma.pe', hashDiseniadorDev, 'diseniador', '999111333'],
        [uuidv4(), 'Pedro Ruiz', 'pedro@croma.pe', hashDiseniadorDev, 'diseniador', '999111444'],
      ];
      for (const u of usuariosPrueba) {
        try {
          runInsert(
            'INSERT OR IGNORE INTO usuarios (uuid, nombre, email, password, rol, whatsapp, activo) VALUES (?, ?, ?, ?, ?, ?, 1)',
            u
          );
        } catch (err) { /* ignore */ }
      }
      console.log('Usuarios de prueba insertados');
      console.log('Diseñadores: pedro@croma.pe y ana@croma.pe / Diseniador123!@#$');
    }

    try {
      runUpdate(
        "UPDATE usuarios SET password = ? WHERE rol = 'diseniador' AND email IN ('pedro@croma.pe', 'ana@croma.pe')",
        [hashDiseniadorDev]
      );
    } catch { /* ignore */ }

    const adminExists = runQuery("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
    if (adminExists.length === 0) {
      const adminHash = '$2a$10$y04vsOk5Jp998S8WmqwAH.y6raZ.v7cg/n6bupeCJkYekSmnpY9D6';
      try {
        runInsert(
          'INSERT INTO usuarios (uuid, nombre, email, password, rol, whatsapp, activo) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [uuidv4(), 'Administrador CROMA', 'admin@croma.pe', adminHash, 'admin', '+51 999 888 777']
        );
        console.log('Admin creado: admin@croma.pe / Admin123!@#$');
      } catch (err) { /* ignore if already exists */ }
    }

    const clienteDefault = runQuery("SELECT id FROM usuarios WHERE email = 'cliente@croma.pe' LIMIT 1");
    if (clienteDefault.length === 0) {
      const clienteHash = '$2a$10$e9CZ9dns/5Db/aZSU7xYauxDHcrSL8heaUZCOLIBwb4EGu9azZXCa';
      try {
        runInsert(
          'INSERT INTO usuarios (uuid, nombre, email, password, rol, whatsapp, activo) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [uuidv4(), 'Cliente CROMA', 'cliente@croma.pe', clienteHash, 'cliente', '+51 999 111 222']
        );
        console.log('Cliente creado: cliente@croma.pe / Cliente123!@#$');
      } catch (err) { /* ignore if already exists */ }
    }
  } catch (e) {
    console.log('Error inserting users:', e);
  }
}