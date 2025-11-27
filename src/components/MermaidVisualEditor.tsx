import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Square, Circle, Diamond, Minus, Hexagon, Cylinder, FileText, Layers } from 'lucide-react';

interface MermaidVisualEditorProps {
  initialMermaidCode?: string;
  onSave: (mermaidCode: string) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
}

// 커스텀 노드 타입들
const BoxNode = ({ data, selected }: any) => (
  <div
    className={`px-4 py-2 bg-blue-500 text-white border-2 border-blue-700 rounded min-w-[100px] text-center shadow-md ${
      selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
    }`}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-700" />
    <div className="font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-700" />
  </div>
);

const DiamondNode = ({ data, selected }: any) => (
  <div
    className={`px-4 py-2 bg-yellow-400 text-gray-900 border-2 border-yellow-600 transform rotate-45 min-w-[80px] min-h-[80px] flex items-center justify-center shadow-md ${
      selected ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
    }`}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-600" />
    <div className="transform -rotate-45 font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-600" />
  </div>
);

const CircleNode = ({ data, selected }: any) => (
  <div
    className={`w-20 h-20 bg-green-500 text-white border-2 border-green-700 rounded-full flex items-center justify-center shadow-md ${
      selected ? 'ring-2 ring-green-400 ring-offset-2' : ''
    }`}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-700" />
    <div className="text-sm text-center px-2 font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-700" />
  </div>
);

const RoundNode = ({ data, selected }: any) => (
  <div
    className={`px-4 py-2 bg-pink-400 text-white border-2 border-pink-600 rounded-full min-w-[100px] text-center shadow-md ${
      selected ? 'ring-2 ring-pink-400 ring-offset-2' : ''
    }`}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-pink-600" />
    <div className="font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-pink-600" />
  </div>
);

const StadiumNode = ({ data, selected }: any) => (
  <div
    className={`px-4 py-2 bg-indigo-500 text-white border-2 border-indigo-700 rounded-full min-w-[120px] text-center shadow-md ${
      selected ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
    }`}
    style={{ borderRadius: '9999px' }}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-700" />
    <div className="font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-700" />
  </div>
);

const SubroutineNode = ({ data, selected }: any) => (
  <div
    className={`px-4 py-2 bg-purple-500 text-white border-4 border-double border-purple-700 rounded min-w-[100px] text-center shadow-md ${
      selected ? 'ring-2 ring-purple-400 ring-offset-2' : ''
    }`}
    style={{
      padding: '8px 16px',
    }}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-700" />
    <div className="font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-700" />
  </div>
);

const CylindricalNode = ({ data, selected }: any) => (
  <div
    className={`px-4 py-2 bg-orange-500 text-white border-2 border-orange-700 rounded min-w-[100px] text-center shadow-md ${
      selected ? 'ring-2 ring-orange-400 ring-offset-2' : ''
    }`}
    style={{
      clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)',
    }}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-700" />
    <div className="font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-700" />
  </div>
);

const HexagonNode = ({ data, selected }: any) => (
  <div
    className={`px-4 py-2 bg-teal-500 text-white border-2 border-teal-700 min-w-[100px] text-center shadow-md ${
      selected ? 'ring-2 ring-teal-400 ring-offset-2' : ''
    }`}
    style={{
      clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
    }}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-teal-700" />
    <div className="font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-700" />
  </div>
);

const nodeTypes: NodeTypes = {
  box: BoxNode,
  diamond: DiamondNode,
  circle: CircleNode,
  round: RoundNode,
  stadium: StadiumNode,
  subroutine: SubroutineNode,
  cylindrical: CylindricalNode,
  hexagon: HexagonNode,
};

