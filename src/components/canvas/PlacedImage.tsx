// src/components/canvas/PlacedImage.tsx
import { useRef, useEffect, useState } from 'react';
import * as ReactKonva from 'react-konva';
import { useBoardStore, type ImageElement as ImageEl } from '../../store/boardStore';
import { designSystem } from '../../styles/design-system';

interface PlacedImageProps {
  image: ImageEl;
  isSelected: boolean;
  onSelect: () => void;
}

export const PlacedImage = ({ image, isSelected, onSelect }: PlacedImageProps) => {
  const { updateElement, currentBoardId } = useBoardStore();
  const groupRef = useRef(null as any);
  const transformerRef = useRef(null as any);
  const [imgNode, setImgNode] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const im = new window.Image();
    if (!image.src.startsWith('data:')) im.crossOrigin = 'anonymous';
    im.onload = () => { if (!cancelled) setImgNode(im); };
    im.onerror = () => { if (!cancelled) setImgNode(null); };
    im.src = image.src;
    return () => {
      cancelled = true;
      im.onload = null;
      im.onerror = null;
    };
  }, [image.src]);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, imgNode]);

  const handleDragEnd = (e: any) => {
    if (!currentBoardId) return;
    updateElement(currentBoardId, image.id, {
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
    updateElement(currentBoardId, image.id, {
      position: { x: node.x(), y: node.y() },
      size: {
        width:  Math.max(40, image.size.width  * scaleX),
        height: Math.max(40, image.size.height * scaleY),
      },
    });
  };

  const currentTool = useBoardStore.getState().currentTool;
  const isSelectTool = currentTool === 'select';

  if (!imgNode) return null;

  return (
    <>
      <ReactKonva.Group
        ref={groupRef}
        x={image.position.x}
        y={image.position.y}
        draggable={isSelectTool}
        onDragEnd={handleDragEnd}
        onClick={onSelect}
        onTap={onSelect}
        onTransformEnd={handleTransformEnd}
      >
        <ReactKonva.Image
          image={imgNode}
          width={image.size.width}
          height={image.size.height}
          stroke={isSelected ? designSystem.colors.primary[500] : undefined}
          strokeWidth={isSelected ? 2 : 0}
        />
      </ReactKonva.Group>

      {isSelected && (
        <ReactKonva.Transformer
          ref={transformerRef}
          flipEnabled={false}
          rotateEnabled={false}
          keepRatio
          borderStroke={designSystem.colors.primary[500]}
          borderStrokeWidth={2}
          anchorStroke={designSystem.colors.primary[500]}
          anchorStrokeWidth={1.5}
          anchorFill="white"
          anchorSize={8}
          anchorCornerRadius={2}
          boundBoxFunc={(_oldBox: any, newBox: any) => {
            if (newBox.width < 40 || newBox.height < 40) return _oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};
