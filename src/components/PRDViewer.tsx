<<<<<<< HEAD
// PRD 뷰어 컴포넌트 (개선된 마크다운 렌더링 및 Mermaid 지원)
import React, { useRef, useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
// Mermaid는 iframe 내부에서 CDN으로 로드하므로 import 불필요
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Edit, Pencil, FileText } from 'lucide-react';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cleanedChart = useMemo(() => chart.trim(), [chart]);
  const isGanttChart = useMemo(() => cleanedChart.toLowerCase().includes('gantt'), [cleanedChart]);
  
  // 통일된 Mermaid 설정 (모든 다이어그램 타입에 동일한 스타일 적용)
  const iframeContent = useMemo(() => {
    const escapedChart = cleanedChart.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const chartTypeValue = cleanedChart.split('\\n')[0].toLowerCase();
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
      min-height: 100%;
      overflow: visible !important; /* visible로 변경하여 내용이 잘리지 않도록 */
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
      min-height: 200px; /* 작은 다이어그램도 잘 보이도록 최소 높이 보장 */
      padding: 20px; /* 패딩 증가 */
      overflow: visible !important; /* 잘림 방지 */
      position: relative;
    }
    svg {
      max-width: 100% !important;
      max-height: none !important; /* 높이 제한 제거 - 전체가 보이도록 */
      min-height: 200px !important; /* 작은 다이어그램도 잘 보이도록 최소 높이 보장 */
      width: 100% !important;
      height: auto !important; /* 자동 높이로 전체 내용 표시 */
      overflow: visible !important; /* 잘림 방지 */
      display: block !important;
      box-sizing: border-box !important;
    }
    /* 모든 Mermaid 다이어그램에 통일된 폰트 크기 적용 */
    svg text {
      font-size: 13px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
    }
    /* Flowchart/Graph 다이어그램 */
    svg .nodeLabel, svg .edgeLabel {
      font-size: 13px !important;
    }
    /* Gantt 차트 스타일 통일성 개선 */
    svg .gantt {
      font-size: 13px !important;
      max-width: 100% !important;
      width: 100% !important;    /* Sequence 다이어그램 */
    svg .actor, svg .messageText, svg .noteText {
      font-size: 13px !important;
    }
    /* ER 다이어그램 */
    svg .entityBox, svg .attributeBox {
      font-size: 13px !important;
    }
    /* Pie 차트 */
    svg .pieTitleText {
      font-size: 13px !important;
    }
    /* Gitgraph */
    svg .commit-label {
      font-size: 13px !important;
    }
    /* 모든 다이어그램 컨테이너 - 일관된 크기 및 스크롤 제거 */
    .mermaid svg {
      width: 100% !important;
      max-width: 100% !important;
      max-height: none !important; /* 높이 제한 제거 - 전체가 보이도록 */
      min-height: 200px !important; /* 작은 다이어그램도 잘 보이도록 최소 높이 보장 */
      height: auto !important; /* 자동 높이로 전체 내용 표시 */
      overflow: visible !important; /* 잘림 방지 */
      display: block !important;
    }
    /* SVG viewBox 및 preserveAspectRatio 강제 설정 */
    .mermaid svg[viewBox] {
      width: 100% !important;
      max-width: 100% !important;
      max-height: none !important; /* 높이 제한 제거 */
      height: auto !important; /* 자동 높이 */
    }
    /* ER 다이어그램 크기 제한 */
    .mermaid svg .er-entityBox, .mermaid svg .er-attributeBox {
      max-width: 200px !important;
      font-size: 13px !important;
    }
    /* Flowchart 노드 크기 제한 */
    .mermaid svg .node rect, .mermaid svg .node circle, .mermaid svg .node ellipse {
      max-width: 250px !important;
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
    
    async function renderMermaid() {
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
              // 에러 메시지를 화면에 표시
              const mermaidDiv = document.querySelector('.mermaid');
              if (mermaidDiv) {
                mermaidDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;"><p>⚠️ Mermaid 라이브러리 로드 실패</p><p style="font-size: 12px;">다이어그램을 렌더링할 수 없습니다.</p></div>';
              }
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
            nodeSpacing: 40,
            rankSpacing: 40,
            curve: 'basis',
            fontSize: 13,
            padding: 8,
            useMaxWidth: true,
            htmlLabels: true
          },
          sequence: {
            fontSize: 13,
            actorMargin: 45,
            width: 140,
            height: 60,
            boxMargin: 8,
            boxTextMargin: 4,
            noteMargin: 8,
            messageMargin: 30,
            useMaxWidth: true
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
            padding: 8,
            useMaxWidth: true,
            axisFormat: '%Y-%m-%d',
            bottomTickHeight: 4          },
          er: {
            fontSize: 13,
            entityPadding: 12,
            padding: 16,
            entityBoxMaxWidth: 200,
            useMaxWidth: true
          },
          pie: {
            fontSize: 13
          },
          gitgraph: {
            fontSize: 13
          }
        });
        
        // Mermaid 렌더링 실행 (에러 발생 시에도 계속 시도)
        try {
          await mermaid.run({
            querySelector: '.mermaid',
            suppressErrors: true
          });
          
          // 렌더링 성공 후 높이 전달 (강화된 재시도 로직)
          let attempts = 0;
          const maxAttempts = 20; // 재시도 횟수 증가
          const checkInterval = 250; // 재시도 간격 증가
          
          const checkSVG = () => {
            const svg = document.querySelector('svg');
            if (svg && window.parent) {
              // SVG 크기 조정: viewBox와 preserveAspectRatio 설정
              const svgWidth = svg.getAttribute('width');
              const svgHeight = svg.getAttribute('height');
              const viewBox = svg.getAttribute('viewBox');
              
              // SVG가 너무 크면 크기 조정
              if (svgWidth && parseFloat(svgWidth) > 1200) {
                svg.setAttribute('width', '100%');
                svg.style.maxWidth = '100%';
              }
              // height="auto" 에러 방지: 명시적인 픽셀 값으로 설정
              if (svgHeight && svgHeight === 'auto') {
                const rect = svg.getBoundingClientRect();
                if (rect.height > 0) {
                  svg.setAttribute('height', Math.ceil(rect.height).toString());
                }
              } else if (svgHeight && parseFloat(svgHeight) > 800) {
                svg.setAttribute('height', '800');                svg.style.maxHeight = '600px';
              }
              
              // viewBox가 없으면 추가
              if (!viewBox && svgWidth && svgHeight) {
                svg.setAttribute('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight);
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
              }
              
              // 모든 텍스트 요소의 폰트 크기 강제 설정
              const allTexts = svg.querySelectorAll('text');
              allTexts.forEach(text => {
                text.setAttribute('font-size', '13');
                text.style.fontSize = '13px';
              });
              
              const rect = svg.getBoundingClientRect();
              // SVG가 렌더링되었고 높이가 유효한지 확인
              if (rect.height > 0 && rect.width > 0) {
                // 실제 렌더링된 크기와 컨테이너 크기 비교하여 조정
                const container = document.querySelector('.mermaid');
                const containerWidth = container ? container.clientWidth : window.innerWidth;
                
                // SVG 크기를 컨테이너에 맞게 조정 (viewBox 사용)
                if (!svg.getAttribute('viewBox')) {
                  svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
                  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                  svg.setAttribute('width', '100%');
                  svg.setAttribute('height', 'auto');
                  svg.style.width = '100%';
                  svg.style.height = 'auto';
                  svg.style.maxWidth = '100%';
                }
                
                // Gantt 차트인지 확인 (gantt 클래스 또는 특정 패턴 확인)
                const chartTypeCheck = '${chartTypeValue}';
                const isGantt = chartTypeCheck === 'gantt' || 
                               svg.querySelector('.gantt') !== null || 
                               svg.querySelector('.section0') !== null ||
                               svg.querySelector('.section1') !== null;
                
                if (isGantt) {
                  // Gantt 차트는 가로로 길 수 있으므로 특별 처리
                  // viewBox를 사용하여 반응형으로 만들기
                  const currentViewBox = svg.getAttribute('viewBox');
                  if (!currentViewBox) {
                    svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
                  }
                  svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
                  svg.setAttribute('width', '100%');
                  // height="auto" 에러 방지: viewBox 기반으로 명시적 높이 계산
                  const ganttRect = svg.getBoundingClientRect();
                  if (ganttRect.height > 0) {
                    svg.setAttribute('height', Math.ceil(ganttRect.height).toString());
                  }
                  svg.style.width = '100%';
                  svg.style.maxWidth = '100%';
                  svg.style.maxHeight = 'none';
                  svg.style.overflow = 'visible';
                  
                  // Gantt 차트의 모든 텍스트 요소에 대해 강제로 폰트 크기 설정
                  const allTexts = svg.querySelectorAll('text');
                  allTexts.forEach(text => {
                    text.setAttribute('font-size', '13');
                    text.style.fontSize = '13px';
                    text.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';
                  });
                  
                  // Gantt 차트의 모든 그룹 요소에도 폰트 크기 적용
                  const ganttGroups = svg.querySelectorAll('g');
                  ganttGroups.forEach(group => {
                    const groupTexts = group.querySelectorAll('text');
                    groupTexts.forEach(text => {
                      text.setAttribute('font-size', '13');
                      text.style.fontSize = '13px';
                    });
                  });
                  
                  // Gantt 차트의 특정 클래스 요소들 크기 조정
                  const ganttElements = svg.querySelectorAll('.gantt, .section0, .section1, .section2, .task, .taskText, .gantt-title, .gantt-axis');
                  ganttElements.forEach(el => {
                    if (el instanceof SVGElement) {
                      el.style.fontSize = '13px';
                      const textEl = el.querySelectorAll('text');
                      textEl.forEach(text => {
                        text.setAttribute('font-size', '13');
                        text.style.fontSize = '13px';
                      });
                    }
                  });
                  
                  // Gantt 차트의 실제 높이 계산 (내용이 잘리지 않도록)
                  // 패딩을 충분히 고려하여 높이 계산 (하단 여유 공간 확보)
                  const ganttActualHeight = Math.max(rect.height + 60, 450); // 충분한 패딩과 최소 높이
                  window.parent.postMessage({ type: 'mermaid-height', height: ganttActualHeight, index: ${index}, overflow: 'visible' }, '*');
                } else {
                  // 일반 다이어그램 처리 (작은 다이어그램도 잘 보이도록 최소 크기 보장)
                  const actualWidth = Math.min(rect.width, containerWidth - 32);
                  // 하단이 잘리지 않도록 패딩을 충분히 추가하고, 최소 높이 보장
                  const minHeight = Math.max(rect.height, 200); // 최소 200px 보장
                  const actualHeight = minHeight + 60; // 패딩 추가, 높이 제한 없음
                  
                  // SVG 크기 재조정 - 전체가 보이도록
                  svg.setAttribute('height', Math.ceil(rect.height).toString());
                  svg.style.width = '100%';
                  svg.style.maxWidth = '100%';
                  svg.style.height = Math.ceil(rect.height) + 'px';
                  svg.style.maxHeight = 'none'; // 높이 제한 제거
                  svg.style.overflow = 'visible'; // 잘림 방지
                  
                  window.parent.postMessage({ type: 'mermaid-height', height: actualHeight, index: ${index} }, '*');
                }
                                window.parent.postMessage({ type: 'mermaid-rendered', success: true, index: ${index} }, '*');
                return;
              }
            }
            
            // SVG를 찾지 못했거나 유효하지 않은 경우 재시도
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkSVG, checkInterval);
            } else {
              // 최대 재시도 후에도 실패하면 에러 전송
              if (window.parent) {
                window.parent.postMessage({ type: 'mermaid-rendered', success: false, error: 'SVG not found or invalid after rendering', index: ${index} }, '*');
                // 에러 메시지를 화면에 표시
                const mermaidDiv = document.querySelector('.mermaid');
                if (mermaidDiv) {
                  mermaidDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;"><p>⚠️ 다이어그램 렌더링 실패</p><p style="font-size: 12px;">SVG를 생성할 수 없습니다.</p><p style="font-size: 11px; margin-top: 10px; color: #666;">다이어그램 코드를 확인해주세요.</p></div>';
                }
              }
            }
          };
          
          // 초기 대기 시간 증가 (렌더링 완료 대기)
          setTimeout(checkSVG, 800);
        } catch (err) {
          // 에러 발생 시 자동 재시도
          if (renderAttempts < maxRenderAttempts) {
            renderAttempts++;
            setTimeout(renderMermaid, 500);
          } else {
            if (window.parent) {
              window.parent.postMessage({ type: 'mermaid-rendered', success: false, error: err.message || 'Rendering failed after retries', index: ${index} }, '*');
              // 에러 메시지를 화면에 표시
              const mermaidDiv = document.querySelector('.mermaid');
              if (mermaidDiv) {
                const errorMsg = err.message || '다이어그램 렌더링 실패';
                mermaidDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;"><p>⚠️ Mermaid 렌더링 오류</p><p style="font-size: 12px;">' + errorMsg + '</p><p style="font-size: 11px; margin-top: 10px; color: #666;">다이어그램 코드에 문법 오류가 있을 수 있습니다.</p></div>';
              }
            }
          }
        }
      } catch (err) {
        // 초기화 에러 발생 시 재시도
        if (renderAttempts < maxRenderAttempts) {
          renderAttempts++;
          setTimeout(renderMermaid, 500);
        } else {
          if (window.parent) {
            window.parent.postMessage({ type: 'mermaid-rendered', success: false, error: err.message || 'Initialization failed after retries', index: ${index} }, '*');
          }
        }
      }
    }
    
    // DOM 로드 후 렌더링 (라이브러리 로드 대기 시간 증가)
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => renderMermaid(), 500);
      });
    } else {
      setTimeout(() => renderMermaid(), 500);
    }
    
    // window.load 이벤트도 대기 (모든 리소스 로드 완료)
    window.addEventListener('load', () => {
      if (renderAttempts === 0) {
        setTimeout(() => renderMermaid(), 300);
      }
    });
  </script>
