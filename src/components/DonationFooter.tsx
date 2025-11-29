// 도네이션 Footer 컴포넌트
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Coffee, Copy, Check, QrCode, Heart } from 'lucide-react';

export function DonationFooter() {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrError, setQrError] = useState(false);

  // 계좌번호
  const accountNumber = '3333258583773';
  const bankName = '카카오뱅크';
  const accountHolder = '자취만렙';

  // QR 코드 이미지 URL
  const qrCodeUrl = '/qr-code-donation.png';

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert('계좌번호 복사에 실패했습니다. 수동으로 복사해주세요.');
    });
  };

  return (
    <footer className="border-t bg-muted/30 mt-12">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coffee className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">개발자를 위한 커피 한 잔</CardTitle>
            </div>
            <CardDescription className="text-sm">
              앱 사용에 만족이 되셨다면 개발자를 위해 가벼운 커피 한 잔 부탁드립니다.
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                피드백은 언제나 환영입니다.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 계좌번호 */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs text-muted-foreground mb-1">계좌번호</p>
                <p className="font-mono font-semibold">{bankName} {accountNumber}</p>
                <p className="text-xs text-muted-foreground mt-1">예금주: {accountHolder}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAccount}
                className="flex-shrink-0"
              >
                {copied ? (
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

            {/* QR 코드 버튼 */}
            <Dialog open={showQR} onOpenChange={setShowQR}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" size="lg">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR 코드로 송금하기
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>QR 코드로 송금</DialogTitle>
                  <DialogDescription>
                    QR 코드를 스캔하여 간편하게 송금하실 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                    {qrError ? (
                      <div className="text-center p-8">
                        <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          QR 코드 이미지를 추가해주세요.
                          <br />
                          <code className="text-xs">public/qr-code-donation.png</code>
                        </p>
                      </div>
                    ) : (
                      <img
                        src={qrCodeUrl}
                        alt="도네이션 QR 코드"
                        className="w-full h-full object-contain rounded-lg"
                        onError={() => setQrError(true)}
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold mb-1">{bankName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{accountNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">예금주: {accountHolder}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* 감사 메시지 */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <Heart className="h-3 w-3 text-red-500 fill-red-500" />
              <span>소중한 후원 감사합니다!</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </footer>
  );
}
