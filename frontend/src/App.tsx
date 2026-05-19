import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo } from 'react';
import { CatalogoProvider, CarritoProvider, PedidoProvider, useCatalogoStore } from './store';
import { ToastProvider, Spinner } from './components/ui';
import { Navbar } from './components/Navbar';
import { useAuthStore } from './stores';
import { useSocket } from './hooks/useSocket';
import './App.css';

/** Mantiene socket y notificaciones en tiempo real mientras hay sesión */
function SocketBridge() {
  useSocket();
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const RoleSelector = lazy(() => import('./pages/RoleSelector').then(m => ({ default: m.RoleSelector })));
const Catalogo = lazy(() => import('./pages/Catalogo').then(m => ({ default: m.Catalogo })));
const Carrito = lazy(() => import('./pages/Carrito').then(m => ({ default: m.Carrito })));
const Perfil = lazy(() => import('./pages/Perfil').then(m => ({ default: m.Perfil })));
import { Administracion } from './pages/Administracion';
const Servicios = lazy(() => import('./pages/Servicios').then(m => ({ default: m.Servicios })));
const WizardBase = lazy(() => import('./pages/Wizards/WizardBase').then(m => ({ default: m.WizardBase })));
const Importacion = lazy(() => import('./pages/Importacion').then(m => ({ default: m.Importacion })));
const DisenoLogos = lazy(() => import('./pages/DisenoLogos').then(m => ({ default: m.DisenoLogos })));
const Empaste = lazy(() => import('./pages/Empaste').then(m => ({ default: m.Empaste })));
const Multimedia = lazy(() => import('./pages/Multimedia').then(m => ({ default: m.Multimedia })));


function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Spinner size="lg" />
    </div>
  );
}

function Redirect({ to }: { to: string }) {
  const navigate = useNavigate();
  useLayoutEffect(() => { navigate(to, { replace: true }); }, []);
  return null;
}

function HomeRoute() {
  const { usuario, isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <Loading />;
  if (!isAuthenticated || !usuario) return <RoleSelector />;
  if (usuario.rol === 'admin') return <Redirect to="/admin" />;
  if (usuario.rol === 'diseniador') return <Redirect to="/diseniador" />;
  if (usuario.rol === 'cliente') return <Redirect to="/usuario/catalogo" />;
  return <RoleSelector />;
}

function AppRoutes() {
  const servicios = useCatalogoStore((s) => s.servicios);
  const serviciosActivos = useMemo(() => servicios.filter((s) => s.activo !== false), [servicios]);

  return (
    <>
        <Navbar />
        <main className="app-main">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />

            <Route path="/usuario/catalogo" element={<Catalogo />} />
            <Route path="/usuario/servicios" element={<Servicios />} />
            {serviciosActivos.map((servicio) => (
              <Route key={servicio.slug} path={`/usuario/wizard/${servicio.slug}`} element={<WizardBase servicioSlug={servicio.slug} />} />
            ))}
            <Route path="/usuario/carrito" element={<Carrito />} />
            <Route path="/usuario/perfil" element={<Perfil />} />
            <Route path="/usuario/diseno-logos" element={<DisenoLogos />} />
            <Route path="/usuario/empaste" element={<Empaste />} />
            <Route path="/usuario/multimedia" element={<Multimedia />} />

            <Route path="/admin" element={<Administracion />} />
            <Route path="/admin/importar" element={<Importacion type="pedidos" />} />

            <Route path="/diseniador" element={<Administracion />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CatalogoProvider>
          <CarritoProvider>
            <PedidoProvider>
              <Router>
                <SocketBridge />
                <AppRoutes />
              </Router>
            </PedidoProvider>
          </CarritoProvider>
        </CatalogoProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;