</body>
</html>`;
  }, [cleanedChart, index, isGanttChart]);
  // iframe에서 오는 메시지 처리
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.index === index) {
        if (event.data?.type === 'mermaid-height' && iframeRef.current) {
          // iframe 높이 동적 조정
          iframeRef.current.style.height = `${event.data.height}px`;
          // Gantt 차트의 경우 overflow를 visible로 설정
          if (event.data.overflow === 'visible') {
            iframeRef.current.style.overflow = 'visible';
            iframeRef.current.style.maxHeight = 'none';
          } else {
            // 일반 다이어그램도 충분한 높이 확보 및 잘림 방지
            iframeRef.current.style.overflow = 'visible'; // 잘림 방지
            iframeRef.current.style.maxHeight = '800px'; // 충분한 높이 허용
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [index, isGanttChart]);

  return (
    <div className="relative w-full my-4" style={{ position: 'relative', overflow: 'visible' }}>
      {onEdit && (
        <div className="absolute top-2 right-2 z-20" style={{ position: 'absolute', pointerEvents: 'auto' }}>
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
      <div className="w-full" style={{ position: 'relative', overflow: 'visible', minHeight: isGanttChart ? '450px' : '200px' }}>
        <iframe
          ref={iframeRef}
          srcDoc={iframeContent}
          className="w-full border-0"
            style={{
            width: '100%',
            minHeight: isGanttChart ? '450px' : '200px',
            maxHeight: 'none', // 높이 제한 제거 - 전체가 보이도록
            border: 'none',
            display: 'block',
            overflow: 'visible', // visible로 변경하여 내용이 잘리지 않도록
            position: 'relative'
          } as React.CSSProperties}
          title={`Mermaid Diagram ${index}`}
          sandbox="allow-scripts allow-same-origin"
          allow="same-origin"
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
  const [saving, setSaving] = useState(false);

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

  const [prdContent, setPrdContent] = useState(prd.content);
  const processedParts = processMermaidContent(prdContent);

  // prd.content가 변경되면 prdContent 동기화
  useEffect(() => {
    setPrdContent(prd.content);
  }, [prd.content]);

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
          className="prd-content"
          style={{
            fontSize: '15px',
            lineHeight: '1.7',
            color: 'var(--foreground)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
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
                  // 헤더 스타일링 (통일된 크기와 간격)
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-semibold mt-8 mb-4 text-foreground" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-xl font-semibold mt-7 mb-3 text-foreground" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-base font-semibold mt-5 mb-2 text-foreground" {...props} />
                  ),
                  h5: ({ node, ...props }) => (
                    <h5 className="text-sm font-semibold mt-4 mb-2 text-foreground" {...props} />
                  ),
                  h6: ({ node, ...props }) => (
                    <h6 className="text-sm font-medium mt-4 mb-2 text-foreground" {...props} />
                  ),
                  // 단락 스타일링 (통일된 간격)
                  p: ({ node, ...props }) => (
                    <p className="mb-4 leading-7 text-foreground" {...props} />
                  ),
                  // 리스트 스타일링 (통일된 간격)
                  ul: ({ node, ...props }) => (
                    <ul className="mb-4 ml-6 list-disc space-y-1" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="mb-4 ml-6 list-decimal space-y-1" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="leading-7 text-foreground" {...props} />
                  ),
                  // 강조 스타일링 (통일된 크기)
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-foreground" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic text-foreground" {...props} />
                  ),
                  // 코드 스타일링 (통일된 스타일)
                  code: ({ node, inline, className, children, ...props }: any) => {
                    if (className && className.includes('language-mermaid')) {
                      return null;
                    }
                    
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
                      <div className="my-4">
                        <code
                          className="block bg-muted p-4 rounded text-sm font-mono overflow-x-auto border border-border"
                          {...props}
                        >
                          {children}
                        </code>
                      </div>
                    );
                  },
                  // 링크 스타일링
                  a: ({ node, ...props }) => (
                    <a
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  // 인용구 스타일링
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-2 border-border pl-4 italic my-4 text-muted-foreground"
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
                    <th className="border border-border px-3 py-2 bg-muted font-semibold text-left text-sm" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-border px-3 py-2 text-sm" {...props} />
                  ),
                  // 구분선
                  hr: ({ node, ...props }) => (
                    <hr className="my-6 border-t border-border" {...props} />
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
