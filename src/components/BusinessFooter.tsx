// 비즈니스 문의 Footer 컴포넌트
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send, Building2, MessageSquare, Check } from 'lucide-react';
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

    // Supabase Edge Function 호출
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
      // 이메일 전송 실패해도 문의는 저장되므로 에러를 throw하지 않음
    } else {
      console.log('Email notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // 이메일 전송 실패해도 문의는 저장되므로 에러를 throw하지 않음
  }
}

export function BusinessFooter() {
  const [showContactDialog, setShowContactDialog] = useState(false);
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

      // contactService를 사용하여 문의/피드백 저장
      await createContactInquiry({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined,
        phone: formData.phone || undefined,
        subject,
        message: formData.message,
      });

      // 이메일 알림 전송 (비동기, 실패해도 문의는 저장됨)
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
        setShowContactDialog(false);
        setSubmitted(false);
        setMode('business');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      alert('문의 제출에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer id="contact-section" className="border-t bg-muted/30 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* 비즈니스 문의 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">비즈니스 문의</CardTitle>
              </div>
              <CardDescription className="text-sm">
                파트너십, 제휴, 기업용 솔루션 등 비즈니스 관련 문의사항을 남겨주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg" onClick={() => setMode('business')}>
                    <Mail className="h-4 w-4 mr-2" />
                    문의하기
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{mode === 'business' ? '비즈니스 문의' : '피드백 보내기'}</DialogTitle>
                    <DialogDescription>
                      {mode === 'business'
                        ? '문의사항을 남겨주시면 빠르게 답변드리겠습니다.'
                        : 'IdeaSpark 사용 경험과 개선 아이디어를 자유롭게 남겨주세요.'}
                    </DialogDescription>
                  </DialogHeader>
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-8">
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
                      <div>
                        <Label htmlFor="contact-subject">{mode === 'business' ? '문의 제목 *' : '피드백 제목 (선택)'}</Label>
                        <Input
                          id="contact-subject"
                          required={mode === 'business'}
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder={mode === 'business' ? '문의 제목을 입력하세요' : '예: UX 개선 제안'}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-message">{mode === 'business' ? '문의 내용 *' : '피드백 내용 *'}</Label>
                        <Textarea
                          id="contact-message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder={mode === 'business' ? '문의 내용을 상세히 입력해주세요' : '아이디어, 개선 요청, 칭찬/불편 사항 등을 자유롭게 적어주세요'}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={submitting}>
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
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* 피드백 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">피드백</CardTitle>
              </div>
              <CardDescription className="text-sm">
                아이디어나 개선사항이 있으시다면 언제든지 알려주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                사용자 피드백은 IdeaSpark를 더 나은 서비스로 만드는 데 큰 도움이 됩니다.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // 피드백 모드로 전환하여 동일한 폼 재사용
                  setMode('feedback');
                  setFormData({
                    ...formData,
                    subject: '피드백',
                  });
                  setShowContactDialog(true);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                피드백 보내기
              </Button>
            </CardContent>
          </Card>

          {/* 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">IdeaSpark</CardTitle>
              <CardDescription className="text-sm">
                Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} IdeaSpark</p>
              <p>모든 권리 보유</p>
              <div className="pt-4 space-y-1">
                <p className="font-medium text-foreground">주요 기능</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Reddit 아이디어 자동 수집</li>
                  <li>AI 기반 PRD 생성</li>
                  <li>개발 계획서 작성</li>
                  <li>커뮤니티 기능</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </footer>
  );
}
