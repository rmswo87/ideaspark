// PRD 뷰어 컴포넌트 (개선된 마크다운 렌더링 및 Mermaid 지원)
import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cleanedChart = useMemo(() => chart.trim(), [chart]);
  const maxRetries = 2; // 최대 2회 재시도

  // iframe 내부에서 사용할 HTML 생성
  // Mermaid 가이드에 따라 iframe으로 완전 분리하여 React와 충돌 방지
  const iframeContent = useMemo(() => {
    const escapedChart = cleanedChart
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    
    // 통일된 Mermaid 설정 (모든 다이어그램 타입에 동일한 스타일 적용)
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
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: visible;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
      min-height: 100%;
      padding: 16px;
    }
    svg {
      max-width: 100% !important;
      max-height: 800px !important;
      height: auto !important;
      width: auto !important;
      overflow: visible !important;
    }
    /* Gantt 차트 스타일 통일성 개선 - 프로젝트 구조 다이어그램과 동일한 글자 크기 */
    svg .gantt {
      font-size: 13px !important;
      max-width: 100% !important;
    }
    svg .section0, svg .section1, svg .section2 {
      font-size: 13px !important;
    }
    svg .taskText {
      font-size: 13px !important;
      fill: #333 !important;
    }
    svg .task {
      font-size: 13px !important;
    }
    /* Gantt 차트 제목 및 날짜 글자 크기 통일 */
    svg .gantt-title {
      font-size: 13px !important;
    }
    svg .gantt-axis {
      font-size: 13px !important;
    }
    svg text {
      font-size: 13px !important;
    }
    /* Gantt 차트 전체 컨테이너 - 전체 너비 사용 */
    .mermaid svg[data-gantt] {
      width: 100% !important;
      max-width: 100% !important;
    }
  </style>
</head>
<body>
  <div class="mermaid">
${escapedChart}
  </div>
  <script>
    // Mermaid 초기화 및 렌더링 (통일된 설정 + 안정성 개선)
    let renderAttempts = 0;
    const maxRenderAttempts = 3;
    
    function renderMermaid() {
      try {
        // Mermaid 라이브러리 로드 확인
        if (typeof mermaid === 'undefined') {
          if (renderAttempts < maxRenderAttempts) {
            renderAttempts++;
            setTimeout(renderMermaid, 300);
            return;
          } else {
            if (window.parent) {
              window.parent.postMessage({ type: 'mermaid-rendered', success: false, error: 'Mermaid library failed to load', index: ${index} }, '*');
            }
            return;
          }
        }
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          fontSize: 13,
          flowchart: {
            nodeSpacing: 45,
            rankSpacing: 45,
            curve: 'basis',
            fontSize: 13,
            padding: 8
          },
          sequence: {
            fontSize: 13,
            actorMargin: 45,
            width: 140,
            height: 60,
            boxMargin: 8,
            boxTextMargin: 4,
            noteMargin: 8,
            messageMargin: 30
          },
          gantt: {
            fontSize: 13,
            sectionFontSize: 13,
            leftPadding: 70,
            gridLineStartPadding: 30,
            bottomPadding: 20,
            topPadding: 20,
            barHeight: 18,
            barGap: 3,
            padding: 8
          },
          er: {
            fontSize: 13,
            entityPadding: 12,
            padding: 16
          },
          pie: {
            fontSize: 13
          },
          gitgraph: {
            fontSize: 13
          }
        });
        
        // Mermaid 렌더링 실행 (에러 발생 시에도 계속 시도)
        mermaid.run({
          querySelector: '.mermaid',
          suppressErrors: true
        }).then(() => {
          // 렌더링 성공 후 높이 전달 (강화된 재시도 로직)
          let attempts = 0;
          const maxAttempts = 10; // 재시도 횟수 증가
          const checkInterval = 150; // 재시도 간격 증가
          
          const checkSVG = () => {
            const svg = document.querySelector('svg');
            if (svg && window.parent) {
              const rect = svg.getBoundingClientRect();
              // SVG가 렌더링되었고 높이가 유효한지 확인
              if (rect.height > 0 && rect.width > 0) {
                const height = Math.min(rect.height + 32, 800); // 최대 높이 제한
                window.parent.postMessage({ type: 'mermaid-height', height: height, index: ${index} }, '*');
                window.parent.postMessage({ type: 'mermaid-rendered', success: true, index: ${index} }, '*');
                return;
              }
            }
            
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(checkSVG, checkInterval);
            } else {
              // 최대 재시도 횟수에 도달했지만 SVG를 찾지 못함
              if (window.parent) {
                window.parent.postMessage({ type: 'mermaid-rendered', success: false, error: 'SVG not found after rendering', index: ${index} }, '*');
              }
            }
          };
          
          checkSVG();
        }).catch((err) => {
          console.error('Mermaid rendering error:', err);
          if (window.parent) {
            window.parent.postMessage({ type: 'mermaid-rendered', success: false, error: err.message || 'Unknown error', index: ${index} }, '*');
          }
        });
      } catch (err) {
        console.error('Mermaid initialization error:', err);
        if (window.parent) {
          window.parent.postMessage({ type: 'mermaid-rendered', success: false, error: err.message || 'Unknown error', index: ${index} }, '*');
        }
      }
    }
    
    // 페이지 로드 시 렌더링 시작
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderMermaid);
    } else {
      renderMermaid();
    }
  </script>
