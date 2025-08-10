"use client";
import React, { useCallback, useMemo } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number; // px
  height: number; // px
  width?: number | string;
  overscanCount?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  role?: string;
  className?: string;
  getKey?: (item: T, index: number) => string | number;
}

function RowRenderer<T>({ data, index, style }: ListChildComponentProps<{ items: T[]; renderItem: (item:T,i:number)=>React.ReactNode; role: string }>) {
  const { items, renderItem, role } = data;
  const item = items[index];
  const content = renderItem(item, index);
  if (React.isValidElement(content) && (content.type as any) === 'tr') {
    const existingProps: any = content.props || {};
    return React.cloneElement(content as any, { ...existingProps, style: { ...(existingProps.style||{}), ...style } });
  }
  return <div style={style} role={role === 'list' ? 'listitem' : undefined} className="virtualized-row">{content}</div>;
}

export function VirtualizedList<T>({ items, itemHeight, height, width="100%", overscanCount=5, renderItem, role="list", className, getKey }: VirtualizedListProps<T>) {
  const keyFor = useCallback((item: T, index: number) => {
    if (getKey) return getKey(item, index);
    // fallback: attempt id or index
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (item as any)?.id ?? index;
  }, [getKey]);
  const data = useMemo(()=>({ items, renderItem, role }), [items, renderItem, role]);
  if (items.length * itemHeight <= height) {
  return <>{items.map((it, i) => React.isValidElement(renderItem(it,i)) ? React.cloneElement(renderItem(it,i) as any, { key: keyFor(it,i) }) : <div key={keyFor(it,i)}>{renderItem(it,i)}</div>)}</>;
  }
  return (
    <FixedSizeList
      height={height}
      width={width}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={overscanCount}
      className={className}
      itemData={data}
  itemKey={(index: number)=> keyFor(items[index], index)}
    >
      {RowRenderer as any}
    </FixedSizeList>
  );
}

export default VirtualizedList;
