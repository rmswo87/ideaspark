// 문의/피드백 페이지
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Building2, MessageSquare, Check } from 'lucide-react';
import { createContactInquiry } from '@/services/contactService';

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
    } else {
      console.log('Email notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

export function ContactPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<'business' | 'feedback'>('business');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });

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
      alert((mode === 'feedback' ? '피드백' : '문의') + ' 제출에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          홈으로
        </Button>

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
              onClick={() => setMode('business')}
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

          <Card>
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
                      <Label htmlFor="contact-company">회사명</Label>
                      <Input
                        id="contact-company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="회사명 (선택사항)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-phone">전화번호</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="010-1234-5678 (선택사항)"
                      />
                    </div>
                  </div>
                  {mode === 'business' && (
                    <div>
                      <Label htmlFor="contact-subject">문의 제목 *</Label>
                      <Input
                        id="contact-subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="문의 제목을 입력하세요"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="contact-message">
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
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={submitting}>
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

        {/* IdeaSpark 정보 섹션 */}
        <div className="mt-16 border-t pt-8">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">IdeaSpark</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium">주요 기능:</span>
                        <ul className="list-disc list-inside ml-2 mt-1 text-muted-foreground space-y-1">
                          <li>Reddit 아이디어 자동 수집</li>
                          <li>AI 기반 PRD 생성</li>
                          <li>개발 계획서 작성</li>
                          <li>커뮤니티 기능</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-center md:text-right">
                    <p className="font-medium text-foreground mb-1">© {new Date().getFullYear()} IdeaSpark</p>
                    <p>모든 권리 보유</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
