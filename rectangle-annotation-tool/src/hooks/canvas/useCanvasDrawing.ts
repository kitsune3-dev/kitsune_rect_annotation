import { useCallback } from 'react';
import { colorMap, borderColorMap } from '../../utils/colorConstants';
import { AnnotationData } from '../../types/types';
import { drawText } from '../../utils/drawingUtils';

// AppStateの型をインポートせずに必要な構造を定義
interface AppState {
  selection: {
    selecting: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    hoveredAnnotationIndex: number;
    selectedAnnotations: number[];
    selectedLabelId: number;
  };
  view: {
    scale: number;
    offsetX: number;
    offsetY: number;
    isDragging: boolean;
  };
  mode: {
    mode: string;
    flashingIndices: number[];
    commandKeyPressed: boolean;
  };
}

export const useCanvasDrawing = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  backgroundCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  imageRef: React.RefObject<HTMLImageElement | null>,
  state: AppState,
  data: AnnotationData,
  margin: number = 0
) => {
  // キャンバスクリア - 複数キャンバス対応
  const clearCanvas = useCallback(() => {
    // 上レイヤー（矩形など）をクリア
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 中レイヤー（画像）をクリア
    const bgCanvas = backgroundCanvasRef.current;
    if (bgCanvas) {
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    }
    
    // 下レイヤー（パターン）はクリアしない - パターンは常に表示されるべき
  }, [canvasRef, backgroundCanvasRef]);

  // キャンバス描画メイン関数
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !bgCanvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    // 上レイヤーと中レイヤーだけをクリア
    clearCanvas();
    
    // 中レイヤー（画像表示用）の描画
    bgCtx.save();
    // 背景を透明に
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    // 画像のみ描画（マージンを考慮した位置に）
    bgCtx.drawImage(image, margin, margin);
    bgCtx.restore();
    
    // 上レイヤー（矩形などの描画用）
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 既存の矩形を描画
    data.annotation.forEach((anno, index) => {
      const [x1, y1, x2, y2, x3, y3, x4, y4] = anno.polygon;
      const isSelected = state.selection.selectedAnnotations.includes(index);
      const isHovered = state.selection.hoveredAnnotationIndex === index;
      const isFlashing = state.mode.flashingIndices.includes(index);
      
      // マージンを追加した座標に描画
      ctx.beginPath();
      ctx.moveTo(x1 + margin, y1 + margin);
      ctx.lineTo(x2 + margin, y2 + margin);
      ctx.lineTo(x3 + margin, y3 + margin);
      ctx.lineTo(x4 + margin, y4 + margin);
      ctx.closePath();
      
      // 塗りつぶし - バグ修正: 点滅中でも元の色を保持
      ctx.fillStyle = isFlashing 
        ? 'rgba(255, 255, 255, 0.8)' // 点滅中は白色
        : colorMap[anno.label_id];
      ctx.fill();
      
      // 枠線 - バグ修正: 点滅後に元の色に戻るように修正
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      ctx.strokeStyle = isFlashing 
        ? 'rgba(0, 0, 0, 0.8)' // 点滅中は黒色
        : isSelected 
          ? 'rgba(0, 0, 255, 0.8)' // 選択中は青色
          : isHovered 
            ? 'rgba(255, 165, 0, 0.8)' // ホバー中はオレンジ
            : borderColorMap[anno.label_id];
      ctx.stroke();
      
      // フォント設定
      ctx.font = '12px Arial';
      
      // IDとラベル名をテキスト描画（マージン込み）
      const labelName = data.labels[anno.label_id.toString()];
      const labelText = `${anno.id}: ${labelName}`;
      
      // drawTextを使用する場合
      drawText(ctx, labelText, x1 + margin + 5, y1 + margin + 12, {
        withBackground: true,
        bgFillStyle: 'rgba(0, 0, 0, 0.7)',
        textFillStyle: 'white',
        font: '12px Arial'
      });
    });
    
    // 現在の選択範囲を描画
    if (state.selection.selecting) {
      const { startX, startY, currentX, currentY } = state.selection;
      
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      ctx.fillStyle = colorMap[state.selection.selectedLabelId];
      ctx.fillRect(x + margin, y + margin, width, height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderColorMap[state.selection.selectedLabelId];
      ctx.strokeRect(x + margin, y + margin, width, height);
      
      // 選択中の範囲にもラベル情報を表示
      if (width > 50 && height > 20) { // 一定以上のサイズの場合のみ表示
        const labelName = data.labels[state.selection.selectedLabelId.toString()];
        const labelText = `${labelName}`;
        
        drawText(ctx, labelText, x + margin + 5, y + margin + 12, {
          withBackground: true,
          bgFillStyle: 'rgba(0, 0, 0, 0.7)',
          textFillStyle: 'white',
          font: '12px Arial'
        });
      }
    }
    
    ctx.restore();
  }, [
    canvasRef, 
    backgroundCanvasRef,
    imageRef, 
    state.selection.selecting, 
    state.selection.startX, 
    state.selection.startY, 
    state.selection.currentX, 
    state.selection.currentY, 
    state.selection.hoveredAnnotationIndex,
    state.selection.selectedAnnotations,
    state.selection.selectedLabelId,
    state.mode.flashingIndices,
    data.annotation,
    data.labels,
    clearCanvas,
    margin
  ]);

  // カーソルスタイル更新
  const updateCursorStyle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (state.mode.commandKeyPressed || state.view.isDragging) {
      canvas.style.cursor = 'grab';
      if (state.view.isDragging) {
        canvas.style.cursor = 'grabbing';
      }
    } else if (state.selection.selecting) {
      canvas.style.cursor = 'crosshair';
    } else if (state.mode.mode === 'add') {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = 'default';
    }
  }, [
    canvasRef, 
    state.mode.commandKeyPressed, 
    state.view.isDragging, 
    state.selection.selecting, 
    state.mode.mode
  ]);

  // キャンバス位置更新 - 複数キャンバス対応
  const updateCanvasPosition = useCallback(() => {
    // すべてのキャンバスに同じスケールと位置を適用
    const applyPositioning = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      
      // スケールと位置の設定
      canvas.style.transform = `scale(${state.view.scale})`;
      canvas.style.transformOrigin = '0 0';
      canvas.style.left = `${state.view.offsetX}px`;
      canvas.style.top = `${state.view.offsetY}px`;
    };
    
    // 各キャンバスに適用
    applyPositioning(canvasRef.current);
    applyPositioning(backgroundCanvasRef.current);
    
    // 直接patternCanvasRefにアクセス
    const patternCanvas = document.querySelector('canvas[ref="patternCanvasRef"]') as HTMLCanvasElement;
    if (patternCanvas) {
      applyPositioning(patternCanvas);
    } else {
      // RefオブジェクトのpatternCanvasRefを直接使用
      applyPositioning(document.getElementById('pattern-canvas') as HTMLCanvasElement);
    }
  }, [canvasRef, backgroundCanvasRef, state.view.scale, state.view.offsetX, state.view.offsetY]);

  return {
    drawCanvas,
    clearCanvas,
    updateCursorStyle,
    updateCanvasPosition
  };
};