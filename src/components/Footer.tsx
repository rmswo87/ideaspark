// Footer 컴포넌트
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-background mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 회사 정보 */}
          <div>
            <h3 className="font-bold text-lg mb-4">IdeaSpark</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>상호명: IdeaSpark</p>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <h4 className="font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  아이디어 대시보드
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-muted-foreground hover:text-foreground transition-colors">
                  커뮤니티
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h4 className="font-semibold mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  문의 / 피드백
                </Link>
              </li>
              <li>
                <a href="mailto:bzjay53@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                  이메일 문의
                </a>
              </li>
            </ul>
          </div>

          {/* 약관 및 정책 */}
          <div>
            <h4 className="font-semibold mb-4">약관 및 정책</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  개인정보 처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <div className="text-center md:text-left">
              <p className="mb-1">
                <strong>고객센터</strong>
              </p>
              <p>이메일: bzjay53@gmail.com</p>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} IdeaSpark. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

