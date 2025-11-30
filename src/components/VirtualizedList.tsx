// 가상 스크롤 리스트 컴포넌트 (간단한 버전)
// @ts-ignore - react-window 타입 정의 문제 임시 해결
import { FixedSizeList as List } from 'react-window';
import { ReactNode } from 'react';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  renderItem: (item: any, index: number) => ReactNode;
  containerHeight?: number;
  className?: string;
}

export function VirtualizedList({ 
  items, 
  itemHeight, 
  renderItem,
  containerHeight = 600,
  className = ''
}: VirtualizedListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );

  return (
    <div className={className}>
      <List
        height={containerHeight}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
}