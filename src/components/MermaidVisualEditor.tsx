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
    className={`px-4 py-2 bg-orange-500 text-white border-2 border-orange-700 rounded-t-full rounded-b-full min-w-[100px] text-center shadow-md ${
      selected ? 'ring-2 ring-orange-400 ring-offset-2' : ''
    }`}
    style={{
      borderTopWidth: '3px',
      borderBottomWidth: '3px',
    }}
  >
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-700" />
    <div className="font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-700" />
  </div>
);

const HexagonNode = ({ data, selected }: any) => {
  return (
    <div
      className={`relative flex items-center justify-center ${
        selected ? 'ring-2 ring-teal-400 ring-offset-2' : ''
      }`}
      style={{
        width: '120px',
        height: '80px',
      }}
    >
      <svg width="120" height="80" className="absolute drop-shadow-md">
        <polygon
          points="60,5 110,25 110,55 60,75 10,55 10,25"
          fill="#14b8a6"
          stroke="#0f766e"
          strokeWidth="2"
        />
      </svg>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-teal-700" />
      <div className="relative z-10 text-white text-sm text-center px-2 font-medium">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-700" />
    </div>
  );
};

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

// Mermaid 코드 파싱 (기본적인 파싱만)
const parseMermaidToNodes = (code: string): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, string>();

  // Mermaid 코드 블록 제거
  const cleanCode = code.replace(/```mermaid\n?/g, '').replace(/```/g, '').trim();
  const lines = cleanCode.split('\n').filter((line) => line.trim());
  let nodeId = 0;

  lines.forEach((line) => {
    // 노드 정의: A[라벨] 또는 graph TD 등은 무시
    if (line.trim().startsWith('graph')) return;
    
    const nodeDef = line.match(/(\w+)\[([^\]]+)\]/);
    if (nodeDef) {
      const id = nodeDef[1];
      const label = nodeDef[2];
      if (!nodeMap.has(id)) {
        nodeMap.set(id, `node-${nodeId++}`);
        nodes.push({
          id: nodeMap.get(id)!,
          type: 'box',
          position: { x: (nodeId % 3) * 200 + 100, y: Math.floor(nodeId / 3) * 150 + 50 },
          data: { label },
        });
      }
    }

    // 다이아몬드: A{라벨}
    const diamondDef = line.match(/(\w+)\{([^}]+)\}/);
    if (diamondDef && !nodeDef) {
      const id = diamondDef[1];
      const label = diamondDef[2];
      if (!nodeMap.has(id)) {
        nodeMap.set(id, `node-${nodeId++}`);
        nodes.push({
          id: nodeMap.get(id)!,
          type: 'diamond',
          position: { x: (nodeId % 3) * 200 + 100, y: Math.floor(nodeId / 3) * 150 + 50 },
          data: { label },
        });
      }
    }

    // 화살표: A --> B
    const arrow = line.match(/(\w+)\s*-->\s*(\w+)/);
    if (arrow) {
      const from = arrow[1];
      const to = arrow[2];
      if (nodeMap.has(from) && nodeMap.has(to)) {
        edges.push({
          id: `edge-${edges.length}`,
          source: nodeMap.get(from)!,
          target: nodeMap.get(to)!,
        });
      }
    }
  });

  return { nodes: nodes.length > 0 ? nodes : getInitialNodes(), edges };
};

// Mermaid 코드 생성
const generateMermaidCode = (nodes: Node[], edges: Edge[]): string => {
  let code = 'graph TD\n';
  
  nodes.forEach((node) => {
    const type = node.type || 'box';
    if (type === 'box') {
      code += `    ${node.id}[${node.data.label}]\n`;
    } else if (type === 'diamond') {
      code += `    ${node.id}{${node.data.label}}\n`;
    } else if (type === 'circle') {
      code += `    ${node.id}((${node.data.label}))\n`;
    } else if (type === 'round') {
      code += `    ${node.id}(${node.data.label})\n`;
    } else if (type === 'stadium') {
      code += `    ${node.id}([${node.data.label}])\n`;
    } else if (type === 'subroutine') {
      code += `    ${node.id}[[:${node.data.label}]]\n`;
    } else if (type === 'cylindrical') {
      code += `    ${node.id}[(${node.data.label})]\n`;
    } else if (type === 'hexagon') {
      code += `    ${node.id}{{${node.data.label}}}\n`;
    }
  });

  edges.forEach((edge) => {
    const label = edge.label || '';
    code += `    ${edge.source} -->${label ? `|${label}|` : ''} ${edge.target}\n`;
  });

  return '```mermaid\n' + code + '```';
};

