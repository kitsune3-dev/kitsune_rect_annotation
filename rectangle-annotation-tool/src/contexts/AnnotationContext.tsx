import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { 
  AnnotationData, 
  AppState, 
  Annotation, 
  Mode, 
  HistoryState 
} from '../types/types';

interface AnnotationContextProps {
  // 状態
  data: AnnotationData;
  state: AppState;
  history: HistoryState[];
  historyIndex: number;
  
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

// 初期データ
const initialData: AnnotationData = {
  image: "test.png",
  labels: {
    "1": "章タイトル",
    "2": "節タイトル",
    "3": "概要",
    "4": "本文",
    "5": "補足",
    "6": "コラム",
    "7": "用語解説",
    "8": "図",
    "9": "表"
  },
  annotation: []
};

const initialState: AppState = {
    mode: 'add',
    selecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    selectedLabelId: 1,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    commandKeyPressed: false,
    hoveredAnnotationIndex: -1,
    selectedAnnotations: [],
    lastAssignedId: 0,
    flashingIndices: [] // 追加: 空の配列で初期化
  };
  

// コンテキスト作成
export const AnnotationContext = createContext<AnnotationContextProps | undefined>(undefined);

// コンテキストプロバイダ
export const AnnotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AnnotationData>(initialData);
  const [state, setState] = useState<AppState>(initialState);
  const [history, setHistory] = useState<HistoryState[]>([{ annotations: [] }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);
  const flashTimeoutRef = useRef<number | null>(null);

  // モード設定
  const setMode = (mode: Mode) => {
    setState(prev => ({
      ...prev,
      mode,
      selecting: false,
      hoveredAnnotationIndex: -1,
      selectedAnnotations: [],
      lastAssignedId: 0
    }));
  };

  // 選択ラベルID設定
  const setSelectedLabelId = (id: number) => {
    if (!state.selecting) {
      setState(prev => ({ ...prev, selectedLabelId: id }));
    }
  };

  // 選択開始
  const startSelection = (x: number, y: number) => {
    setState(prev => ({
      ...prev,
      selecting: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    }));
  };

  // 選択更新
  const updateSelection = (x: number, y: number) => {
    setState(prev => ({
      ...prev,
      currentX: x,
      currentY: y
    }));
  };

  // 選択終了
  const finishSelection = () => {
    const { startX, startY, currentX, currentY, selectedLabelId } = state;
    
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
    
    setState(prev => ({
      ...prev,
      selecting: false
    }));
  };

  // ホバー状態更新
  const setHoveredAnnotationIndex = (index: number) => {
    setState(prev => ({
      ...prev,
      hoveredAnnotationIndex: index
    }));
  };

// アノテーション選択トグル
const toggleAnnotationSelection = useCallback((index: number) => {
    
    setState(prev => {
      const selectedIndex = prev.selectedAnnotations.indexOf(index);
      let newSelectedAnnotations;
      
      if (selectedIndex === -1) {
        // 未選択の場合は追加
        newSelectedAnnotations = [...prev.selectedAnnotations, index];
      } else {
        // 既に選択されている場合は削除
        newSelectedAnnotations = [...prev.selectedAnnotations];
        newSelectedAnnotations.splice(selectedIndex, 1);
      }
      
      return {
        ...prev,
        selectedAnnotations: newSelectedAnnotations
      };
    });
    
    // 選択変更後に再描画を強制する
    requestAnimationFrame(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const event = new Event('forceRedraw');
        canvas.dispatchEvent(event);
      }
    });
  }, []);

  // 選択クリア
  const clearSelectedAnnotations = () => {
    setState(prev => ({
      ...prev,
      selectedAnnotations: []
    }));
  };

  // 選択削除
  const deleteSelectedAnnotations = () => {
    if (state.selectedAnnotations.length > 0) {
      const newAnnotations = data.annotation.filter((_, index) => 
        !state.selectedAnnotations.includes(index)
      );
      
      // 履歴に追加
      addHistoryState(newAnnotations);
      
      setData(prev => ({
        ...prev,
        annotation: newAnnotations
      }));
      
      clearSelectedAnnotations();
    }
  };

  // 番号振り直し
  const renumberAnnotation = (index: number) => {
    if (state.mode === 'renumber' && !state.selectedAnnotations.includes(index)) {
      const newLastAssignedId = state.lastAssignedId + 1;
      
      setState(prev => ({
        ...prev,
        lastAssignedId: newLastAssignedId,
        selectedAnnotations: [...prev.selectedAnnotations, index]
      }));
      
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
  };

  // 番号振り直し完了確認
  const completeRenumbering = () => {
    if (state.selectedAnnotations.length < data.annotation.length) {
      return false;
    }
    
    // 履歴に追加
    addHistoryState(data.annotation);
    return true;
  };

// 未選択矩形の強調表示
const flashUnselectedRectangles = useCallback(() => {
    // すでに実行中のタイムアウトがあればクリア
    if (flashTimeoutRef.current !== null) {
      clearTimeout(flashTimeoutRef.current as unknown as number);
      flashTimeoutRef.current = null;
    }
    
    // 未選択のインデックスを取得
    const unselectedIndices: number[] = [];
    for (let i = 0; i < data.annotation.length; i++) {
      if (!state.selectedAnnotations.includes(i)) {
        unselectedIndices.push(i);
      }
    }
    
    if (unselectedIndices.length === 0) {
      return;
    }
    
    
    // 点滅回数カウンタ
    let count = 0;
    
    const flash = () => {
      count++;
      const isHighlight = count % 2 === 1;
      
      setState(prev => ({
        ...prev,
        flashingIndices: isHighlight ? unselectedIndices : []
      }));
      
      
      if (count < 6) { // 3回点滅（ON/OFF x 3）
        flashTimeoutRef.current = window.setTimeout(flash, 200) as unknown as null;
      } else {
        // 点滅終了後、状態をリセット
        setState(prev => ({
          ...prev,
          flashingIndices: []
        }));
        flashTimeoutRef.current = null;
      }
    };
    
    // 最初の点滅をすぐに開始
    flash();
  }, [data.annotation, state.selectedAnnotations]);

  // 履歴追加
  const addHistoryState = (annotations: Annotation[]) => {
    const newState: HistoryState = {
      annotations: JSON.parse(JSON.stringify(annotations))
    };
    
    setHistory(prev => {
      // 現在のインデックスより後のものを削除
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newState];
    });
    
    setHistoryIndex(prev => prev + 1);
  };

  // Undo操作
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      const restoredAnnotations = history[newIndex].annotations;
      setData(prev => ({
        ...prev,
        annotation: JSON.parse(JSON.stringify(restoredAnnotations))
      }));
    }
  };

  // Redo操作
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      const restoredAnnotations = history[newIndex].annotations;
      setData(prev => ({
        ...prev,
        annotation: JSON.parse(JSON.stringify(restoredAnnotations))
      }));
    }
  };

  // データ保存
  const saveData = () => {
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
  };

  // ドラッグ開始
  const startDrag = (x: number, y: number) => {
    setState(prev => ({
      ...prev,
      isDragging: true,
      lastX: x,
      lastY: y
    }));
  };

  // ドラッグ更新
  const updateDrag = (x: number, y: number) => {
    setState(prev => {
      const dx = x - prev.lastX;
      const dy = y - prev.lastY;
      
      return {
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
        lastX: x,
        lastY: y
      };
    });
  };

  // ドラッグ終了
  const endDrag = () => {
    setState(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  // コマンドキー状態設定
  const setCommandKeyPressed = (pressed: boolean) => {
    setState(prev => ({
      ...prev,
      commandKeyPressed: pressed
    }));
  };

// ズームイン
const zoomIn = useCallback(() => {
    setState(prev => {
      const newScale = prev.scale * 1.1;
      return {
        ...prev,
        scale: newScale
      };
    });
  }, []);
  
  // ズームアウト
  const zoomOut = useCallback(() => {
    setState(prev => {
      const newScale = Math.max(0.1, prev.scale / 1.1); // 最小スケール制限
      return {
        ...prev,
        scale: newScale
      };
    });
  }, []);
  
  // ズームリセット
  const zoomReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      scale: 1,
      offsetX: 0,
      offsetY: 0
    }));
  }, []);

  // キャンバスサイズ更新
  const updateCanvasSize = (width: number, height: number) => {
    setCanvasWidth(width);
    setCanvasHeight(height);
  };

  // 初期履歴を設定
  useEffect(() => {
    setHistory([{ annotations: [] }]);
    setHistoryIndex(0);
  }, []);

  // キャンバススケールを直接更新
  const updateCanvasScale = useCallback((scale: number) => {
    setState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, scale)) // 0.1から5.0の間に制限
    }));
  }, []);
  

  // コンテキスト値
  const contextValue: AnnotationContextProps = {
    data,
    state,
    history,
    historyIndex,
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