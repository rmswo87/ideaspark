// PRD 뷰어 컴포넌트 (개선된 마크다운 렌더링 및 Mermaid 지원)
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
// Mermaid import 제거 - React DOM 충돌 방지를 위해 렌더링 비활성화
// import mermaid from 'mermaid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Edit, FileText } from 'lucide-react';
import type { PRD } from '@/services/prdService';
import { jsPDF } from 'jspdf';

interface PRDViewerProps {
  prd: PRD;
  onEdit?: () => void;
}

// Mermaid 다이어그램 컴포넌트 (React DOM 충돌 방지를 위해 텍스트로만 표시)
// Mermaid 렌더링은 React의 가상 DOM과 충돌하므로, 안전하게 텍스트로만 표시합니다.
function MermaidDiagram({ chart, index }: { chart: string; index: number }) {
  const cleanedChart = chart.trim();
  
  // Mermaid Live Editor URL 생성 (base64 인코딩)
  const encodedChart = encodeURIComponent(cleanedChart);
  const mermaidLiveUrl = `https://mermaid.live/edit#pako:${btoa(cleanedChart)}`;

  return (
    <div className="my-6 p-5 bg-muted/30 border border-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">📊 Mermaid 다이어그램</p>
        <a
          href={mermaidLiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline font-medium"
        >
          Mermaid Live에서 보기 →
        </a>
      </div>
      <pre className="text-xs bg-background p-4 rounded overflow-x-auto whitespace-pre-wrap border border-border font-mono">
        {cleanedChart}
      </pre>
      <p className="text-xs text-muted-foreground mt-3">
        💡 위 코드를 <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-primary underline">Mermaid Live Editor</a>에 붙여넣어 다이어그램을 확인하실 수 있습니다.
      </p>
    </div>
  );
}

// 마크다운 콘텐츠를 Mermaid와 일반 텍스트로 분리
function processMermaidContent(content: string) {
  const parts: Array<{ type: 'text' | 'mermaid'; content: string; index?: number }> = [];
  // 다양한 Mermaid 코드 블록 형식 지원 (```mermaid, ``` mermaid, ```mermaid\n 등)
  const mermaidRegex = /```\s*mermaid\s*\n([\s\S]*?)```/g;
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
        <div 
          ref={contentRef} 
          className="prose prose-slate dark:prose-invert max-w-none prd-content"
          style={{
            fontSize: '16px',
            lineHeight: '1.8',
          }}
        >
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
                key={`markdown-${idx}-${part.content.substring(0, 20)}`}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // 헤더 스타일링 (더 큰 크기, 더 명확한 구분)
                  h1: ({ node, ...props }) => (
                    <h1 className="text-4xl font-bold mt-10 mb-6 pb-3 border-b-2 border-primary/20 text-foreground" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-3xl font-semibold mt-8 mb-4 pb-2 border-b border-border text-foreground" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-2xl font-semibold mt-6 mb-3 text-foreground" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-xl font-medium mt-5 mb-2 text-foreground" {...props} />
                  ),
                  h5: ({ node, ...props }) => (
                    <h5 className="text-lg font-medium mt-4 mb-2 text-foreground" {...props} />
                  ),
                  h6: ({ node, ...props }) => (
                    <h6 className="text-base font-medium mt-3 mb-2 text-foreground" {...props} />
                  ),
                  // 단락 스타일링 (더 큰 줄 간격, 더 명확한 구분)
                  p: ({ node, ...props }) => (
                    <p className="mb-5 leading-8 text-foreground text-base whitespace-pre-wrap" {...props} />
                  ),
                  // 리스트 스타일링 (더 큰 간격)
                  ul: ({ node, ...props }) => (
                    <ul className="mb-6 ml-8 list-disc space-y-3 text-base" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="mb-6 ml-8 list-decimal space-y-3 text-base" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="leading-8 text-foreground" {...props} />
                  ),
                  // 강조 스타일링 (더 명확한 효과)
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-foreground text-lg" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic text-foreground font-medium" {...props} />
                  ),
                  // 코드 스타일링 (더 큰 폰트, 더 명확한 배경)
                  // Mermaid 코드 블록은 이미 processMermaidContent에서 제거되었으므로 여기서는 렌더링하지 않음
                  code: ({ node, inline, className, children, ...props }: any) => {
                    // Mermaid 코드 블록은 이미 별도로 처리되므로 여기서는 렌더링하지 않음
                    if (className && className.includes('language-mermaid')) {
                      return null;
                    }
                    
                    if (inline) {
                      return (
                        <code
                          className="bg-muted/80 px-2 py-1 rounded-md text-sm font-mono text-foreground border border-border"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="my-6">
                        <code
                          className="block bg-muted/50 p-5 rounded-lg text-sm font-mono overflow-x-auto border border-border"
                          {...props}
                        >
                          {children}
                        </code>
                      </div>
                    );
                  },
                  // 링크 스타일링 (더 명확한 색상)
                  a: ({ node, ...props }) => (
                    <a
                      className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  // 인용구 스타일링 (더 명확한 스타일)
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-primary pl-6 italic my-6 text-muted-foreground bg-muted/30 py-3 rounded-r"
                      {...props}
                    />
                  ),
                  // 테이블 스타일링 (더 명확한 구분)
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-6 border border-border rounded-lg">
                      <table className="min-w-full border-collapse" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-border px-4 py-3 bg-muted font-semibold text-left text-base" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-border px-4 py-3 text-base" {...props} />
                  ),
                  // 구분선 (더 명확한 구분)
                  hr: ({ node, ...props }) => (
                    <hr className="my-10 border-t-2 border-border" {...props} />
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
