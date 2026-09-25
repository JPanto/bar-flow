import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import Konva from 'konva';
import { Zone, TableElement, WaiterCall } from '../../types/database';
import { GridBackground } from './GridBackground';
import { TableNode } from './TableNode';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

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
  zone, tables, selectedTableId, isEditorMode, snapToGrid, activeCalls = [],
  onSelectTable, onUpdateTable, onTableClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodesRef = useRef<Map<string, Konva.Group>>(new Map());
  const { resolvedTheme } = useTheme();

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const lastDistRef = useRef<number>(0);

  // Only run the 1s urgency timer tick when there are active calls
  useEffect(() => {
    if (activeCalls.length === 0) return;
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeCalls.length]);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const registerNodeRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodesRef.current.set(id, node);
    else nodesRef.current.delete(id);
  }, []);

  // Attach transformer to selected node in Editor Mode
  useEffect(() => {
    if (!isEditorMode || !selectedTableId || !transformerRef.current) {
      transformerRef.current?.nodes([]);
      transformerRef.current?.getLayer()?.batchDraw();
      return;
    }
    const node = nodesRef.current.get(selectedTableId);
    transformerRef.current.nodes(node ? [node] : []);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedTableId, isEditorMode, tables]);

  // Zoom handlers
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'reset') {
      setScale(1);
      setPosition({ x: 40, y: 40 });
      return;
    }
    const factor = direction === 'in' ? 1.2 : 0.8;
    setScale((prev) => Math.min(Math.max(prev * factor, 0.3), 3.0));
  };

  // Wheel zoom (Desktop trackpad / mouse)
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const factor = e.evt.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(oldScale * factor, 0.3), 3.0);

    setScale(newScale);
    setPosition({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };

  // Multi-Touch Pinch-to-Zoom & Pan (Mobile / Tablet iOS & Android)
  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const [t1, t2] = e.evt.touches;
    const stage = stageRef.current;
    if (!t1 || !t2 || !stage) return;
    e.evt.preventDefault();
    if (stage.isDragging()) stage.stopDrag();

    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    if (!lastDistRef.current) lastDistRef.current = dist;

    const rect = containerRef.current?.getBoundingClientRect();
    const center = { x: (t1.clientX + t2.clientX) / 2 - (rect?.left || 0), y: (t1.clientY + t2.clientY) / 2 - (rect?.top || 0) };
    const curScale = stage.scaleX();
    const newScale = Math.min(Math.max(curScale * (dist / lastDistRef.current), 0.3), 3.0);
    const mousePointTo = { x: (center.x - stage.x()) / curScale, y: (center.y - stage.y()) / curScale };

    setScale(newScale);
    setPosition({ x: center.x - mousePointTo.x * newScale, y: center.y - mousePointTo.y * newScale });
    lastDistRef.current = dist;
  };

  return (
    <div ref={containerRef} className="relative flex-1 w-full h-full bg-apple-bg overflow-hidden cursor-default select-none touch-none transition-colors">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={!selectedTableId}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { lastDistRef.current = 0; }}
        onClick={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'background') onSelectTable(null); }}
        onTap={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'background') onSelectTable(null); }}
        onDragEnd={(e) => { if (e.target === stageRef.current) setPosition({ x: e.target.x(), y: e.target.y() }); }}
      >
        <Layer>
          <GridBackground
            zoneWidth={zone.width}
            zoneHeight={zone.height}
            gridSize={20}
            showGrid={isEditorMode}
            isDark={resolvedTheme === 'dark'}
          />
        </Layer>
        <Layer>
          {tables.map((table) => (
            <TableNode
              key={table.id}
              table={table}
              isSelected={isEditorMode && selectedTableId === table.id}
              isEditorMode={isEditorMode}
              snapToGridEnabled={snapToGrid}
              activeCall={activeCalls.find((c) => c.tableId === table.id && (c.status === 'pending' || c.status === 'attending'))}
              currentTime={currentTime}
              onSelect={onSelectTable}
              onChange={onUpdateTable}
              onClick={onTableClick}
              registerNodeRef={registerNodeRef}
            />
          ))}
          {isEditorMode && (
            <Transformer
              ref={transformerRef}
              ignoreStroke={true}
              keepRatio={false}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 50 || newBox.height < 50 ? oldBox : newBox)}
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
      <div className="absolute bottom-5 right-5 flex items-center gap-1 bg-apple-card/85 backdrop-blur-xl p-1.5 rounded-2xl border border-apple-border shadow-xl z-10 text-apple-label transition-all">
        <button onClick={() => handleZoom('in')} className="p-2 hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer" title="Acercar">
          <ZoomIn className="w-4 h-4 text-apple-label" />
        </button>
        <button onClick={() => handleZoom('out')} className="p-2 hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer" title="Alejar">
          <ZoomOut className="w-4 h-4 text-apple-label" />
        </button>
        <button onClick={() => handleZoom('reset')} className="p-2 hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer" title="Restablecer">
          <RotateCcw className="w-4 h-4 text-apple-label" />
        </button>
        <div className="px-2 text-xs font-semibold text-apple-label-sec min-w-10 text-center border-l border-apple-border">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
};
