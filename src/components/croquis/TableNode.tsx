import React, { useRef, useEffect } from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import Konva from 'konva';
import { TableElement } from '../../types/database';
import { getChairsForTable } from '../../utils/chairGeometry';
import { getTableStatusColors, snapToGrid } from '../../utils/canvasUtils';

interface TableNodeProps {
  table: TableElement;
  isSelected: boolean;
  isEditorMode: boolean;
  snapToGridEnabled: boolean;
  onSelect: (tableId: string) => void;
  onChange: (tableId: string, changes: Partial<TableElement>) => void;
  onClick: (table: TableElement) => void;
  registerNodeRef?: (id: string, node: Konva.Group | null) => void;
}

export const TableNode: React.FC<TableNodeProps> = ({
  table,
  isSelected,
  isEditorMode,
  snapToGridEnabled,
  onSelect,
  onChange,
  onClick,
  registerNodeRef,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const statusColors = getTableStatusColors(table.status);
  const chairs = getChairsForTable(table.shape, table.width, table.height, table.seats);

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

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
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

    // Reset node scale to 1 and adapt width/height
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
      {/* 1. Chairs Layer */}
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
          cornerRadius={4}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth={1.5}
          shadowColor="#000"
          shadowBlur={4}
          shadowOpacity={0.4}
        />
      ))}

      {/* 2. Main Table Body */}
      {table.shape === 'round' ? (
        <Circle
          x={table.width / 2}
          y={table.height / 2}
          radius={table.width / 2}
          fill={statusColors.fill}
          stroke={isSelected ? '#38bdf8' : statusColors.stroke}
          strokeWidth={isSelected ? 3 : 2}
          shadowColor={statusColors.stroke}
          shadowBlur={isSelected ? 14 : 6}
          shadowOpacity={0.6}
        />
      ) : (
        <Rect
          x={0}
          y={0}
          width={table.width}
          height={table.height}
          cornerRadius={table.shape === 'counter' ? 6 : 12}
          fill={table.shape === 'counter' ? '#1c1917' : statusColors.fill}
          stroke={isSelected ? '#38bdf8' : statusColors.stroke}
          strokeWidth={isSelected ? 3 : 2}
          shadowColor={statusColors.stroke}
          shadowBlur={isSelected ? 14 : 6}
          shadowOpacity={0.6}
        />
      )}

      {/* 3. Center Label & Seat Count */}
      <Text
        x={0}
        y={table.height / 2 - 16}
        width={table.width}
        text={table.name}
        fontSize={Math.max(11, Math.min(14, table.width * 0.16))}
        fontStyle="bold"
        fill="#f8fafc"
        align="center"
        verticalAlign="middle"
        listening={false}
      />

      <Text
        x={0}
        y={table.height / 2 + 2}
        width={table.width}
        text={`${table.seats} sillas • ${statusColors.label}`}
        fontSize={Math.max(9, Math.min(11, table.width * 0.12))}
        fill={statusColors.stroke}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
};
