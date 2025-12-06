// 프리미엄 기능 페이지
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { useAdmin } from '@/hooks/useAdmin';
import { PremiumBadge } from '@/components/PremiumBadge';
import { useToast } from '@/components/ui/toast';

export function PremiumPage() {
  const navigate = useNavigate();
  const { isPremium, loading: premiumLoading } = usePremium();
  const { isAdmin } = useAdmin();
  const { addToast } = useToast();
  const [donationCopied, setDonationCopied] = useState(false);
  const [donationShowQR, setDonationShowQR] = useState(false);
  
  // 관리자는 프리미엄 기능 사용 가능
  const canUsePremium = isPremium || isAdmin;

  const donationBankName = '카카오뱅크';
  const donationAccountNumber = '3333258583773';
  const donationAccountHolder = '자취만렙';
  const qrCodeUrl = typeof window !== 'undefined' 
    ? new URL('/QR.png', window.location.origin).href 
    : '/QR.png';

  if (premiumLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>뒤로</span>
            </Button>
            <h1 className="text-2xl font-bold">프리미엄 기능</h1>
            {canUsePremium && <PremiumBadge className="ml-auto" />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* 프리미엄 상태 카드 */}
          <Card className={canUsePremium ? 'border-primary/50 bg-primary/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl mb-2">
                {canUsePremium ? (
                  <>
                    <Crown className="h-5 w-5 text-yellow-500" />
                    프리미엄 회원
                    <PremiumBadge className="ml-auto" />
                    {isAdmin && (
                      <span className="ml-2 text-sm text-muted-foreground">(관리자 권한)</span>
                    )}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-primary" />
                    프리미엄 회원 가입
                  </>
                )}
              </CardTitle>
              {canUsePremium ? (
                <p className="text-sm text-muted-foreground">
                  프리미엄 회원으로 AI 아이디어 평가 기능을 사용할 수 있습니다.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  후원하시면 프리미엄 회원이 되어 AI 아이디어 평가 기능을 사용할 수 있습니다.
                </p>
              )}
            </CardHeader>
            {!canUsePremium && (
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium mb-1">프리미엄 기능</div>
                      <ul className="text-muted-foreground space-y-1 text-xs">
                        <li>• AI 기반 아이디어 평가 (비타민/경쟁율/섹시함 점수)</li>
                        <li>• 최근 검색 아이디어 중 상위 3개 자동 추천</li>
                        <li>• 업무 난이도 평가 및 AI 분석 결과</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    아래 후원 방법으로 후원하시면 관리자가 확인 후 프리미엄 회원으로 등록해드립니다.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 도네이션 박스 */}
          {!canUsePremium && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl mb-2">개발자를 위한 커피 한 잔 ☕</CardTitle>
                <p className="text-sm text-muted-foreground">
                  IdeaSpark가 도움이 되셨다면, 작은 후원으로 개발을 응원해 주세요.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">은행 및 계좌번호</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-base flex-1">
                        {donationBankName} {donationAccountNumber}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(donationAccountNumber)
                            .then(() => {
                              setDonationCopied(true);
                              setTimeout(() => setDonationCopied(false), 2000);
                            })
                            .catch(() => {
                              addToast({
                                title: '복사 실패',
                                description: '계좌번호 복사에 실패했습니다. 수동으로 복사해주세요.',
                                variant: 'destructive',
                              });
                            });
                        }}
                      >
                        {donationCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            복사됨
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            복사
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">예금주</Label>
                    <p className="text-sm text-muted-foreground mt-1">{donationAccountHolder}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">카카오페이 QR</Label>
                    <a
                      href="https://qr.kakaopay.com/Ej7sjRH31"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      https://qr.kakaopay.com/Ej7sjRH31
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDonationShowQR(true)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR 코드 보기
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    피드백과 문의도 언제나 환영입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 프리미엄 기능 상세 설명 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">프리미엄 기능 상세</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Crown className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">AI 기반 아이디어 평가</h3>
                    <p className="text-sm text-muted-foreground">
                      각 아이디어에 대해 비타민 점수, 경쟁율 점수, 섹시함 점수를 AI가 평가합니다. 
                      각 점수는 0-10점이며, 총 30점 만점입니다. 또한 업무 난이도(하/중/상)와 
                      상세한 AI 분석 결과를 제공합니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">카테고리 기반 추천 아이디어</h3>
                    <p className="text-sm text-muted-foreground">
                      사용자의 관심 카테고리 내에서 AI 평가 점수가 높은 상위 3개 아이디어를 
                      자동으로 추천합니다. 홈페이지에서 항상 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">업무 난이도 평가</h3>
                    <p className="text-sm text-muted-foreground">
                      각 아이디어의 구현 난이도를 AI가 분석하여 하/중/상으로 분류하고, 
                      상세한 분석 결과를 제공합니다.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* QR 코드 다이얼로그 */}
      <Dialog open={donationShowQR} onOpenChange={setDonationShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR 코드로 송금</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
              <img
                src={qrCodeUrl}
                alt="도네이션 QR 코드"
                className="w-full h-full object-contain rounded-lg"
                onError={() => {
                  addToast({
                    title: 'QR 코드 로드 실패',
                    description: 'QR 코드 이미지를 불러올 수 없습니다.',
                    variant: 'destructive',
                  });
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1">{donationBankName}</p>
              <p className="text-xs text-muted-foreground font-mono">{donationAccountNumber}</p>
              <p className="text-xs text-muted-foreground mt-1">예금주: {donationAccountHolder}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
