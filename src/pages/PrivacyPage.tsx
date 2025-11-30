// 개인정보 처리방침 페이지
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <CardTitle className="text-2xl">개인정보 처리방침</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <div className="space-y-6 text-sm">
              <section>
                <h2 className="text-lg font-semibold mb-3">제1조 (개인정보의 처리목적)</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  IdeaSpark(이하 "회사"라 함)은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li><strong>회원 가입 및 관리</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 목적으로 개인정보를 처리합니다.</li>
                    </ul>
                  </li>
                  <li><strong>서비스 제공</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Reddit 아이디어 수집, PRD 생성, 개발 계획서 작성, 커뮤니티 서비스 제공을 목적으로 개인정보를 처리합니다.</li>
                    </ul>
                  </li>
                  <li><strong>고객 문의 대응</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>고객 문의사항 확인 및 답변, 불만 처리 등을 목적으로 개인정보를 처리합니다.</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제2조 (개인정보의 처리 및 보유기간)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                  <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li><strong>회원 가입 및 관리:</strong> 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)</li>
                      <li><strong>서비스 제공:</strong> 서비스 이용 종료 시까지</li>
                      <li><strong>고객 문의 대응:</strong> 문의 처리 완료 후 3년</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제3조 (처리하는 개인정보의 항목)</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  회사는 다음의 개인정보 항목을 처리하고 있습니다:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li><strong>회원 가입 및 관리</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>필수항목: 이메일, 비밀번호</li>
                      <li>선택항목: 닉네임, 프로필 사진, 자기소개</li>
                    </ul>
                  </li>
                  <li><strong>서비스 이용 과정에서 자동 수집되는 정보</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>IP주소, 쿠키, 서비스 이용 기록, 접속 로그 등</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제5조 (개인정보처리의 위탁)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-2 text-muted-foreground">
                  <li><strong>Supabase</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>위탁업무의 내용: 데이터베이스 및 인증 서비스 제공</li>
                      <li>위탁기간: 서비스 제공 기간 동안</li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>개인정보 처리정지 요구권</li>
                      <li>개인정보 열람요구권</li>
                      <li>개인정보 정정·삭제요구권</li>
                      <li>개인정보 처리정지 요구권</li>
                    </ul>
                  </li>
                  <li>제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제7조 (개인정보의 파기)</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
                  <li>개인정보 파기의 절차 및 방법은 다음과 같습니다:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li><strong>파기절차:</strong> 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                      <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제8조 (개인정보 보호책임자)</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="bg-muted p-4 rounded-md space-y-2 text-muted-foreground">
                  <p><strong>개인정보 보호책임자</strong></p>
                  <p>이메일: bzjay53@gmail.com</p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제9조 (개인정보의 안전성 확보조치)</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 text-muted-foreground">
                  <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                  <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                  <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3">제10조 (개인정보 처리방침 변경)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  이 개인정보 처리방침은 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                </p>
              </section>

              <div className="mt-8 pt-6 border-t">
                <p className="text-xs text-muted-foreground">
                  본 개인정보 처리방침은 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일부터 시행됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PrivacyPage;