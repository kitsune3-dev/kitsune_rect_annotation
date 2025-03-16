import { useCallback, useEffect, useRef } from 'react';
import { Annotation } from '../../types/types';

// 新しい状態構造に対応した型定義
interface AppState {
  selection: {
    selecting: boolean;
    hoveredAnnotationIndex: number;
    selectedAnnotations: number[];
  };
  view: {
    isDragging: boolean;
  };
  mode: {
    mode: string;
    commandKeyPressed: boolean;
  };
}

// イベントハンドラーの型定義
interface EventHandlers {
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
}

export const useCanvasEvents = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  state: AppState,
  getCanvasCoordinates: (clientX: number, clientY: number) => { x: number; y: number },
  findRectangleAtPosition: (x: number, y: number, annotations: Annotation[]) => number,
  requestDraw: () => void,
  updateStatusMessage: () => void,
  updateCursorStyle: () => void,
  handlers: EventHandlers,
  annotations: Annotation[]
) => {
  // 描画最適化のためのdebounce/throttle処理用
  const lastDrawTime = useRef(0);
  const mouseMoveThrottleDelay = 16; // 約60fpsに制限
  
  const {
    startSelection,
    updateSelection,
    finishSelection,
    setHoveredAnnotationIndex,
    toggleAnnotationSelection,
    renumberAnnotation,
    startDrag,
    updateDrag,
    endDrag,
    setCommandKeyPressed,
    zoomIn,
    zoomOut
  } = handlers;

  // マウスダウンイベントハンドラ - 改善版
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // commandキーが押されていたら画像ドラッグモード
    if (state.mode.commandKeyPressed) {
      startDrag(e.clientX, e.clientY);
      return;
    }

    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    switch (state.mode.mode) {
      case 'add':
        if (!state.selection.selecting) {
          // 矩形選択開始
          startSelection(coords.x, coords.y);
        } else {
          // 矩形選択終了
          finishSelection();
        }
        break;

      case 'delete':
      case 'renumber':
        // 矩形選択
        const index = findRectangleAtPosition(coords.x, coords.y, annotations);
        if (index !== -1) {
          if (state.mode.mode === 'delete') {
            // 削除モード: 選択トグル
            toggleAnnotationSelection(index);
            // 描画を即時更新
            requestDraw();
          } else if (state.mode.mode === 'renumber') {
            // 番号振り直しモード
            renumberAnnotation(index);
            // 描画を即時更新
            requestDraw();
          }
        } else {
          console.log('クリック位置に矩形がありません');
        }
        break;
    }

    // ステータスメッセージ更新
    updateStatusMessage();
  }, [
    state.mode.commandKeyPressed, 
    state.mode.mode, 
    state.selection.selecting, 
    startDrag, 
    getCanvasCoordinates, 
    startSelection, 
    finishSelection, 
    findRectangleAtPosition, 
    annotations, 
    toggleAnnotationSelection, 
    renumberAnnotation, 
    requestDraw, 
    updateStatusMessage
  ]);

  // マウスムーブイベントハンドラ - 改善版
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const now = performance.now();
    if (now - lastDrawTime.current < mouseMoveThrottleDelay && 
        !state.selection.selecting && 
        !state.view.isDragging) {
      // スロットリング: 高頻度の再描画を防止（選択中やドラッグ中は除外）
      return;
    }
    lastDrawTime.current = now;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    if (state.view.isDragging) {
      // 画像ドラッグ
      updateDrag(e.clientX, e.clientY);
      requestDraw(); // ドラッグ中は即時描画
      return;
    }

    switch (state.mode.mode) {
      case 'add':
        if (state.selection.selecting) {
          // 選択領域の更新
          updateSelection(coords.x, coords.y);
          updateStatusMessage();
          requestDraw(); // 選択中は即時描画
        }
        break;

      case 'delete':
      case 'renumber':
        // マウスホバー効果
        const index = findRectangleAtPosition(coords.x, coords.y, annotations);
        if (index !== state.selection.hoveredAnnotationIndex) {
          setHoveredAnnotationIndex(index);
          requestDraw(); // ホバー状態変更時は即時描画
        }
        break;
    }
  }, [
    state.view.isDragging, 
    state.mode.mode, 
    state.selection.selecting, 
    state.selection.hoveredAnnotationIndex,
    getCanvasCoordinates, 
    updateDrag, 
    updateSelection, 
    findRectangleAtPosition, 
    annotations, 
    setHoveredAnnotationIndex, 
    updateStatusMessage, 
    requestDraw,
    mouseMoveThrottleDelay
  ]);

  // マウスアップイベントハンドラ - 改善版
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (state.view.isDragging) {
      endDrag();
    }
  }, [state.view.isDragging, endDrag]);

  // マウスアウトイベントハンドラ - 改善版
  const handleMouseOut = useCallback(() => {
    if (state.selection.hoveredAnnotationIndex !== -1) {
      setHoveredAnnotationIndex(-1);
      requestDraw();
    }
  }, [state.selection.hoveredAnnotationIndex, setHoveredAnnotationIndex, requestDraw]);

  // ホイールイベントハンドラ (ズーム) - 改善版
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // 標準のスクロール動作を防止
    e.preventDefault();
    e.stopPropagation();

    // ズーム処理
    if (e.deltaY < 0) {
      // ズームイン (ホイールを上に回した)
      zoomIn();
    } else {
      // ズームアウト (ホイールを下に回した)
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  // キーイベントハンドラ - 改善版
  useEffect(() => {
    // キーダウンイベントハンドラ
    const handleKeyDown = (e: KeyboardEvent) => {
      // Macのcommandキー (metaKey) または Windowsのctrlキー (ctrlKey)
      if (e.metaKey || e.ctrlKey) {
        setCommandKeyPressed(true);
        updateCursorStyle();
      }
    };

    // キーアップイベントハンドラ
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setCommandKeyPressed(false);
        updateCursorStyle();
      }
    };

    // グローバルイベントリスナー
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [setCommandKeyPressed, updateCursorStyle]);


  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseOut,
    handleWheel
  };
};