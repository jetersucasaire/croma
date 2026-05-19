import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '../components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          padding: '32px',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            Algo salió mal
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>
          <Button onClick={this.handleReset}>
            Recargar página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;