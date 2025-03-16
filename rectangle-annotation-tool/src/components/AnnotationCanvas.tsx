import React from 'react';
import { useCanvas } from '../hooks/canvas/useCanvas';

const AnnotationCanvas: React.FC = () => {
  const {
    canvasRef,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseOut,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    isImageLoaded
  } = useCanvas();

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-gray-200" 
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* メインキャンバス */}
      <canvas
        ref={canvasRef}
        className="absolute cursor-crosshair"
        style={{ zIndex: 1 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseOut}
      />
      
      {/* 読み込み中表示 */}
      {!isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          画像読み込み中...
        </div>
      )}
    </div>
  );
};

export default AnnotationCanvas;