// Mermaid 코드를 노드와 엣지로 파싱
function parseMermaidToNodes(mermaidCode: string): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();

  // 간단한 파싱 (flowchart TB, TD, LR, RL 등)
  const lines = mermaidCode.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('graph') && !line.startsWith('flowchart'));
  
  lines.forEach((line) => {
    // A --> B 형식
    const arrowMatch = line.match(/([A-Za-z0-9_]+)\s*-->?\s*([A-Za-z0-9_]+)/);
    if (arrowMatch) {
      const [, sourceId, targetId] = arrowMatch;
      
      if (!nodeMap.has(sourceId)) {
        const node: Node = {
          id: sourceId,
          type: 'box',
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: { label: sourceId },
        };
        nodes.push(node);
        nodeMap.set(sourceId, node);
      }
      
      if (!nodeMap.has(targetId)) {
        const node: Node = {
          id: targetId,
          type: 'box',
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: { label: targetId },
        };
        nodes.push(node);
        nodeMap.set(targetId, node);
      }
      
      edges.push({
        id: `e${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
      });
    }
    
    // A[Label] 형식
    const labelMatch = line.match(/([A-Za-z0-9_]+)\[([^\]]+)\]/);
    if (labelMatch) {
      const [, nodeId, label] = labelMatch;
      if (nodeMap.has(nodeId)) {
        nodeMap.get(nodeId)!.data.label = label;
      }
    }
  });

  return { nodes, edges };
}

// 노드와 엣지를 Mermaid 코드로 변환
function generateMermaidCode(nodes: Node[], edges: Edge[]): string {
  let code = 'graph TB\n';
  
  // 노드 정의 (라벨이 있으면 사용)
  nodes.forEach((node) => {
    const label = node.data?.label || node.id;
    code += `  ${node.id}[${label}]\n`;
  });
  
  // 엣지 정의
  edges.forEach((edge) => {
    code += `  ${edge.source} --> ${edge.target}\n`;
  });
  
  return code.trim();
}

function getInitialNodes(): Node[] {
  return [
    {
      id: 'start',
      type: 'circle',
      position: { x: 250, y: 100 },
      data: { label: '시작' },
    },
  ];
}

export function MermaidVisualEditor({
  initialMermaidCode = '',
  onSave,
  onClose,
  saving = false,
}: MermaidVisualEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialMermaidCode ? parseMermaidToNodes(initialMermaidCode).nodes : getInitialNodes()
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialMermaidCode ? parseMermaidToNodes(initialMermaidCode).edges : []
  );
  
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<
    'box' | 'diamond' | 'circle' | 'round' | 'stadium' | 'subroutine' | 'cylindrical' | 'hexagon'
  >('box');
  const [nodeLabel, setNodeLabel] = useState('');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: selectedNodeType,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: nodeLabel || '새 노드' },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeLabel('');
    setShowNodeDialog(false);
  }, [selectedNodeType, nodeLabel, setNodes]);

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  const handleSave = useCallback(() => {
    const mermaidCode = generateMermaidCode(nodes, edges);
    onSave(mermaidCode);
  }, [nodes, edges, onSave]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Mermaid 다이어그램 편집</DialogTitle>
          <DialogDescription>
            노드를 드래그하여 이동하고, 연결점을 드래그하여 연결하세요. Delete 키로 선택한 노드를 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex gap-2 mb-2">
            <Button onClick={() => setShowNodeDialog(true)} variant="outline" size="sm">
              <Square className="h-4 w-4 mr-1" />
              노드 추가
            </Button>
            <Button onClick={deleteSelected} variant="outline" size="sm">
              <Minus className="h-4 w-4 mr-1" />
              선택 삭제
            </Button>
          </div>
          <div ref={reactFlowWrapper} className="flex-1 border rounded-lg bg-muted/20 min-h-[500px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onKeyDown={(event) => {
                if (event.key === 'Delete' || event.key === 'Backspace') {
                  deleteSelected();
                }
              }}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            취소
          </Button>
          <Button onClick={handleSave} variant="default" size="sm" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>

        <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>노드 추가</DialogTitle>
              <DialogDescription>
                노드 타입과 라벨을 선택하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="node-type">노드 타입</Label>
                <Select
                  value={selectedNodeType}
                  onValueChange={(value: any) => setSelectedNodeType(value)}
                >
                  <SelectTrigger id="node-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="box">
                      <div className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        <span>박스</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="diamond">
                      <div className="flex items-center gap-2">
                        <Diamond className="h-4 w-4" />
                        <span>다이아몬드</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="circle">
                      <div className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        <span>원형</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="round">
                      <div className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        <span>둥근 박스</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="stadium">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <span>스타디움</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="subroutine">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>서브루틴</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cylindrical">
                      <div className="flex items-center gap-2">
                        <Cylinder className="h-4 w-4" />
                        <span>원통형</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="hexagon">
                      <div className="flex items-center gap-2">
                        <Hexagon className="h-4 w-4" />
                        <span>육각형</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="node-label">라벨</Label>
                <Input
                  id="node-label"
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                  placeholder="노드 라벨을 입력하세요"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addNode();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowNodeDialog(false)} variant="outline">
                취소
              </Button>
              <Button onClick={addNode}>추가</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
