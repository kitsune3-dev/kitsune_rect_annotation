import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useReducer } from 'react';
import {
  AnnotationData,
  Annotation,
  Mode,
  Labels
} from '../types/types';

// 状態を論理的なグループに分割
interface SelectionState {
  selecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  selectedLabelId: number;
  hoveredAnnotationIndex: number;
  selectedAnnotations: number[];
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

interface ModeState {
  mode: Mode;
  lastAssignedId: number;
  commandKeyPressed: boolean;
  flashingIndices: number[];
}

interface AppState {
  selection: SelectionState;
  view: ViewState;
  mode: ModeState;
}

// 履歴エントリを定義
interface HistoryEntry {
  annotations: Annotation[];
}

interface AnnotationContextProps {
  // 状態
  data: AnnotationData;
  state: AppState;
  historyIndex: number;
  historyLength: number;

  // アクション
  setMode: (mode: Mode) => void;
  setSelectedLabelId: (id: number) => void;
  startSelection: (x: number, y: number) => void;
  updateSelection: (x: number, y: number) => void;
  finishSelection: () => void;
  setHoveredAnnotationIndex: (index: number) => void;
  toggleAnnotationSelection: (index: number) => void;
  clearSelectedAnnotations: () => void;
  deleteSelectedAnnotations: () => void;
  renumberAnnotation: (index: number) => void;
  completeRenumbering: () => boolean;
  flashUnselectedRectangles: () => void;
  undo: () => void;
  redo: () => void;
  saveData: () => void;
  startDrag: (x: number, y: number) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  setCommandKeyPressed: (pressed: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  updateCanvasSize: (width: number, height: number) => void;
  updateCanvasScale: (scale: number) => void;
}

// 初期ラベルデータ
const initialLabels: Labels = {
  "1": "章タイトル",
  "2": "節タイトル",
  "3": "概要",
  "4": "本文",
  "5": "補足",
  "6": "コラム",
  "7": "用語解説",
  "8": "図",
  "9": "表"
};

// 初期データ
const initialData: AnnotationData = {
  image: "test.png",
  labels: initialLabels,
  annotation: []
};

// 初期選択状態
const initialSelectionState: SelectionState = {
  selecting: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  selectedLabelId: 1,
  hoveredAnnotationIndex: -1,
  selectedAnnotations: []
};

// 初期ビュー状態
const initialViewState: ViewState = {
  isDragging: false,
  lastX: 0,
  lastY: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0
};

// 初期モード状態
const initialModeState: ModeState = {
  mode: 'add',
  lastAssignedId: 0,
  commandKeyPressed: false,
  flashingIndices: [] 
};

// 初期アプリケーション状態
const initialAppState: AppState = {
  selection: initialSelectionState,
  view: initialViewState,
  mode: initialModeState
};

// アクションタイプの定義
type Action =
  | { type: 'SET_MODE'; payload: { mode: Mode } }
  | { type: 'SET_SELECTED_LABEL_ID'; payload: { id: number } }
  | { type: 'START_SELECTION'; payload: { x: number; y: number } }
  | { type: 'UPDATE_SELECTION'; payload: { x: number; y: number } }
  | { type: 'FINISH_SELECTION' }
  | { type: 'SET_HOVERED_ANNOTATION_INDEX'; payload: { index: number } }
  | { type: 'TOGGLE_ANNOTATION_SELECTION'; payload: { index: number } }
  | { type: 'CLEAR_SELECTED_ANNOTATIONS' }
  | { type: 'SET_FLASHING_INDICES'; payload: { indices: number[] } }
  | { type: 'START_DRAG'; payload: { x: number; y: number } }
  | { type: 'UPDATE_DRAG'; payload: { x: number; y: number } }
  | { type: 'END_DRAG' }
  | { type: 'SET_COMMAND_KEY_PRESSED'; payload: { pressed: boolean } }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'ZOOM_RESET' }
  | { type: 'UPDATE_CANVAS_SCALE'; payload: { scale: number } }
  | { type: 'RENUMBER_ANNOTATION'; payload: { index: number; newId: number } };

// Reducerの実装
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: {
          ...state.mode,
          mode: action.payload.mode,
          lastAssignedId: 0
        },
        selection: {
          ...state.selection,
          selecting: false,
          hoveredAnnotationIndex: -1,
          selectedAnnotations: []
        }
      };

    case 'SET_SELECTED_LABEL_ID':
      // 選択中でなければラベルIDを更新
      if (state.selection.selecting) return state;
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedLabelId: action.payload.id
        }
      };

    case 'START_SELECTION':
      return {
        ...state,
        selection: {
          ...state.selection,
          selecting: true,
          startX: action.payload.x,
          startY: action.payload.y,
          currentX: action.payload.x,
          currentY: action.payload.y
        }
      };

    case 'UPDATE_SELECTION':
      return {
        ...state,
        selection: {
          ...state.selection,
          currentX: action.payload.x,
          currentY: action.payload.y
        }
      };

    case 'FINISH_SELECTION':
      return {
        ...state,
        selection: {
          ...state.selection,
          selecting: false
        }
      };

    case 'SET_HOVERED_ANNOTATION_INDEX':
      return {
        ...state,
        selection: {
          ...state.selection,
          hoveredAnnotationIndex: action.payload.index
        }
      };

    case 'TOGGLE_ANNOTATION_SELECTION':
      const selectedIndex = state.selection.selectedAnnotations.indexOf(action.payload.index);
      let newSelectedAnnotations;
      
      if (selectedIndex === -1) {
        // 未選択の場合は追加
        newSelectedAnnotations = [...state.selection.selectedAnnotations, action.payload.index];
      } else {
        // 既に選択されている場合は削除
        newSelectedAnnotations = [...state.selection.selectedAnnotations];
        newSelectedAnnotations.splice(selectedIndex, 1);
      }
      
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedAnnotations: newSelectedAnnotations
        }
      };

    case 'CLEAR_SELECTED_ANNOTATIONS':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedAnnotations: []
        }
      };

    case 'SET_FLASHING_INDICES':
      return {
        ...state,
        mode: {
          ...state.mode,
          flashingIndices: action.payload.indices
        }
      };

    case 'START_DRAG':
      return {
        ...state,
        view: {
          ...state.view,
          isDragging: true,
          lastX: action.payload.x,
          lastY: action.payload.y
        }
      };

    case 'UPDATE_DRAG':
      const dx = action.payload.x - state.view.lastX;
      const dy = action.payload.y - state.view.lastY;
      
      return {
        ...state,
        view: {
          ...state.view,
          offsetX: state.view.offsetX + dx,
          offsetY: state.view.offsetY + dy,
          lastX: action.payload.x,
          lastY: action.payload.y
        }
      };

    case 'END_DRAG':
      return {
        ...state,
        view: {
          ...state.view,
          isDragging: false
        }
      };

    case 'SET_COMMAND_KEY_PRESSED':
      return {
        ...state,
        mode: {
          ...state.mode,
          commandKeyPressed: action.payload.pressed
        }
      };

    case 'ZOOM_IN':
      return {
        ...state,
        view: {
          ...state.view,
          scale: state.view.scale * 1.1
        }
      };

    case 'ZOOM_OUT':
      return {
        ...state,
        view: {
          ...state.view,
          scale: Math.max(0.1, state.view.scale / 1.1)
        }
      };

    case 'ZOOM_RESET':
      return {
        ...state,
        view: {
          ...state.view,
          scale: 1,
          offsetX: 0,
          offsetY: 0
        }
      };

    case 'UPDATE_CANVAS_SCALE':
      return {
        ...state,
        view: {
          ...state.view,
          scale: Math.max(0.1, Math.min(5, action.payload.scale))
        }
      };

    case 'RENUMBER_ANNOTATION':
      return {
        ...state,
        mode: {
          ...state.mode,
          lastAssignedId: action.payload.newId
        },
        selection: {
          ...state.selection,
          selectedAnnotations: [...state.selection.selectedAnnotations, action.payload.index]
        }
      };

    default:
      return state;
  }
}

