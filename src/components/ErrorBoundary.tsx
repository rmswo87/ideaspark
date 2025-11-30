// 에러 바운더리 컴포넌트
import { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl break-words">오류가 발생했습니다</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm sm:text-base text-destructive break-words">
                  {this.state.error?.message 
                    ? String(this.state.error.message)
                    : this.state.error?.toString 
                      ? String(this.state.error.toString())
                      : '알 수 없는 오류가 발생했습니다.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="flex-1 min-h-[44px] sm:min-h-0"
                >
                  페이지 새로고침
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="flex-1 min-h-[44px] sm:min-h-0"
                >
                  홈으로 돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

