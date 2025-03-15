/**
 * キャンバス描画関連のユーティリティ関数
 */
import { Annotation, ColorMap } from '../types/types';

// 色のマッピング
export const colorMap: ColorMap = {
  1: "rgba(255, 0, 0, 0.3)",
  2: "rgba(0, 255, 0, 0.3)",
  3: "rgba(0, 0, 255, 0.3)",
  4: "rgba(255, 255, 0, 0.3)",
  5: "rgba(255, 0, 255, 0.3)",
  6: "rgba(0, 255, 255, 0.3)",
  7: "rgba(128, 0, 128, 0.3)",
  8: "rgba(128, 128, 0, 0.3)",
  9: "rgba(0, 128, 128, 0.3)"
};

// 枠線の色マッピング
export const borderColorMap: ColorMap = {
  1: "rgb(255, 0, 0)",
  2: "rgb(0, 255, 0)",
  3: "rgb(0, 0, 255)",
  4: "rgb(255, 255, 0)",
  5: "rgb(255, 0, 255)",
  6: "rgb(0, 255, 255)",
  7: "rgb(128, 0, 128)",
  8: "rgb(128, 128, 0)",
  9: "rgb(0, 128, 128)"
};

// 矩形を描画
export const drawRectangle = (
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  options: {
    isSelected?: boolean;
    isHovered?: boolean;
    mode?: 'add' | 'delete' | 'renumber';
  } = {}
): void => {
  const { isSelected, isHovered, mode } = options;
  const [x1, y1, x2, y2, x3, y3, x4, y4] = annotation.polygon;
  
  // 通常の色/ホバー時の色/選択時の色を決定
  let fillColor = colorMap[annotation.label_id];
  let strokeColor = borderColorMap[annotation.label_id];
  let lineWidth = 2;
  
  if (isHovered && (mode === 'delete' || mode === 'renumber')) {
    // ホバー時は少し明るく
    fillColor = colorMap[annotation.label_id].replace('0.3', '0.5');
    lineWidth = 3;
  }
  
  if (isSelected) {
    // 選択時は強調
    if (mode === 'delete') {
      strokeColor = "rgb(255, 0, 0)"; // 削除モードでは赤枠
    } else if (mode === 'renumber') {
      strokeColor = "rgb(0, 128, 0)"; // 番号振り直しモードでは緑枠
    }
    lineWidth = 3;
  }
  
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // 番号振り直しモードで選択済みの場合、IDを表示
  if (mode === 'renumber' && isSelected) {
    drawIdCircle(ctx, annotation.id, (x1 + x3) / 2, (y1 + y3) / 2);
  }
};

// ID番号を円の中に描画
export const drawIdCircle = (
  ctx: CanvasRenderingContext2D,
  id: number,
  x: number,
  y: number,
  radius = 12
): void => {
  // 背景円
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // ID番号
  ctx.fillStyle = "black";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(id.toString(), x, y);
};

// 選択中の矩形を描画
export const drawSelectionRect = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number, 
  currentX: number,
  currentY: number,
  labelId: number
): void => {
  const x1 = Math.min(startX, currentX);
  const y1 = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  ctx.fillStyle = colorMap[labelId];
  ctx.strokeStyle = borderColorMap[labelId];
  ctx.lineWidth = 2;
  
  ctx.fillRect(x1, y1, width, height);
  ctx.strokeRect(x1, y1, width, height);
};

// 未選択矩形のフラッシュ効果
export const drawFlashingRectangle = (
  ctx: CanvasRenderingContext2D,
  annotation: Annotation
): void => {
  const [x1, y1, x2, y2, x3, y3, x4, y4] = annotation.polygon;
  
  // オレンジ色でハイライト
  ctx.fillStyle = "rgba(255, 165, 0, 0.5)";
  ctx.strokeStyle = "rgb(255, 165, 0)";
  ctx.lineWidth = 4;
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// 画像を描画（サイズ調整あり）
export const drawImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
): void => {
  // コンテキストの変換をリセット
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // キャンバスをクリア
  ctx.clearRect(0, 0, width, height);
  
  // 画像全体がキャンバスに表示されるように描画
  ctx.drawImage(image, 0, 0, width, height);
};

// 点が矩形の中にあるかチェック
export const isPointInRectangle = (
  x: number, 
  y: number, 
  polygon: number[]
): boolean => {
  const [x1, y1, x2, y2, x3, y3, x4, y4] = polygon;
  
  // 単純な軸並行矩形の場合
  const minX = Math.min(x1, x2, x3, x4);
  const maxX = Math.max(x1, x2, x3, x4);
  const minY = Math.min(y1, y2, y3, y4);
  const maxY = Math.max(y1, y2, y3, y4);
  
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
};