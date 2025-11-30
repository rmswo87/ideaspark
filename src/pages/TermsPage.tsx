// 이용약관 페이지
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsPage() {  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">이용약관</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <div className="space-y-6 text-sm">
              <section>
                <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  이 약관은 IdeaSpark(이하 "회사"라 함)이 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제2조 (정의)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>"서비스"란 회사가 제공하는 Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼 및 관련 서비스를 의미합니다.</li>
                  <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 의미합니다.</li>
                  <li>"회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.</li>
                  <li>"비회원"이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제3조 (약관의 게시와 개정)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                  <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
                  <li>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제4조 (서비스의 제공 및 변경)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>회사는 다음과 같은 서비스를 제공합니다:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Reddit 아이디어 자동 수집 서비스</li>
                      <li>AI 기반 PRD 생성 서비스</li>
                      <li>개발 계획서 작성 서비스</li>
                      <li>커뮤니티 기능</li>
                      <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                    </ul>
                  </li>
                  <li>회사는 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제5조 (서비스의 중단)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                  <li>회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제6조 (회원가입)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</li>
                  <li>회사는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                      <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                      <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제7조 (회원 정보의 변경)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  회원은 개인정보 관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다. 다만, 서비스 관리를 위해 필요한 실명, 아이디 등은 수정이 불가능합니다.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제8조 (개인정보보호)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  회사는 이용자의 개인정보 수집 및 이용에 대해서는 관련 법령에 따라 개인정보 처리방침을 통하여 안내하고, 이용자의 개인정보를 보호하기 위하여 노력합니다.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제9조 (이용자의 의무)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>이용자는 다음 행위를 하여서는 안 됩니다:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>신청 또는 변경 시 허위내용의 등록</li>
                      <li>타인의 정보 도용</li>
                      <li>회사가 게시한 정보의 변경</li>
                      <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                      <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                      <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                      <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제10조 (저작권의 귀속 및 이용제한)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</li>
                  <li>이용자는 회사를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제11조 (면책조항)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                  <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
                  <li>회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제12조 (준거법 및 관할법원)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.</li>
                  <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송에는 대한민국 법을 적용합니다.</li>
                </ol>
              </section>

              <div className="mt-8 pt-6 border-t">
                <p className="text-xs text-muted-foreground">
                  본 약관은 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일부터 시행됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TermsPage;

