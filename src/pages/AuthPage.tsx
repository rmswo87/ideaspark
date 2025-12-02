// 로그인/회원가입 페이지
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  async function handleAuth() {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        
        if (signUpError) {
          setError(signUpError.message);
          addToast({
            title: '회원가입 실패',
            description: signUpError.message,
            variant: 'destructive',
          });
        } else {
          setMessage('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
          addToast({
            title: '회원가입 완료',
            description: '이메일 확인 링크를 보냈습니다. 이메일을 확인해주세요.',
            variant: 'success',
          });
          // 이메일 확인 필요 시
          if (data.user && !data.session) {
            setMessage('이메일 확인 링크를 보냈습니다. 이메일을 확인해주세요.');
          } else {
            // 자동 로그인된 경우
            navigate('/');
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (signInError) {
          setError(signInError.message);
          addToast({
            title: '로그인 실패',
            description: signInError.message,
            variant: 'destructive',
          });
        } else {
          addToast({
            title: '로그인 성공',
            description: '환영합니다!',
            variant: 'success',
          });
          navigate('/');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      addToast({
        title: '오류 발생',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: 'google' | 'github' | 'kakao') {
    setSocialLoading(provider);
    setError(null);
    setMessage(null);

    try {
      // 프로덕션 환경에서는 실제 도메인 사용, 개발 환경에서는 현재 origin 사용
      const redirectTo = import.meta.env.PROD 
        ? 'https://ideaspark-pi.vercel.app/'
        : `${window.location.origin}/`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        },
      });

      // OAuth URL이 반환되면 자동으로 리디렉션됨
      if (data?.url) {
        // 리디렉션이 자동으로 처리되므로 여기서는 아무것도 하지 않음
        return;
      }

      if (oauthError) {
        // 에러 메시지 개선
        let errorMessage = oauthError.message;
        if (oauthError.message?.includes('provider is not enabled') || oauthError.message?.includes('Unsupported provider')) {
          const providerName = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'Kakao';
          errorMessage = `${providerName} OAuth Provider가 활성화되지 않았습니다. Supabase Dashboard에서 ${providerName} Provider를 활성화해주세요.`;
        }
        
        setError(errorMessage);
        const providerName = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'Kakao';
        addToast({
          title: `${providerName} 로그인 실패`,
          description: errorMessage,
          variant: 'destructive',
        });
        setSocialLoading(null);
      }
      // OAuth는 리디렉션이 발생하므로 여기서 navigate할 필요 없음
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      addToast({
        title: '오류 발생',
        description: errorMessage,
        variant: 'destructive',
      });
      setSocialLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">IdeaSpark</CardTitle>
          </div>
          <CardDescription>
            {isSignUp ? '새 계정 만들기' : '로그인하여 시작하세요'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div 
              id="auth-error"
              className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm sm:text-base text-destructive break-words flex-1">{error}</p>
            </div>
          )}
          {message && (
            <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-primary break-words flex-1">{message}</p>
            </div>
          )}
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading && !socialLoading) {
                handleAuth();
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="email-input" className="text-sm font-medium">이메일</label>
              <Input
                id="email-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || !!socialLoading}
                aria-label="이메일 주소"
                aria-required="true"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && !socialLoading) {
                    handleAuth();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password-input" className="text-sm font-medium">비밀번호</label>
              <Input
                id="password-input"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!socialLoading}
                aria-label="비밀번호"
                aria-required="true"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && !socialLoading) {
                    handleAuth();
                  }
                }}
              />
            </div>

            <Button 
              type="submit"
              className="w-full min-h-[44px] sm:min-h-0" 
              disabled={loading || !!socialLoading}
              aria-label={isSignUp ? '회원가입' : '로그인'}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                isSignUp ? '회원가입' : '로그인'
              )}
            </Button>
          </form>

          {/* 소셜 로그인 구분선 */}
          <div className="relative my-4 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm uppercase">
              <span className="bg-card px-2 sm:px-4 text-muted-foreground">
                또는
              </span>
            </div>
          </div>

          {/* 소셜 로그인 버튼 */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px] sm:min-h-[40px] flex items-center justify-center gap-2 sm:gap-3 bg-background hover:bg-accent border-border"
              onClick={() => handleSocialLogin('google')}
              disabled={loading || !!socialLoading}
              aria-label="Google로 로그인"
            >
              {socialLoading === 'google' ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-sm sm:text-base">처리 중...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">Google로 계속하기</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px] sm:min-h-[40px] flex items-center justify-center gap-2 sm:gap-3 bg-background hover:bg-accent border-border"
              onClick={() => handleSocialLogin('github')}
              disabled={loading || !!socialLoading}
              aria-label="GitHub로 로그인"
            >
              {socialLoading === 'github' ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-sm sm:text-base">처리 중...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.532 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">GitHub로 계속하기</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px] sm:min-h-[40px] flex items-center justify-center gap-2 sm:gap-3 bg-[#FEE500] hover:bg-[#FDD835] border-[#FEE500] text-[#000000]"
              onClick={() => handleSocialLogin('kakao')}
              disabled={loading || !!socialLoading}
              aria-label="Kakao로 로그인"
            >
              {socialLoading === 'kakao' ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-sm sm:text-base">처리 중...</span>
                </>
              ) : (
                <>
                  <img 
                    src="/kakao_login_medium_narrow.png" 
                    alt="Kakao 로그인" 
                    className="h-4 w-auto sm:h-5"
                    aria-hidden="true"
                  />
                  <span className="text-sm sm:text-base font-medium">카카오 로그인</span>
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              disabled={loading || !!socialLoading}
              className="text-xs sm:text-sm"
            >
              {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


