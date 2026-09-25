import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import Konva from 'konva';
import { Zone, TableElement, WaiterCall } from '../../types/database';
import { GridBackground } from './GridBackground';
import { TableNode } from './TableNode';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CroquisCanvasProps {
  zone: Zone;
  tables: TableElement[];
  selectedTableId: string | null;
  isEditorMode: boolean;
  snapToGrid: boolean;
  activeCalls?: WaiterCall[];
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
  activeCalls = [],
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
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Only run the 1s urgency timer tick when there are active calls, avoiding idle re-renders
  useEffect(() => {
    if (activeCalls.length === 0) return;
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeCalls.length]);

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
      className="relative flex-1 w-full h-full bg-apple-bg overflow-hidden cursor-default select-none"
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
          {tables.map((table) => {
            const tableCall = activeCalls.find(
              (c) => c.tableId === table.id && (c.status === 'pending' || c.status === 'attending')
            );

            return (
              <TableNode
                key={table.id}
                table={table}
                isSelected={isEditorMode && selectedTableId === table.id}
                isEditorMode={isEditorMode}
                snapToGridEnabled={snapToGrid}
                activeCall={tableCall}
                currentTime={currentTime}
                onSelect={onSelectTable}
                onChange={onUpdateTable}
                onClick={onTableClick}
                registerNodeRef={registerNodeRef}
              />
            );
          })}

          {/* Transformer handles with Apple Design colors and ignoreStroke for max speed */}
          {isEditorMode && (
            <Transformer
              ref={transformerRef}
              ignoreStroke={true}
              keepRatio={false}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 50 || newBox.height < 50) {
                  return oldBox;
                }
                return newBox;
              }}
              anchorSize={8}
              anchorCornerRadius={4}
              anchorFill="#ffffff"
              anchorStroke="#0a84ff"
              borderStroke="#0a84ff"
              borderStrokeWidth={1.5}
              borderDash={[4, 4]}
              rotateAnchorOffset={22}
            />
          )}
        </Layer>
      </Stage>

      {/* Floating Canvas Controls with Apple Glassmorphism */}
      <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-apple-card/85 backdrop-blur-xl p-1.5 rounded-2xl border border-apple-border shadow-xl z-10 text-apple-label transition-all">
        <button
          onClick={() => handleZoom('in')}
          className="p-2 hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-4 h-4 text-apple-label" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-2 hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4 text-apple-label" />
        </button>
        <button
          onClick={() => handleZoom('reset')}
          className="p-2 hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          title="Restablecer Vista"
        >
          <RotateCcw className="w-4 h-4 text-apple-label" />
        </button>
        <div className="px-2.5 text-xs font-semibold text-apple-label-sec min-w-12 text-center border-l border-apple-border">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
};
