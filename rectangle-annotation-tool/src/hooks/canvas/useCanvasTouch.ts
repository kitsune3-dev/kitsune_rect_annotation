import { useCallback, useState, RefObject } from 'react';
import { Annotation } from '../../types/types';

// 新しい状態構造に対応した型定義
interface AppState {
  selection: {
    selecting: boolean;
    selectedAnnotations: number[];
  };
  view: {
    isDragging: boolean;
    scale: number;
  };
  mode: {
    mode: string;
  };
}

// ピンチズームのための状態を追跡
interface TouchState {
  initialPinchDistance: number | null;
  initialScale: number | null;
  lastTouchCount: number;
  lastTouchX: number | null;
  lastTouchY: number | null;
  isTouchActive: boolean;
}

// ハンドラーのインターフェース
interface TouchHandlers {
  startSelection: (x: number, y: number) => void;
  updateSelection: (x: number, y: number) => void;
  finishSelection: () => void;
  setHoveredAnnotationIndex: (index: number) => void;
  toggleAnnotationSelection: (index: number) => void;
  renumberAnnotation: (index: number) => void;
  startDrag: (clientX: number, clientY: number) => void;
  updateDrag: (clientX: number, clientY: number) => void;
  endDrag: () => void;
  setCommandKeyPressed: (pressed: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  updateCanvasScale: (scale: number) => void;
}

export const useCanvasTouch = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  state: AppState,
  getCanvasCoordinates: (clientX: number, clientY: number) => { x: number; y: number },
  findRectangleAtPosition: (x: number, y: number, annotations: Annotation[]) => number,
  handlers: TouchHandlers,
  annotations: Annotation[],
  requestDraw: () => void
) => {
  // タッチ状態の初期化
  const [touchState, setTouchState] = useState<TouchState>({
    initialPinchDistance: null,
    initialScale: null,
    lastTouchCount: 0,
    lastTouchX: null,
    lastTouchY: null,
    isTouchActive: false
  });

  // 2点間の距離を計算
  const calculateDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // タッチ開始イベントハンドラ - 改善版
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // デフォルトのスクロールやズームを防止

    if (e.touches.length === 1) {
      // シングルタッチ：選択または操作開始
      const touch = e.touches[0];
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

      // モードに応じた処理
      switch (state.mode.mode) {
        case 'add':
          if (!state.selection.selecting) {
            handlers.startSelection(coords.x, coords.y);
          }
          break;
        case 'delete':
        case 'renumber':
          // タッチ位置のインデックスを取得
          const idx = findRectangleAtPosition(coords.x, coords.y, annotations);
          if (idx !== -1) {
            if (state.mode.mode === 'delete') {
              handlers.toggleAnnotationSelection(idx);
            } else if (state.mode.mode === 'renumber') {
              handlers.renumberAnnotation(idx);
            }
          }
          break;
      }

      // タッチ状態を更新
      setTouchState({
        ...touchState,
        lastTouchCount: 1,
        lastTouchX: touch.clientX,
        lastTouchY: touch.clientY,
        isTouchActive: true
      });

    } else if (e.touches.length === 2) {
      // ピンチズーム開始
      const distance = calculateDistance(e.touches[0], e.touches[1]);
      
      setTouchState({
        ...touchState,
        initialPinchDistance: distance,
        initialScale: state.view.scale,
        lastTouchCount: 2,
        // 2本指の中心座標を計算
        lastTouchX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        lastTouchY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        isTouchActive: true
      });
    }
  }, [
    state.mode.mode, 
    state.selection.selecting, 
    state.view.scale,
    touchState, 
    handlers, 
    getCanvasCoordinates, 
    findRectangleAtPosition, 
    annotations
  ]);

  // タッチ移動イベントハンドラ - 改善版
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!touchState.isTouchActive) return;

    if (e.touches.length === 1) {
      // 単一タッチでの移動
      const touch = e.touches[0];

      if (state.selection.selecting) {
        // 選択中の場合、選択範囲を更新
        const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
        handlers.updateSelection(coords.x, coords.y);
      } else if (touchState.lastTouchX !== null && touchState.lastTouchY !== null) {
        // ドラッグで移動
        handlers.startDrag(touchState.lastTouchX, touchState.lastTouchY);
        handlers.updateDrag(touch.clientX, touch.clientY);
      }

      // 状態更新
      setTouchState({
        ...touchState,
        lastTouchX: touch.clientX,
        lastTouchY: touch.clientY
      });

    } else if (e.touches.length === 2 && touchState.initialPinchDistance !== null && touchState.initialScale !== null) {
      // ピンチズーム処理
      const currentDistance = calculateDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDistance / touchState.initialPinchDistance;
      
      // スケールを更新（最小値と最大値を制限）
      const newScale = Math.max(0.1, Math.min(5, touchState.initialScale * scaleChange));
      handlers.updateCanvasScale(newScale);

      // 描画更新をリクエスト
      requestDraw();
    }
  }, [
    touchState,
    state.selection.selecting,
    getCanvasCoordinates,
    handlers,
    requestDraw,
    calculateDistance
  ]);

  // タッチ終了イベントハンドラ - 改善版
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    // 残っているタッチの数に応じて処理
    if (e.touches.length === 0) {
      // すべてのタッチが終了
      if (state.selection.selecting) {
        handlers.finishSelection();
      }
      
      if (state.view.isDragging) {
        handlers.endDrag();
      }

      // タッチ状態をリセット
      setTouchState({
        initialPinchDistance: null,
        initialScale: null,
        lastTouchCount: 0,
        lastTouchX: null,
        lastTouchY: null,
        isTouchActive: false
      });
    } else if (e.touches.length === 1) {
      // 2本指から1本指に変わった場合
      const touch = e.touches[0];
      setTouchState({
        initialPinchDistance: null,
        initialScale: null,
        lastTouchCount: 1,
        lastTouchX: touch.clientX,
        lastTouchY: touch.clientY,
        isTouchActive: true
      });
    }
  }, [state.selection.selecting, state.view.isDragging, handlers]);

  // タッチキャンセルハンドラ - 改善版
  const handleTouchCancel = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    // ドラッグを終了
    if (state.view.isDragging) {
      handlers.endDrag();
    }

    // タッチ状態をリセット
    setTouchState({
      initialPinchDistance: null,
      initialScale: null,
      lastTouchCount: 0,
      lastTouchX: null,
      lastTouchY: null,
      isTouchActive: false
    });
  }, [state.view.isDragging, handlers]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  };
};