/**
 * 履歴管理（Undo/Redo）関連のユーティリティ
 */
import { Annotation, HistoryState } from '../types/types';

// 履歴状態を作成
export const createHistoryState = (annotations: Annotation[]): HistoryState => {
  // ディープコピーして履歴状態を作成
  return {
    annotations: JSON.parse(JSON.stringify(annotations))
  };
};

// 履歴に状態を追加
export const addHistoryState = (
  history: HistoryState[],
  historyIndex: number,
  annotations: Annotation[]
): { 
  newHistory: HistoryState[], 
  newIndex: number 
} => {
  // 新しい履歴状態を作成
  const newState = createHistoryState(annotations);
  
  // 現在のインデックスより後のものを削除
  const slicedHistory = history.slice(0, historyIndex + 1);
  
  // 新しい履歴を追加
  const newHistory = [...slicedHistory, newState];
  const newIndex = newHistory.length - 1;
  
  return { newHistory, newIndex };
};

// undo操作
export const undo = (
  history: HistoryState[],
  historyIndex: number
): {
  canUndo: boolean,
  newIndex: number,
  annotations: Annotation[] | null
} => {
  if (historyIndex <= 0) {
    return { canUndo: false, newIndex: historyIndex, annotations: null };
  }
  
  const newIndex = historyIndex - 1;
  const annotations = JSON.parse(
    JSON.stringify(history[newIndex].annotations)
  );
  
  return { canUndo: true, newIndex, annotations };
};

// redo操作
export const redo = (
  history: HistoryState[],
  historyIndex: number
): {
  canRedo: boolean,
  newIndex: number,
  annotations: Annotation[] | null
} => {
  if (historyIndex >= history.length - 1) {
    return { canRedo: false, newIndex: historyIndex, annotations: null };
  }
  
  const newIndex = historyIndex + 1;
  const annotations = JSON.parse(
    JSON.stringify(history[newIndex].annotations)
  );
  
  return { canRedo: true, newIndex, annotations };
};

// 初期履歴状態の作成
export const initHistory = (): { 
  history: HistoryState[], 
  historyIndex: number 
} => {
  const initialHistory = [createHistoryState([])];
  return { history: initialHistory, historyIndex: 0 };
};