// 履歴管理カスタムフック
function useHistoryManager(initialAnnotations: Annotation[] = []) {
  const [history, setHistory] = useState<HistoryEntry[]>([{ annotations: initialAnnotations }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 履歴に新しい状態を追加
  const addHistoryState = useCallback((annotations: Annotation[]) => {
    const newEntry: HistoryEntry = {
      annotations: JSON.parse(JSON.stringify(annotations))
    };

    setHistory(prev => {
      // 現在のインデックスより後のものを削除し、新しい状態を追加
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newEntry];
    });

    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo操作
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      return history[historyIndex - 1].annotations;
    }
    return null;
  }, [history, historyIndex]);

  // Redo操作
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      return history[historyIndex + 1].annotations;
    }
    return null;
  }, [history, historyIndex]);

  return {
    addHistoryState,
    undo,
    redo,
    historyIndex,
    historyLength: history.length
  };
}

// コンテキスト作成
export const AnnotationContext = createContext<AnnotationContextProps | undefined>(undefined);

// コンテキストプロバイダ
export const AnnotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 基本データ状態
  const [data, setData] = useState<AnnotationData>(initialData);
  
  // キャンバスサイズ状態（コンテキストに含める必要はない）
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);
  
  // useReducerを使った状態管理
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  
  // 履歴管理
  const { 
    addHistoryState, 
    undo: historyUndo, 
    redo: historyRedo, 
    historyIndex, 
    historyLength 
  } = useHistoryManager();
  
  // フラッシュアニメーション用のタイムアウト参照
  const flashTimeoutRef = useRef<number | null>(null);

  // モード設定
  const setMode = useCallback((mode: Mode) => {
    dispatch({ type: 'SET_MODE', payload: { mode } });
  }, []);

  // 選択ラベルID設定
  const setSelectedLabelId = useCallback((id: number) => {
    dispatch({ type: 'SET_SELECTED_LABEL_ID', payload: { id } });
  }, []);

  // 選択開始
  const startSelection = useCallback((x: number, y: number) => {
    dispatch({ type: 'START_SELECTION', payload: { x, y } });
  }, []);

  // 選択更新
  const updateSelection = useCallback((x: number, y: number) => {
    dispatch({ type: 'UPDATE_SELECTION', payload: { x, y } });
  }, []);

  // 選択終了とアノテーション追加
  const finishSelection = useCallback(() => {
    const { startX, startY, currentX, currentY, selectedLabelId } = state.selection;

    if (Math.abs(currentX - startX) > 5 && Math.abs(currentY - startY) > 5) {
      const x1 = Math.min(startX, currentX);
      const y1 = Math.min(startY, currentY);
      const x2 = Math.max(startX, currentX);
      const y2 = Math.max(startY, currentY);

      const newId = data.annotation.length > 0
        ? Math.max(...data.annotation.map(a => a.id)) + 1
        : 1;

      const newAnnotation: Annotation = {
        id: newId,
        label_id: selectedLabelId,
        polygon: [
          x1, y1,  // 左上
          x2, y1,  // 右上
          x2, y2,  // 右下
          x1, y2   // 左下
        ]
      };

      const newAnnotations = [...data.annotation, newAnnotation];

      // 履歴に追加
      addHistoryState(newAnnotations);

      setData(prev => ({
        ...prev,
        annotation: newAnnotations
      }));
    }

    dispatch({ type: 'FINISH_SELECTION' });
  }, [state.selection, data.annotation, addHistoryState]);

  // ホバー状態更新
  const setHoveredAnnotationIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_HOVERED_ANNOTATION_INDEX', payload: { index } });
  }, []);

  // アノテーション選択トグル
  const toggleAnnotationSelection = useCallback((index: number) => {
    dispatch({ type: 'TOGGLE_ANNOTATION_SELECTION', payload: { index } });
  }, []);

  // 選択クリア
  const clearSelectedAnnotations = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_ANNOTATIONS' });
  }, []);

  // 選択削除
  const deleteSelectedAnnotations = useCallback(() => {
    if (state.selection.selectedAnnotations.length > 0) {
      const newAnnotations = data.annotation.filter((_, index) =>
        !state.selection.selectedAnnotations.includes(index)
      );

      // 履歴に追加
      addHistoryState(newAnnotations);

      setData(prev => ({
        ...prev,
        annotation: newAnnotations
      }));

      clearSelectedAnnotations();
    }
  }, [state.selection.selectedAnnotations, data.annotation, addHistoryState, clearSelectedAnnotations]);

  // 番号振り直し
  const renumberAnnotation = useCallback((index: number) => {
    if (state.mode.mode === 'renumber' && !state.selection.selectedAnnotations.includes(index)) {
      const newLastAssignedId = state.mode.lastAssignedId + 1;

      dispatch({ 
        type: 'RENUMBER_ANNOTATION', 
        payload: { index, newId: newLastAssignedId } 
      });

      const newAnnotations = [...data.annotation];
      newAnnotations[index] = {
        ...newAnnotations[index],
        id: newLastAssignedId
      };

      setData(prev => ({
        ...prev,
        annotation: newAnnotations
      }));
    }
  }, [state.mode.mode, state.mode.lastAssignedId, state.selection.selectedAnnotations, data.annotation]);

  // 番号振り直し完了確認
  const completeRenumbering = useCallback(() => {
    if (state.selection.selectedAnnotations.length < data.annotation.length) {
      return false;
    }

    // 履歴に追加
    addHistoryState(data.annotation);
    return true;
  }, [state.selection.selectedAnnotations.length, data.annotation, addHistoryState]);

  // 未選択矩形の強調表示（最適化バージョン）
  const flashUnselectedRectangles = useCallback(() => {
    // すでに実行中のタイムアウトがあればクリア
    if (flashTimeoutRef.current !== null) {
      clearTimeout(flashTimeoutRef.current as unknown as number);
      flashTimeoutRef.current = null;
    }

    // 未選択のインデックスを取得
    const unselectedIndices: number[] = [];
    for (let i = 0; i < data.annotation.length; i++) {
      if (!state.selection.selectedAnnotations.includes(i)) {
        unselectedIndices.push(i);
      }
    }

    if (unselectedIndices.length === 0) {
      return;
    }

    // 点滅回数とインターバル
    const flashCount = 3;
    const flashInterval = 200;

    // 点滅アニメーション関数
    const animateFlash = (currentCount: number, isOn: boolean) => {
      // 現在のフラッシュ状態を設定
      dispatch({ 
        type: 'SET_FLASHING_INDICES', 
        payload: { indices: isOn ? unselectedIndices : [] } 
      });

      if (currentCount < flashCount) {
        // 次の点滅をスケジュール
        flashTimeoutRef.current = window.setTimeout(() => {
          animateFlash(isOn ? currentCount : currentCount + 1, !isOn);
        }, flashInterval) as unknown as null;
      } else {
        // 点滅終了
        flashTimeoutRef.current = null;
      }
    };

    // 点滅開始
    animateFlash(0, true);
  }, [data.annotation, state.selection.selectedAnnotations, dispatch]);

  // Undo操作
  const undo = useCallback(() => {
    const prevAnnotations = historyUndo();
    if (prevAnnotations) {
      setData(prev => ({
        ...prev,
        annotation: prevAnnotations
      }));
      clearSelectedAnnotations();
    }
  }, [historyUndo, clearSelectedAnnotations]);

  // Redo操作
  const redo = useCallback(() => {
    const nextAnnotations = historyRedo();
    if (nextAnnotations) {
      setData(prev => ({
        ...prev,
        annotation: nextAnnotations
      }));
      clearSelectedAnnotations();
    }
  }, [historyRedo, clearSelectedAnnotations]);

  // データ保存
  const saveData = useCallback(() => {
    const outputData = JSON.stringify(data, null, 2);
    const blob = new Blob([outputData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotation.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  // ドラッグ開始
  const startDrag = useCallback((x: number, y: number) => {
    dispatch({ type: 'START_DRAG', payload: { x, y } });
  }, []);

  // ドラッグ更新
  const updateDrag = useCallback((x: number, y: number) => {
    dispatch({ type: 'UPDATE_DRAG', payload: { x, y } });
  }, []);

  // ドラッグ終了
  const endDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);

  // コマンドキー状態設定
  const setCommandKeyPressed = useCallback((pressed: boolean) => {
    dispatch({ type: 'SET_COMMAND_KEY_PRESSED', payload: { pressed } });
  }, []);

  // ズームイン
  const zoomIn = useCallback(() => {
    dispatch({ type: 'ZOOM_IN' });
  }, []);

  // ズームアウト
  const zoomOut = useCallback(() => {
    dispatch({ type: 'ZOOM_OUT' });
  }, []);

  // ズームリセット
  const zoomReset = useCallback(() => {
    dispatch({ type: 'ZOOM_RESET' });
  }, []);

  // キャンバスサイズ更新
  const updateCanvasSize = useCallback((width: number, height: number) => {
    setCanvasWidth(width);
    setCanvasHeight(height);
  }, []);

  // キャンバススケールを直接更新
  const updateCanvasScale = useCallback((scale: number) => {
    dispatch({ type: 'UPDATE_CANVAS_SCALE', payload: { scale } });
  }, []);

  // 初期履歴を設定
  useEffect(() => {
    // historyManagerの初期化は自動で行われるので不要
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current !== null) {
        clearTimeout(flashTimeoutRef.current as unknown as number);
      }
    };
  }, []);

  // コンテキスト値
  const contextValue: AnnotationContextProps = {
    data,
    state,
    historyIndex,
    historyLength,
    setMode,
    setSelectedLabelId,
    startSelection,
    updateSelection,
    finishSelection,
    setHoveredAnnotationIndex,
    toggleAnnotationSelection,
    clearSelectedAnnotations,
    deleteSelectedAnnotations,
    renumberAnnotation,
    completeRenumbering,
    flashUnselectedRectangles,
    undo,
    redo,
    saveData,
    startDrag,
    updateDrag,
    endDrag,
    setCommandKeyPressed,
    zoomIn,
    zoomOut,
    zoomReset,
    updateCanvasSize,
    updateCanvasScale
  };

  return (
    <AnnotationContext.Provider value={contextValue}>
      {children}
    </AnnotationContext.Provider>
  );
};

// フック
export const useAnnotation = (): AnnotationContextProps => {
  const context = useContext(AnnotationContext);
  if (context === undefined) {
    throw new Error('useAnnotation must be used within an AnnotationProvider');
  }
  return context;
};