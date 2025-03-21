import { useCallback } from 'react';

// 新しい状態構造に対応した型定義
interface AppState {
  view: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
}

export const useCanvasCoordinates = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  state: AppState,
  margin: number = 0
) => {
  // 座標変換: クライアント座標 → キャンバス座標（マージン込み）
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();

    // クライアント座標からキャンバス表示領域内の相対座標を計算
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // スケールとオフセットを考慮して元の座標に変換
    // マージンを引くことで、画像の実際の座標に変換
    const x = relativeX / state.view.scale - margin;
    const y = relativeY / state.view.scale - margin;

    return { x, y };
  }, [canvasRef, state.view.scale, margin]);

  // 点が矩形の中にあるかチェック
  const isPointInRectangle = useCallback((x: number, y: number, polygon: number[]) => {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = polygon;

    // 単純な軸並行矩形の場合
    const minX = Math.min(x1, x2, x3, x4);
    const maxX = Math.max(x1, x2, x3, x4);
    const minY = Math.min(y1, y2, y3, y4);
    const maxY = Math.max(y1, y2, y3, y4);

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }, []);

  // マウス位置から矩形を検索
  const findRectangleAtPosition = useCallback((x: number, y: number, annotations: any[]) => {
    for (let i = 0; i < annotations.length; i++) {
      if (isPointInRectangle(x, y, annotations[i].polygon)) {
        return i;
      }
    }
    return -1;
  }, [isPointInRectangle]);

  return {
    getCanvasCoordinates,
    isPointInRectangle,
    findRectangleAtPosition
  };
};