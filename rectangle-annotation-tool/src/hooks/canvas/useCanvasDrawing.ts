import { useCallback } from 'react';
import { colorMap, borderColorMap } from '../../utils/colorConstants';
import { AnnotationData } from '../../types/types';

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
  imageRef: React.RefObject<HTMLImageElement | null>,
  state: AppState,
  data: AnnotationData
) => {
  // キャンバスクリア
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  // ラベル表示のためのヘルパー関数
  const drawLabelWithBackground = useCallback((
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number,
    padding = 3
  ) => {
    // テキストの大きさを計算
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 12; // フォントサイズに合わせて調整

    // 背景の描画（黒色の半透明背景）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
      x, 
      y - textHeight, 
      textWidth + padding * 2, 
      textHeight + padding * 2
    );
    
    // テキストの描画（白色）
    ctx.fillStyle = 'white';
    ctx.fillText(text, x + padding, y + padding);
  }, []);

  // キャンバス描画メイン関数
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    clearCanvas();
    
    // スケールとオフセットを適用
    ctx.save();
    ctx.translate(state.view.offsetX, state.view.offsetY);
    ctx.scale(state.view.scale, state.view.scale);
    
    // 画像描画
    ctx.drawImage(image, 0, 0);
    
    // 既存の矩形を描画
    data.annotation.forEach((anno, index) => {
      const [x1, y1, x2, y2, x3, y3, x4, y4] = anno.polygon;
      const isSelected = state.selection.selectedAnnotations.includes(index);
      const isHovered = state.selection.hoveredAnnotationIndex === index;
      const isFlashing = state.mode.flashingIndices.includes(index);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      
      // 塗りつぶし
      ctx.fillStyle = isFlashing 
        ? 'rgba(255, 255, 255, 0.8)' // 点滅中は白色
        : colorMap[anno.label_id];
      ctx.fill();
      
      // 枠線
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
      
      // IDとラベル名を黒背景白文字で表示
      const labelName = data.labels[anno.label_id.toString()];
      const labelText = `${anno.id}: ${labelName}`;
      drawLabelWithBackground(ctx, labelText, x1 + 5, y1 + 12);
    });
    
    // 現在の選択範囲を描画
    if (state.selection.selecting) {
      const { startX, startY, currentX, currentY } = state.selection;
      
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      ctx.fillStyle = colorMap[state.selection.selectedLabelId];
      ctx.fillRect(x, y, width, height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderColorMap[state.selection.selectedLabelId];
      ctx.strokeRect(x, y, width, height);
      
      // 選択中の範囲にもラベル情報を表示
      if (width > 50 && height > 20) { // 一定以上のサイズの場合のみ表示
        const labelName = data.labels[state.selection.selectedLabelId.toString()];
        const labelText = `${labelName}`;
        drawLabelWithBackground(ctx, labelText, x + 5, y + 12);
      }
    }
    
    ctx.restore();
  }, [
    canvasRef, 
    imageRef, 
    state.view.scale, 
    state.view.offsetX, 
    state.view.offsetY, 
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
    drawLabelWithBackground
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

  // キャンバス位置更新
  const updateCanvasPosition = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // スケールに応じたサイズ設定
    canvas.style.transform = `scale(${state.view.scale})`;
    canvas.style.transformOrigin = '0 0';
    canvas.style.left = `${state.view.offsetX}px`;
    canvas.style.top = `${state.view.offsetY}px`;
  }, [canvasRef, state.view.scale, state.view.offsetX, state.view.offsetY]);

  return {
    drawCanvas,
    clearCanvas,
    updateCursorStyle,
    updateCanvasPosition
  };
};