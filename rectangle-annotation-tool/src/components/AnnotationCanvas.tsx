import React, { useRef, useEffect } from 'react';
import { useCanvas } from '../hooks/canvas/useCanvas';

// マージンの大きさ（ピクセル）
const CANVAS_MARGIN = 50;

const AnnotationCanvas: React.FC = () => {
  const {
    canvasRef,
    backgroundCanvasRef,
    patternCanvasRef,
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
    isImageLoaded,
    canvasWidth,
    canvasHeight
  } = useCanvas();

  // 下レイヤー（ストライプパターン）の描画
  useEffect(() => {
    const patternCanvas = patternCanvasRef.current;
    if (!patternCanvas || !canvasWidth || !canvasHeight) return;

    const totalWidth = canvasWidth + CANVAS_MARGIN * 2;
    const totalHeight = canvasHeight + CANVAS_MARGIN * 2;
    
    patternCanvas.width = totalWidth;
    patternCanvas.height = totalHeight;
    
    const ctx = patternCanvas.getContext('2d');
    if (!ctx) return;
    
    // ストライプパターンの描画
    const stripeSize = 10; // ストライプの幅
    ctx.fillStyle = '#f5f5f5'; // 背景色
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    ctx.fillStyle = '#e0e0e0'; // ストライプ色
    
    // ストライプを斜めに描画
    for (let i = -totalHeight; i < totalWidth + totalHeight; i += stripeSize * 2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + totalHeight, totalHeight);
      ctx.lineTo(i + totalHeight - stripeSize, totalHeight);
      ctx.lineTo(i - stripeSize, 0);
      ctx.closePath();
      ctx.fill();
    }
    
    // マージン領域をわかりやすくするための枠線
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(CANVAS_MARGIN, CANVAS_MARGIN, canvasWidth, canvasHeight);
  }, [patternCanvasRef, canvasWidth, canvasHeight]);

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-transparent" // overflow-hiddenを削除
      style={{ minHeight: '100%', minWidth: '100%' }} // 最小サイズを設定
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* 下レイヤー（ストライプパターン） */}
      <canvas
        id="pattern-canvas"
        ref={patternCanvasRef}
        className="absolute left-0 top-0"
        style={{ zIndex: 1 }}
      />
      
      {/* 中レイヤー（画像表示用） */}
      <canvas
        id="background-canvas"
        ref={backgroundCanvasRef}
        className="absolute left-0 top-0"
        style={{ zIndex: 2 }}
      />
      
      {/* 上レイヤー（アノテーション用） */}
      <canvas
        id="annotation-canvas"
        ref={canvasRef}
        className="absolute left-0 top-0 cursor-crosshair"
        style={{ zIndex: 3 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseOut}
      />
      
      {/* 読み込み中表示 */}
      {!isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500" style={{ zIndex: 4 }}>
          画像読み込み中...
        </div>
      )}
    </div>
  );
};

export default AnnotationCanvas;