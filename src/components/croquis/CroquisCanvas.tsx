import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import Konva from 'konva';
import { Zone, TableElement } from '../../types/database';
import { GridBackground } from './GridBackground';
import { TableNode } from './TableNode';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CroquisCanvasProps {
  zone: Zone;
  tables: TableElement[];
  selectedTableId: string | null;
  isEditorMode: boolean;
  snapToGrid: boolean;
  onSelectTable: (tableId: string | null) => void;
  onUpdateTable: (tableId: string, changes: Partial<TableElement>) => void;
  onTableClick: (table: TableElement) => void;
}

export const CroquisCanvas: React.FC<CroquisCanvasProps> = ({
  zone,
  tables,
  selectedTableId,
  isEditorMode,
  snapToGrid,
  onSelectTable,
  onUpdateTable,
  onTableClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodesRef = useRef<Map<string, Konva.Group>>(new Map());

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 40, y: 40 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const registerNodeRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) {
      nodesRef.current.set(id, node);
    } else {
      nodesRef.current.delete(id);
    }
  }, []);

  // Attach transformer to selected node in Editor Mode
  useEffect(() => {
    if (!isEditorMode || !selectedTableId || !transformerRef.current) {
      transformerRef.current?.nodes([]);
      transformerRef.current?.getLayer()?.batchDraw();
      return;
    }

    const selectedNode = nodesRef.current.get(selectedTableId);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedTableId, isEditorMode, tables]);

  // Zoom handlers
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'reset') {
      setScale(1);
      setPosition({ x: 40, y: 40 });
      return;
    }

    const zoomFactor = direction === 'in' ? 1.2 : 0.8;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.3), 3.0);
    setScale(newScale);
  };

  // Wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const zoomFactor = e.evt.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(oldScale * zoomFactor, 0.3), 3.0);

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Click on background deselects table
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      onSelectTable(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden cursor-default select-none"
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        {/* Layer 1: Background & Grid */}
        <Layer>
          <GridBackground
            zoneWidth={zone.width}
            zoneHeight={zone.height}
            gridSize={20}
            showGrid={isEditorMode}
          />
        </Layer>

        {/* Layer 2: Tables & Chairs */}
        <Layer>
          {tables.map((table) => (
            <TableNode
              key={table.id}
              table={table}
              isSelected={isEditorMode && selectedTableId === table.id}
              isEditorMode={isEditorMode}
              snapToGridEnabled={snapToGrid}
              onSelect={onSelectTable}
              onChange={onUpdateTable}
              onClick={onTableClick}
              registerNodeRef={registerNodeRef}
            />
          ))}

          {/* Transformer handles for active selection */}
          {isEditorMode && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum table dimensions 50px
                if (newBox.width < 50 || newBox.height < 50) {
                  return oldBox;
                }
                return newBox;
              }}
              anchorSize={9}
              anchorCornerRadius={4}
              anchorFill="#38bdf8"
              anchorStroke="#0369a1"
              borderStroke="#38bdf8"
              borderDash={[4, 4]}
              rotateAnchorOffset={24}
            />
          )}
        </Layer>
      </Stage>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl z-10 text-slate-300">
        <button
          onClick={() => handleZoom('in')}
          className="p-2 hover:bg-slate-800 active:scale-95 rounded-lg transition-colors"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-2 hover:bg-slate-800 active:scale-95 rounded-lg transition-colors"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('reset')}
          className="p-2 hover:bg-slate-800 active:scale-95 rounded-lg transition-colors"
          title="Restablecer Vista"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="px-2 text-xs font-semibold text-slate-400 min-w-12 text-center border-l border-slate-800">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
};
