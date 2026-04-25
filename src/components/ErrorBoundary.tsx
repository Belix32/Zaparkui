import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React render errors
 * Shows a generic error message to users while logging details for developers
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the full error details to console (not to user)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Here you could also send to error tracking service like Sentry
    // errorTrackingService.capture(error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Что-то пошло не так</h1>
            <p style={styles.message}>
              При загрузке приложения произошла ошибка. Пожалуйста, попробуйте обновить страницу.
            </p>
            <button 
              style={styles.button}
              onClick={this.handleRetry}
              type="button"
            >
              Попробовать снова
            </button>
            <button 
              style={styles.secondaryButton}
              onClick={() => window.location.reload()}
              type="button"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles for fallback UI
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f8f9fa',
  },
  card: {
    maxWidth: '400px',
    width: '100%',
    padding: '32px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '12px',
  },
  message: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  button: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  secondaryButton: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#2563eb',
    backgroundColor: 'transparent',
    border: '1px solid #2563eb',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};