const getInitialNodes = (): Node[] => [
  {
    id: '1',
    type: 'box',
    position: { x: 250, y: 100 },
    data: { label: '시작' },
  },
  {
    id: '2',
    type: 'diamond',
    position: { x: 250, y: 250 },
    data: { label: '조건' },
  },
  {
    id: '3',
    type: 'box',
    position: { x: 100, y: 400 },
    data: { label: '결과 1' },
  },
  {
    id: '4',
    type: 'box',
    position: { x: 400, y: 400 },
    data: { label: '결과 2' },
  },
];

export function MermaidVisualEditor({
  initialMermaidCode = '',
  onSave,
  onClose,
  saving: _saving = false,
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
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: selectedNodeType,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { label: nodeLabel || '새 노드' },
    };
    setNodes((nds: Node[]) => [...nds, newNode]);
    setShowNodeDialog(false);
    setNodeLabel('');
  }, [selectedNodeType, nodeLabel, setNodes]);

  const deleteSelected = useCallback(() => {
    // 선택된 노드 삭제
    const selectedNodeIds = nodes.filter((n: Node) => n.selected).map((n: Node) => n.id);
    setNodes((nds: Node[]) => nds.filter((node: Node) => !node.selected));
    
    // 선택된 엣지 삭제
    setEdges((eds: Edge[]) =>
      eds.filter(
        (edge: Edge) =>
          !edge.selected && // 선택된 엣지가 아니고
          !selectedNodeIds.includes(edge.source) && // 연결된 노드가 삭제되지 않는 경우
          !selectedNodeIds.includes(edge.target)
      )
    );
  }, [nodes, setNodes, setEdges]);

  // 엣지 삭제 전용 함수
  const deleteSelectedEdges = useCallback(() => {
    setEdges((eds: Edge[]) => eds.filter((edge: Edge) => !edge.selected));
  }, [setEdges]);

  // 키보드 Delete 키로 삭제
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (edges.some((e: Edge) => e.selected)) {
          deleteSelectedEdges();
        } else if (nodes.some((n: Node) => n.selected)) {
          deleteSelected();
        }
      }
    },
    [edges, nodes, deleteSelectedEdges, deleteSelected]
  );

  const handleSave = () => {
    const mermaidCode = generateMermaidCode(nodes, edges);
    onSave(mermaidCode);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Mermaid 시각적 에디터</DialogTitle>
          <DialogDescription>
            노드를 드래그하여 배치하고, 핸들을 드래그하여 연결하세요. Delete 키로 선택한 요소를 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* 툴바 */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <Button onClick={() => setShowNodeDialog(true)} variant="outline" size="sm">
              <Square className="h-4 w-4 mr-1" />
              노드 추가
            </Button>
            <Button
              onClick={deleteSelected}
              variant="outline"
              size="sm"
              disabled={!nodes.some((n: Node) => n.selected) && !edges.some((e: Edge) => e.selected)}
            >
              <Minus className="h-4 w-4 mr-1" />
              선택 삭제 (Delete 키)
            </Button>
            <div className="flex-1" />
            <Button onClick={handleSave} variant="default" size="sm">
              저장
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              취소
            </Button>
          </div>

          {/* React Flow 캔버스 */}
          <div
            className="flex-1 border rounded-lg overflow-hidden min-h-[500px] bg-white dark:bg-slate-900"
            ref={reactFlowWrapper}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode={['Delete', 'Backspace']}
            >
              <Background color="#94a3b8" gap={16} />
              <Controls />
            </ReactFlow>
          </div>
        </div>

        {/* 노드 추가 다이얼로그 */}
        <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
          <DialogContent className="max-w-md z-[110]">
            <DialogHeader>
              <DialogTitle>노드 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>노드 타입</Label>
                <Select value={selectedNodeType} onValueChange={(v: any) => setSelectedNodeType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    <SelectItem value="box">
                      <div className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        박스 [라벨]
                      </div>
                    </SelectItem>
                    <SelectItem value="diamond">
                      <div className="flex items-center gap-2">
                        <Diamond className="h-4 w-4" />
                        다이아몬드 {'{'}라벨{'}'} (조건)
                      </div>
                    </SelectItem>
                    <SelectItem value="circle">
                      <div className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        이중원 ((라벨))
                      </div>
                    </SelectItem>
                    <SelectItem value="round">
                      <div className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        둥근 모서리 (라벨)
                      </div>
                    </SelectItem>
                    <SelectItem value="stadium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        경기장형 ([라벨])
                      </div>
                    </SelectItem>
                    <SelectItem value="subroutine">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        서브루틴 [[:라벨]]
                      </div>
                    </SelectItem>
                    <SelectItem value="cylindrical">
                      <div className="flex items-center gap-2">
                        <Cylinder className="h-4 w-4" />
                        실린더 [(라벨)]
                      </div>
                    </SelectItem>
                    <SelectItem value="hexagon">
                      <div className="flex items-center gap-2">
                        <Hexagon className="h-4 w-4" />
                        육각형 {'{'}{'{'}라벨{'}'}{'}'}
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
