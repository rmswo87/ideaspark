// PRD 뷰어 컴포넌트 (개선된 마크다운 렌더링 및 Mermaid 지원)
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Edit, FileText } from 'lucide-react';
import type { PRD } from '@/services/prdService';
import { jsPDF } from 'jspdf';

interface PRDViewerProps {
  prd: PRD;
  onEdit?: () => void;
}

// Mermaid 다이어그램 컴포넌트
function MermaidDiagram({ chart, index }: { chart: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function renderMermaid() {
      if (!ref.current || !containerRef.current) return;

      // 이전 내용 제거
      const container = containerRef.current;
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // 새로운 div 생성
      const mermaidDiv = document.createElement('div');
      const id = `mermaid-${index}-${Date.now()}`;
      mermaidDiv.id = id;
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = chart;
      container.appendChild(mermaidDiv);

      // 상태 업데이트를 다음 틱으로 지연
      timeoutId = setTimeout(() => {
        if (!isMounted || !mermaidDiv.parentNode) return;

        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'inherit',
          });

          mermaid.run({
            nodes: [mermaidDiv],
            suppressErrors: true,
          }).then(() => {
            if (isMounted) {
              setError(null);
              setIsRendered(true);
            }
          }).catch((err) => {
            if (isMounted) {
              console.error('Mermaid rendering error:', err);
              setError('다이어그램 렌더링 실패');
            }
          });
        } catch (err) {
          if (isMounted) {
            console.error('Mermaid initialization error:', err);
            setError('다이어그램 초기화 실패');
          }
        }
      }, 0);
    }

    renderMermaid();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // cleanup: Mermaid로 생성된 SVG 제거
      if (containerRef.current) {
        const container = containerRef.current;
        while (container.firstChild) {
          try {
            container.removeChild(container.firstChild);
          } catch (e) {
            // 이미 제거된 경우 무시
          }
        }
      }
    };
  }, [chart, index]);

  if (error) {
    return (
      <div className="my-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
        <p className="text-sm text-destructive">{error}</p>
        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-6 flex justify-center">
      <div ref={containerRef} className="mermaid-container">
        {!isRendered && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">다이어그램 렌더링 중...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 마크다운 콘텐츠를 Mermaid와 일반 텍스트로 분리
function processMermaidContent(content: string) {
  const parts: Array<{ type: 'text' | 'mermaid'; content: string; index?: number }> = [];
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let mermaidIndex = 0;
  let match;

  while ((match = mermaidRegex.exec(content)) !== null) {
    // Mermaid 이전의 텍스트 추가
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }

    // Mermaid 다이어그램 추가
    parts.push({
      type: 'mermaid',
      content: match[1].trim(),
      index: mermaidIndex++,
    });

    lastIndex = match.index + match[0].length;
  }

  // 남은 텍스트 추가
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }

  // Mermaid가 없는 경우 전체를 텍스트로 처리
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
}

export function PRDViewer({ prd, onEdit }: PRDViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadMarkdown = () => {
    const blob = new Blob([prd.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prd.title.replace(/[^a-z0-9가-힣]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // 제목 추가
      pdf.setFontSize(18);
      pdf.text(prd.title, 20, 20);

      // 상태 및 생성일 추가
      pdf.setFontSize(10);
      pdf.text(`상태: ${prd.status}`, 20, 30);
      pdf.text(`생성일: ${new Date(prd.created_at).toLocaleDateString('ko-KR')}`, 20, 35);

      // 마크다운 콘텐츠를 텍스트로 변환 (간단한 변환)
      const text = prd.content
        .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
        .replace(/#{1,6}\s+/g, '') // 헤더 제거
        .replace(/\*\*/g, '') // 볼드 제거
        .replace(/\*/g, '') // 이탤릭 제거
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 링크 제거
        .replace(/\n{3,}/g, '\n\n') // 연속된 줄바꿈 정리
        .trim();

      // 텍스트를 PDF에 추가 (간단한 줄바꿈 처리)
      const lines = pdf.splitTextToSize(text, 170); // A4 너비에서 여백 제외
      let y = 45;
      const pageHeight = 280; // A4 높이에서 여백 제외

      lines.forEach((line: string) => {
        if (y > pageHeight) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFontSize(10);
        pdf.text(line, 20, y);
        y += 7;
      });

      pdf.save(`${prd.title.replace(/[^a-z0-9가-힣]/gi, '_')}.pdf`);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    }
  };

  const processedParts = processMermaidContent(prd.content);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="mb-2 text-2xl">{prd.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
                {prd.status}
              </span>
              <span>
                생성일: {new Date(prd.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
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
            <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
              <Download className="h-4 w-4 mr-2" />
              Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={contentRef} className="prose prose-slate dark:prose-invert max-w-none">
          {processedParts.map((part, idx) => {
            if (part.type === 'mermaid') {
              return (
                <MermaidDiagram
                  key={`mermaid-${part.index}-${idx}`}
                  chart={part.content}
                  index={part.index || 0}
                />
              );
            }

            return (
              <ReactMarkdown
                key={`markdown-${idx}`}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // 헤더 스타일링
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-lg font-medium mt-4 mb-2" {...props} />
                  ),
                  // 단락 스타일링
                  p: ({ node, ...props }) => (
                    <p className="mb-4 leading-7 text-foreground" {...props} />
                  ),
                  // 리스트 스타일링
                  ul: ({ node, ...props }) => (
                    <ul className="mb-4 ml-6 list-disc space-y-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="mb-4 ml-6 list-decimal space-y-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="leading-7" {...props} />
                  ),
                  // 강조 스타일링
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-foreground" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic text-foreground" {...props} />
                  ),
                  // 코드 스타일링
                  code: ({ node, inline, className, children, ...props }: any) => {
                    if (inline) {
                      return (
                        <code
                          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code
                        className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // 링크 스타일링
                  a: ({ node, ...props }) => (
                    <a
                      className="text-primary underline hover:text-primary/80"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  // 인용구 스타일링
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground"
                      {...props}
                    />
                  ),
                  // 테이블 스타일링
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-border" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-border px-4 py-2 bg-muted font-semibold text-left" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-border px-4 py-2" {...props} />
                  ),
                  // 구분선
                  hr: ({ node, ...props }) => (
                    <hr className="my-8 border-t border-border" {...props} />
                  ),
                }}
              >
                {part.content}
              </ReactMarkdown>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