</body>
</html>
    `;
  }, [cleanedChart, index]);

  // iframe 높이 조정을 위한 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'mermaid-height' && event.data.index === index && iframeRef.current) {
        iframeRef.current.style.height = `${event.data.height}px`;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [index]);

  // 에러 발생 시 재시도
  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setError(null);
      }, 1000 * (retryCount + 1));
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, maxRetries]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="border border-destructive rounded-lg p-4 bg-destructive/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-destructive">다이어그램 렌더링 실패</p>
          <a
            href={mermaidLiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Mermaid Live에서 보기
          </a>
        </div>
        <p className="text-sm text-destructive mb-3">{error}</p>
        <pre className="text-xs bg-background p-3 rounded overflow-x-auto whitespace-pre-wrap border border-border font-mono">
          {cleanedChart}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-6 w-full">
      <div className="mermaid-container w-full relative">
        {onEdit && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="bg-background/90 backdrop-blur-sm shadow-sm"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
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
            minHeight: '300px',
            maxHeight: '800px',
            border: 'none',
            display: 'block'
          } as React.CSSProperties}
          title={`Mermaid Diagram ${index}`}
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
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

  // 마지막 텍스트 추가
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }

  // Mermaid가 없는 경우 전체를 텍스트로 반환
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content,
    });
  }

  return parts;
}

export function PRDViewer({ prd, onEdit, onUpdate }: PRDViewerProps) {
  const [editingMermaidIndex, setEditingMermaidIndex] = useState<number | null>(null);
  const processedContent = useMemo(() => processMermaidContent(prd.content), [prd.content]);

  const handleMermaidEdit = (index: number) => {
    setEditingMermaidIndex(index);
  };

  const handleMermaidSave = async (updatedChart: string) => {
    if (editingMermaidIndex === null) return;

    // 해당 Mermaid 다이어그램을 찾아서 교체
    const mermaidParts = processedContent.filter(p => p.type === 'mermaid');
    const targetPart = mermaidParts[editingMermaidIndex];

    if (!targetPart) return;

    // 원본 콘텐츠에서 해당 Mermaid 블록을 찾아서 교체
    const mermaidRegex = /```\s*mermaid\s*\n([\s\S]*?)```/g;
    let match;
    let currentIndex = 0;
    let newContent = prd.content;

    while ((match = mermaidRegex.exec(prd.content)) !== null) {
      if (currentIndex === editingMermaidIndex) {
        // 해당 인덱스의 Mermaid 블록을 교체
        const before = prd.content.substring(0, match.index);
        const after = prd.content.substring(match.index + match[0].length);
        newContent = before + '```mermaid\n' + updatedChart + '\n```' + after;
        break;
      }
      currentIndex++;
    }

    try {
      const updated = await updatePRD(prd.id, { content: newContent });
      if (onUpdate) {
        onUpdate(updated);
      }
      setEditingMermaidIndex(null);
    } catch (error) {
      console.error('Error updating PRD:', error);
      alert('PRD 업데이트에 실패했습니다.');
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const element = document.getElementById('prd-content');
      if (!element) {
        alert('PDF로 변환할 내용을 찾을 수 없습니다.');
        return;
      }

      // 간단한 텍스트 기반 PDF 생성 (Mermaid 다이어그램은 제외)
      const textContent = prd.content.replace(/```[\s\S]*?```/g, '[다이어그램]');
      const lines = doc.splitTextToSize(textContent, 180);
      doc.text(lines, 10, 10);
      doc.save(`${prd.title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF 생성에 실패했습니다.');
    }
  };

  return (
    <Card id="prd-content">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">{prd.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              생성일: {new Date(prd.created_at).toLocaleDateString('ko-KR')}
              {prd.updated_at && prd.updated_at !== prd.created_at && (
                <> · 수정일: {new Date(prd.updated_at).toLocaleDateString('ko-KR')}</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                편집
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF 다운로드
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {processedContent.map((part, idx) => {
            if (part.type === 'mermaid') {
              if (editingMermaidIndex === part.index) {
                return (
                  <MermaidVisualEditor
                    key={`mermaid-${part.index}`}
                    initialChart={part.content}
                    onSave={handleMermaidSave}
                    onCancel={() => setEditingMermaidIndex(null)}
                  />
                );
              }
              return (
                <MermaidDiagram
                  key={`mermaid-${part.index}`}
                  chart={part.content}
                  index={part.index ?? 0}
                  onEdit={() => handleMermaidEdit(part.index ?? 0)}
                />
              );
            }
            return (
              <ReactMarkdown
                key={`text-${idx}`}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ node, ...props }) => <h1 {...props} className="text-2xl font-bold mt-6 mb-4" />,
                  h2: ({ node, ...props }) => <h2 {...props} className="text-xl font-bold mt-5 mb-3 mb-3" />,
                  h3: ({ node, ...props }) => <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />,
                  p: ({ node, ...props }) => <p {...props} className="mb-3 leading-relaxed" />,
                  ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside mb-3 space-y-1" />,
                  ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside mb-3 space-y-1" />,
                  li: ({ node, ...props }) => <li {...props} className="ml-4" />,
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" />
                    ) : (
                      <code {...props} className="block bg-muted p-3 rounded text-sm font-mono overflow-x-auto" />
                    ),
                  pre: ({ node, ...props }) => <pre {...props} className="bg-muted p-3 rounded overflow-x-auto mb-3" />,
                  blockquote: ({ node, ...props }) => <blockquote {...props} className="border-l-4 border-primary pl-4 italic my-3" />,
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table {...props} className="min-w-full border-collapse border border-border" />
                    </div>
                  ),
                  th: ({ node, ...props }) => <th {...props} className="border border-border px-4 py-2 bg-muted font-semibold text-left" />,
                  td: ({ node, ...props }) => <td {...props} className="border border-border px-4 py-2" />,
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
