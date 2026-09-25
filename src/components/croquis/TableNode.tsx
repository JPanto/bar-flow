import React, { useRef, useEffect, useMemo } from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import Konva from 'konva';
import { TableElement, WaiterCall } from '../../types/database';
import { getChairsForTable } from '../../utils/chairGeometry';
import { getTableStatusColors, snapToGrid } from '../../utils/canvasUtils';
import { calculateUrgency } from '../../utils/urgencyGradient';

interface TableNodeProps {
  table: TableElement;
  isSelected: boolean;
  isEditorMode: boolean;
  snapToGridEnabled: boolean;
  activeCall?: WaiterCall;
  currentTime?: number;
  onSelect: (tableId: string) => void;
  onChange: (tableId: string, changes: Partial<TableElement>) => void;
  onClick: (table: TableElement) => void;
  registerNodeRef?: (id: string, node: Konva.Group | null) => void;
}

const TableNodeComponent: React.FC<TableNodeProps> = ({
  table,
  isSelected,
  isEditorMode,
  snapToGridEnabled,
  activeCall,
  currentTime,
  onSelect,
  onChange,
  onClick,
  registerNodeRef,
}) => {
  const groupRef = useRef<Konva.Group>(null);

  // Memoize geometry and status colors to avoid recalculating on every render/frame
  const statusColors = useMemo(() => getTableStatusColors(table.status), [table.status]);
  const chairs = useMemo(
    () => getChairsForTable(table.shape, table.width, table.height, table.seats),
    [table.shape, table.width, table.height, table.seats]
  );
  const callUrgency = useMemo(
    () => (activeCall ? calculateUrgency(activeCall.createdAt, currentTime) : null),
    [activeCall, currentTime]
  );

  useEffect(() => {
    if (registerNodeRef) {
      registerNodeRef(table.id, groupRef.current);
    }
    return () => {
      if (registerNodeRef) {
        registerNodeRef(table.id, null);
      }
    };
  }, [table.id, registerNodeRef]);

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (stage) {
      stage.container().style.cursor = 'grabbing';
    }
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (stage) {
      stage.container().style.cursor = isEditorMode ? 'grab' : 'default';
    }

    let newX = e.target.x();
    let newY = e.target.y();

    if (snapToGridEnabled) {
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);
      e.target.position({ x: newX, y: newY });
    }

    onChange(table.id, { x: newX, y: newY });
  };

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(50, Math.round(table.width * scaleX));
    const newHeight = Math.max(50, Math.round(table.height * scaleY));
    const newRotation = Math.round(node.rotation());

    onChange(table.id, {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      width: newWidth,
      height: newHeight,
      rotation: newRotation,
    });
  };

  return (
    <Group
      ref={groupRef}
      id={table.id}
      x={table.x}
      y={table.y}
      rotation={table.rotation}
      draggable={isEditorMode}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      onClick={(e) => {
        e.cancelBubble = true;
        if (isEditorMode) {
          onSelect(table.id);
        } else {
          onClick(table);
        }
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        if (isEditorMode) {
          onSelect(table.id);
        } else {
          onClick(table);
        }
      }}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = isEditorMode ? 'grab' : 'pointer';
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'default';
        }
      }}
    >
      {/* 0. Glowing Chromatic Call Halo Ring (When table is calling waiter) */}
      {activeCall && callUrgency && (
        <>
          {table.shape === 'round' ? (
            <Circle
              x={table.width / 2}
              y={table.height / 2}
              radius={table.width / 2 + 10}
              stroke={callUrgency.hexColor}
              strokeWidth={3}
              dash={[6, 3]}
            />
          ) : (
            <Rect
              x={-6}
              y={-6}
              width={table.width + 12}
              height={table.height + 12}
              cornerRadius={table.shape === 'counter' ? 8 : 16}
              stroke={callUrgency.hexColor}
              strokeWidth={3}
              dash={[6, 3]}
            />
          )}

          {/* Call notification indicator badge */}
          <Text
            x={-20}
            y={-26}
            width={table.width + 40}
            text={`🛎️ ${activeCall.reason === 'bill' ? 'CUENTA' : 'LLAMADO'} (${callUrgency.formattedTime})`}
            fontSize={10}
            fontStyle="bold"
            fill={callUrgency.hexColor}
            align="center"
            listening={false}
          />
        </>
      )}

      {/* 1. Chairs Layer - Clean, sharp Apple-style without slow Gaussian blurs */}
      {chairs.map((chair, idx) => (
        <Rect
          key={`chair-${idx}`}
          x={chair.x}
          y={chair.y}
          width={chair.size}
          height={chair.size * 0.8}
          offsetX={chair.size / 2}
          offsetY={(chair.size * 0.8) / 2}
          rotation={chair.rotation}
          cornerRadius={3}
          fill="#1c1c1e"
          stroke="#3a3a3c"
          strokeWidth={1}
          listening={false}
        />
      ))}

      {/* 2. Main Table Body */}
      {table.shape === 'round' ? (
        <Circle
          x={table.width / 2}
          y={table.height / 2}
          radius={table.width / 2}
          fill={statusColors.fill}
          stroke={isSelected ? '#0a84ff' : statusColors.stroke}
          strokeWidth={isSelected ? 3 : 1.5}
        />
      ) : (
        <Rect
          x={0}
          y={0}
          width={table.width}
          height={table.height}
          cornerRadius={table.shape === 'counter' ? 6 : 12}
          fill={table.shape === 'counter' ? '#1c1917' : statusColors.fill}
          stroke={isSelected ? '#0a84ff' : statusColors.stroke}
          strokeWidth={isSelected ? 3 : 1.5}
        />
      )}

      {/* 3. Center Label & Seat Count */}
      <Text
        x={0}
        y={table.height / 2 - 14}
        width={table.width}
        text={table.name}
        fontSize={Math.max(11, Math.min(13, table.width * 0.16))}
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
        listening={false}
      />

      <Text
        x={0}
        y={table.height / 2 + 2}
        width={table.width}
        text={`${table.seats}p • ${statusColors.label}`}
        fontSize={Math.max(9, Math.min(11, table.width * 0.12))}
        fill={statusColors.stroke}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
};

export const TableNode = React.memo(TableNodeComponent, (prev, next) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.isEditorMode === next.isEditorMode &&
    prev.snapToGridEnabled === next.snapToGridEnabled &&
    prev.table.x === next.table.x &&
    prev.table.y === next.table.y &&
    prev.table.width === next.table.width &&
    prev.table.height === next.table.height &&
    prev.table.rotation === next.table.rotation &&
    prev.table.status === next.table.status &&
    prev.table.seats === next.table.seats &&
    prev.table.name === next.table.name &&
    prev.activeCall?.id === next.activeCall?.id &&
    prev.activeCall?.status === next.activeCall?.status &&
    prev.activeCall?.createdAt === next.activeCall?.createdAt &&
    (prev.activeCall ? prev.currentTime === next.currentTime : true)
  );
});
