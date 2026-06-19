import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={this.state.error?.message}
          extra={<Button onClick={() => this.setState({ hasError: false, error: null })}>Try Again</Button>}
        />
      );
    }
    return this.props.children;
  }
}
