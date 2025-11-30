// 문의/피드백 페이지
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Building2, MessageSquare, Check, User as UserIcon, LogOut, Shield } from 'lucide-react';
import { createContactInquiry } from '@/services/contactService';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import { Footer } from '@/components/Footer';
import { ProfileNotificationBadge } from '@/components/ProfileNotificationBadge';
import { MobileMenu } from '@/components/MobileMenu';
import { useToast } from '@/components/ui/toast';

// 이메일 알림 전송 함수 (Supabase Edge Function 호출)
async function sendEmailNotification(data: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-contact-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email notification:', error);
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

export function ContactPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<'business' | 'feedback'>('business');
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });

  // 부드러운 스크롤 함수
  const smoothScrollToForm = () => {
    if (formRef.current) {
      const headerOffset = 80; // 헤더 높이 고려
      const elementPosition = formRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // 모드 변경 시 스크롤
  useEffect(() => {
    if (mode) {
      // 약간의 지연을 두어 모드 변경 후 스크롤
      setTimeout(() => {
        smoothScrollToForm();
      }, 100);
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const subject = mode === 'feedback' && !formData.subject ? '피드백' : formData.subject;

      await createContactInquiry({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined,
        phone: formData.phone || undefined,
        subject,
        message: formData.message,
      });

      sendEmailNotification({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        subject,
        message: formData.message,
      }).catch(err => {
        console.error('Failed to send email notification:', err);
      });

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: '',
      });

      setTimeout(() => {
        setSubmitted(false);
        setMode('business');
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      addToast({
        title: '제출 실패',
        description: (mode === 'feedback' ? '피드백' : '문의') + ' 제출에 실패했습니다: ' + (error.message || '알 수 없는 오류'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-0 sm:py-1.5">
          <div className="flex flex-row items-center justify-between gap-1 sm:gap-0 h-10 sm:h-auto">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* 모바일 햄버거 메뉴 */}
              <div className="md:hidden">
                <MobileMenu />
              </div>
              <h1 
                className="text-sm sm:text-2xl font-bold cursor-pointer select-none touch-manipulation leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent hover:from-primary hover:to-primary/70 transition-all duration-300" 
                onClick={() => {
                  if (location.pathname === '/') {
                    window.location.reload();
                  } else {
                    navigate('/');
                  }
                }}
              >
                IdeaSpark
              </h1>
              <nav className="hidden md:flex gap-1 sm:gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname === '/' 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  아이디어
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/community')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname.includes('/community') 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  커뮤니티
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contact')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname.includes('/contact') 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  문의 / 피드백
                </Button>
              </nav>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-primary/5 hover:text-primary transition-all duration-300 border-border/50"
                    >
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">관리자</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="text-xs sm:text-sm relative h-8 sm:h-9 px-2 sm:px-3 hover:bg-primary/5 hover:text-primary transition-all duration-300 border-border/50"
                  >
                    <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">프로필</span>
                    <ProfileNotificationBadge />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      navigate('/auth')
                    }}
                    className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 border-border/50"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-border/50 hover:border-primary/50"
                >
                  <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8">

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">문의 및 피드백</h1>
            <p className="text-muted-foreground">
              IdeaSpark에 대한 문의사항이나 피드백을 남겨주세요.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                mode === 'business' ? 'border-primary' : ''
              }`}
              onClick={() => {
                setMode('business');
                smoothScrollToForm();
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">비즈니스 문의</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  파트너십, 제휴, 기업용 솔루션 등 비즈니스 관련 문의사항을 남겨주세요.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                mode === 'feedback' ? 'border-primary' : ''
              }`}
              onClick={() => {
                setMode('feedback');
                setFormData({ ...formData, subject: '피드백' });
                smoothScrollToForm();
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">피드백</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  아이디어나 개선사항이 있으시다면 언제든지 알려주세요.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card ref={formRef}>
            <CardHeader>
              <CardTitle>{mode === 'business' ? '비즈니스 문의' : '피드백 보내기'}</CardTitle>
              <CardDescription>
                {mode === 'business'
                  ? '문의사항을 남겨주시면 빠르게 답변드리겠습니다.'
                  : 'IdeaSpark 사용 경험과 개선 아이디어를 자유롭게 남겨주세요.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-semibold mb-2">
                    {mode === 'business' ? '문의가 접수되었습니다!' : '피드백이 접수되었습니다!'}
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    빠른 시일 내에 답변드리겠습니다.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="contact-name">이름 *</Label>
                    <Input
                      id="contact-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">이메일 *</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@company.com"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="contact-company" className="text-sm sm:text-base">
                        회사명
                      </Label>
                      <Input
                        id="contact-company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="회사명 (선택사항)"
                        aria-label="회사명"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-phone" className="text-sm sm:text-base">
                        전화번호
                      </Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="010-1234-5678 (선택사항)"
                        aria-label="전화번호"
                      />
                    </div>
                  </div>
                  {mode === 'business' && (
                    <div>
                      <Label htmlFor="contact-subject" className="text-sm sm:text-base">
                        문의 제목 *
                      </Label>
                      <Input
                        id="contact-subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="문의 제목을 입력하세요"
                        aria-required="true"
                        aria-label="문의 제목"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="contact-message" className="text-sm sm:text-base">
                      {mode === 'business' ? '문의 내용 *' : '피드백 내용 *'}
                    </Label>
                    <Textarea
                      id="contact-message"
                      required
                      rows={8}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={
                        mode === 'business'
                          ? '문의 내용을 상세히 입력해주세요'
                          : '피드백을 자유롭게 입력해주세요'
                      }
                      aria-required="true"
                      aria-label={mode === 'business' ? '문의 내용' : '피드백 내용'}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full min-h-[44px] sm:min-h-0" 
                    size="lg" 
                    disabled={submitting}
                    aria-label={mode === 'business' ? '문의 제출' : '피드백 제출'}
                  >
                    {submitting ? (
                      <>
                        <Send className="h-4 w-4 mr-2 animate-pulse" />
                        제출 중...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {mode === 'business' ? '문의 제출' : '피드백 제출'}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
