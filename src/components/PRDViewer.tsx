// PRD 뷰어 컴포넌트 (개선된 마크다운 렌더링 및 Mermaid 지원)
import { useRef, useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
// Mermaid는 iframe 내부에서 CDN으로 로드하므로 import 불필요
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Edit, FileText, Pencil } from 'lucide-react';
import { MermaidVisualEditor } from '@/components/MermaidVisualEditor';
import type { PRD } from '@/services/prdService';
import { updatePRD } from '@/services/prdService';
import { jsPDF } from 'jspdf';

interface PRDViewerProps {
  prd: PRD;
  onEdit?: () => void;
  onUpdate?: (updatedPrd: PRD) => void;
}

// Mermaid 다이어그램 컴포넌트 (iframe을 사용한 완전 분리 렌더링)
// iframe을 사용하면 React의 가상 DOM과 완전히 분리되어 DOM 충돌이 발생하지 않습니다.
// 참고: https://rudaks.tistory.com/entry/langgraph-%EA%B7%B8%EB%9E%98%ED%94%84%EB%A5%BC-%EC%8B%9C%EA%B0%81%ED%99%94%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95
function MermaidDiagram({ chart, index, onEdit }: { chart: string; index: number; onEdit?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cleanedChart = useMemo(() => chart.trim(), [chart]);

  // iframe 내부에서 사용할 HTML 생성
  const iframeContent = useMemo(() => {
    const escapedChart = cleanedChart
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    
    // Gantt 차트인지 정확히 감지 (gantt 키워드로 시작하는지 확인)
    const isGanttChart = /^\s*gantt\s/i.test(cleanedChart);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      background: transparent;
      font-family: inherit;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      min-height: 100%;
      padding: 20px;
    }
    svg {
      max-width: 85% !important;
      height: auto !important;
      width: auto !important;
    }
    ${isGanttChart ? `
    /* Gantt 차트는 전체 너비 사용하되, 내부 요소는 컴팩트하게 */
    svg {
      max-width: 100% !important;
      width: 100% !important;
    }
    /* Gantt 차트 내부 텍스트와 간격 최적화 */
    .mermaid .taskText, .mermaid .taskTextOutsideRight, .mermaid .taskTextOutsideLeft {
      font-size: 11px !important;
    }
    .mermaid .sectionTitle {
      font-size: 12px !important;
    }
    ` : ''}
  </style>
</head>
<body>
  <div class="mermaid">
${escapedChart}
  </div>
  <script>
    // Gantt 차트인지 정확히 감지
    const isGantt = /^\s*gantt\s/i.test(\`${escapedChart.replace(/`/g, '\\`')}\`);
    
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
      fontSize: 12,
      flowchart: {
        nodeSpacing: 40,
        rankSpacing: 40,
        curve: 'basis'
      },
      er: {
        fontSize: 12,
        entityPadding: 10,
        padding: 15
      },
      gantt: {
        fontSize: 11,
        sectionFontSize: 12,
        leftPadding: 50,
        gridLineStartPadding: 25,
        bottomPadding: 15,
        topPadding: 15,
        barHeight: 20,
        barGap: 3
      }
    });
    
    // 렌더링 완료 후 부모에게 알림
    window.addEventListener('load', function() {
      try {
        mermaid.run();
        // 렌더링 성공 및 높이 전달
        setTimeout(() => {
          const svg = document.querySelector('svg');
          if (svg && window.parent) {
            const height = svg.getBoundingClientRect().height + 40; // 패딩 포함
            window.parent.postMessage({ type: 'mermaid-height', height: height, index: ${index} }, '*');
            window.parent.postMessage({ type: 'mermaid-rendered', success: true, index: ${index} }, '*');
          }
        }, 100);
      } catch (err) {
        // 렌더링 실패
        if (window.parent) {
          window.parent.postMessage({ type: 'mermaid-rendered', success: false, error: err.message, index: ${index} }, '*');
        }
      }
    });
  </script>
</body>
</html>`;
  }, [cleanedChart, index]);

  // iframe에서 오는 메시지 처리
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.index === index) {
        if (event.data?.type === 'mermaid-height' && iframeRef.current) {
          // iframe 높이 동적 조정
          iframeRef.current.style.height = `${event.data.height}px`;
        } else if (event.data?.type === 'mermaid-rendered') {
          if (!event.data.success) {
            setError(event.data.error || '렌더링 실패');
          } else {
            setError(null);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [index]);

  // 에러 발생 시 텍스트로 표시
  if (error) {
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
        <p className="text-sm text-destructive mb-2">{error}</p>
        <pre className="text-xs bg-background p-4 rounded overflow-x-auto whitespace-pre-wrap border border-border font-mono">
          {cleanedChart}
        </pre>
      </div>
    );
  }

  // Gantt 차트인지 확인 (컨테이너 크기 조정용)
  const isGanttChart = /^\s*gantt\s/i.test(cleanedChart);

  return (
    <div className="my-8 w-full flex justify-center">
      <div className="mermaid-container w-full max-w-5xl border border-border rounded-lg overflow-visible bg-background relative">
        {onEdit && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="bg-background/80 backdrop-blur-sm"
            >
              <Pencil className="h-4 w-4 mr-1" />
              편집
            </Button>
          </div>
        )}
        <iframe
          ref={iframeRef}
          srcDoc={iframeContent}
          className="w-full border-0"
          style={{ 
            width: '100%', 
            minHeight: isGanttChart ? '400px' : '350px',
            border: 'none',
            display: 'block',
            overflow: 'visible'
          }}
          title={`Mermaid Diagram ${index}`}
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
          scrolling="no"
        />
      </div>
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

export function PRDViewer({ prd, onEdit, onUpdate }: PRDViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showMermaidEditor, setShowMermaidEditor] = useState(false);
  const [editingMermaidIndex, setEditingMermaidIndex] = useState<number | null>(null);
  const [editingMermaidCode, setEditingMermaidCode] = useState<string>('');
  const [prdContent, setPrdContent] = useState(prd.content);
  const [saving, setSaving] = useState(false);

  const handleDownloadMarkdown = () => {
    const blob = new Blob([prdContent], { type: 'text/markdown;charset=utf-8' });
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
      const text = prdContent
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

  const processedParts = processMermaidContent(prdContent);

  // Mermaid 에디터 열기
  const handleOpenMermaidEditor = (mermaidIndex: number, mermaidCode: string) => {
    setEditingMermaidIndex(mermaidIndex);
    setEditingMermaidCode(mermaidCode);
    setShowMermaidEditor(true);
  };

  // Mermaid 에디터에서 저장
  const handleMermaidEditorSave = async (newMermaidCode: string) => {
    if (editingMermaidIndex === null) return;

    setSaving(true);
    try {
      // processedParts에서 해당 Mermaid를 찾아 교체
      const parts = processMermaidContent(prdContent);
      let newContent = '';
      let mermaidCount = 0;

      for (const part of parts) {
        if (part.type === 'mermaid') {
          if (mermaidCount === editingMermaidIndex) {
            // 해당 Mermaid 교체
            newContent += '```mermaid\n' + newMermaidCode + '\n```\n\n';
          } else {
            // 다른 Mermaid는 그대로
            newContent += '```mermaid\n' + part.content + '\n```\n\n';
          }
          mermaidCount++;
        } else {
          newContent += part.content;
        }
      }

      // PRD 업데이트
      const updatedPrd = await updatePRD(prd.id, { content: newContent });
      setPrdContent(newContent);
      if (onUpdate) {
        onUpdate(updatedPrd);
      }
      
      setShowMermaidEditor(false);
      setEditingMermaidIndex(null);
      setEditingMermaidCode('');
    } catch (error) {
      console.error('Error saving Mermaid:', error);
      alert('Mermaid 다이어그램 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

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
                  onEdit={() => handleOpenMermaidEditor(part.index || 0, part.content)}
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

      {/* Mermaid 시각적 에디터 */}
      {showMermaidEditor && (
        <MermaidVisualEditor
          initialMermaidCode={editingMermaidCode}
          onSave={handleMermaidEditorSave}
          onClose={() => {
            setShowMermaidEditor(false);
            setEditingMermaidIndex(null);
            setEditingMermaidCode('');
          }}
          saving={saving}
        />
      )}
    </Card>
  );
}
