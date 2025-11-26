// PRD 뷰어 컴포넌트
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Edit } from 'lucide-react';
import type { PRD } from '@/services/prdService';

interface PRDViewerProps {
  prd: PRD;
  onEdit?: () => void;
}

export function PRDViewer({ prd, onEdit }: PRDViewerProps) {
  const handleDownload = () => {
    const blob = new Blob([prd.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prd.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="mb-2">{prd.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                {prd.status}
              </span>
              <span>
                생성일: {new Date(prd.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                수정
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              다운로드
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-slate max-w-none dark:prose-invert">
          <ReactMarkdown>{prd.content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
