// 404 Not Found 페이지
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home } from 'lucide-react';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="py-12 text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground mb-6">페이지를 찾을 수 없습니다.</p>
          <Button onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotFoundPage;

