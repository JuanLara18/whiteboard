// src/components/notes/StickyNote.tsx
import { useRef, useState, useEffect } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import { useBoardStore, StickyNote as StickyNoteType } from '../../store/boardStore';
import { designSystem } from '../../styles/design-system';

interface StickyNoteProps {
  note: StickyNoteType;
  isSelected: boolean;
  onSelect: () => void;
}

export const StickyNote = ({ note, isSelected, onSelect }: StickyNoteProps) => {
  const { updateElement, currentBoardId } = useBoardStore();
  const groupRef = useRef(null as any);
  const transformerRef = useRef(null as any);
  const textRef = useRef(null as any);

  const [editing, setEditing] = useState(false);

  // Wire transformer to the group node when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => {
    if (!currentBoardId) return;
    updateElement(currentBoardId, note.id, {
      position: { x: e.target.x(), y: e.target.y() },
    });
  };

  const handleTransformEnd = () => {
    if (!currentBoardId || !groupRef.current) return;
    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateElement(currentBoardId, note.id, {
      position: { x: node.x(), y: node.y() },
      size: {
        width:  Math.max(100, node.width()  * scaleX),
        height: Math.max(80,  node.height() * scaleY),
      },
    });
  };

  // Open an overlay textarea that matches the note's position, size, and zoom level
  const openEditor = () => {
    if (!currentBoardId) return;
    const node = textRef.current;
    if (!node) return;

    const stage    = node.getStage();
    const scale    = stage.scaleX();           // current zoom
    const stageBox = stage.container().getBoundingClientRect();
    const absPos   = node.absolutePosition();  // already accounts for stage transform

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = note.content;
    textarea.className = 'sticky-note-editor';

    Object.assign(textarea.style, {
      position:        'fixed',                // use fixed to ignore scroll
      top:             `${stageBox.top  + absPos.y}px`,
      left:            `${stageBox.left + absPos.x}px`,
      width:           `${(note.size.width  - 24) * scale}px`,
      height:          `${(note.size.height - 24) * scale}px`,
      fontSize:        `${13 * scale}px`,
      lineHeight:      '1.5',
      fontFamily:      designSystem.typography.fonts.sans,
      padding:         '0',
      margin:          '0',
      zIndex:          '9999',
      background:      note.color,
      color:           designSystem.colors.gray[800],
      border:          `2px solid ${designSystem.colors.primary[500]}`,
      borderRadius:    `${4 * scale}px`,
      resize:          'none',
      outline:         'none',
      boxSizing:       'border-box',
    });

    textarea.focus();
    textarea.select();

    const close = () => {
      if (!document.body.contains(textarea)) return;
      const newContent = textarea.value;
      document.body.removeChild(textarea);
      setEditing(false);
      if (newContent !== note.content) {
        updateElement(currentBoardId, note.id, { content: newContent });
      }
    };

    textarea.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey)) || e.key === 'Escape') {
        close();
      }
    });
    textarea.addEventListener('blur', close);
  };

  useEffect(() => {
    if (editing) openEditor();
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSelectTool = useBoardStore.getState().currentTool === 'select';

  return (
    <>
      <Group
        ref={groupRef}
        x={note.position.x}
        y={note.position.y}
        draggable={isSelectTool}
        onDragEnd={handleDragEnd}
        onClick={onSelect}
        onTap={onSelect}
        onTransformEnd={handleTransformEnd}
        onDblClick={() => setEditing(true)}
        onDblTap={() => setEditing(true)}
      >
        {/* Background */}
        <Rect
          width={note.size.width}
          height={note.size.height}
          fill={note.color}
          stroke={isSelected ? designSystem.colors.primary[500] : 'rgba(0,0,0,0.06)'}
          strokeWidth={isSelected ? 2 : 1}
          shadowColor="rgba(0,0,0,0.12)"
          shadowBlur={8}
          shadowOffset={{ x: 0, y: 2 }}
          shadowOpacity={1}
          cornerRadius={6}
        />
        {/* Text */}
        <Text
          ref={textRef}
          x={12}
          y={12}
          width={note.size.width  - 24}
          height={note.size.height - 24}
          text={editing ? '' : note.content}
          fontSize={13}
          fontFamily={designSystem.typography.fonts.sans}
          fill={designSystem.colors.gray[800]}
          align="left"
          verticalAlign="top"
          wrap="word"
          lineHeight={1.5}
        />
      </Group>

      {/* Resize handles */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
          rotateEnabled={false}
          borderStroke={designSystem.colors.primary[500]}
          borderStrokeWidth={2}
          anchorStroke={designSystem.colors.primary[500]}
          anchorStrokeWidth={1.5}
          anchorFill="white"
          anchorSize={8}
          anchorCornerRadius={2}
          keepRatio={false}
          boundBoxFunc={(_oldBox: any, newBox: any) => {
            if (newBox.width  < 100) newBox.width  = 100;
            if (newBox.height < 80)  newBox.height = 80;
            return newBox;
          }}
        />
      )}
    </>
  );
};
