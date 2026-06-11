import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches rendering errors anywhere in the React tree and shows a friendly
 * fallback instead of a blank white screen.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // In production this is where we'd forward to an error monitoring service.
    console.error('Uncaught error in React tree:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-error" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Une erreur est survenue</h1>
            <p className="text-muted mb-8">
              Quelque chose s'est mal passé de notre côté. Vous pouvez recharger l'application
              pour continuer.
            </p>
            <button
              onClick={this.handleReload}
              className="btn btn-primary px-6 py-3"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
