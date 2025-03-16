import { useState, useCallback } from 'react';
import { AnnotationData } from '../../types/types';

// 新しい状態構造に対応した型定義
interface AppState {
  selection: {
    selecting: boolean;
    currentX: number;
    currentY: number;
    selectedLabelId: number;
    selectedAnnotations: number[];
  };
  mode: {
    mode: string;
  };
}

export const useCanvasStatus = (
  state: AppState,
  data: AnnotationData,
  isImageLoaded: boolean
) => {
  const [statusMessage, setStatusMessage] = useState('読み込み中...');

  // ステータスメッセージの更新 - 改善版
  const updateStatusMessage = useCallback(() => {
    let message = '';

    switch (state.mode.mode) {
      case 'add':
        if (state.selection.selecting) {
          message = `矩形選択中... (${Math.round(state.selection.currentX)},${Math.round(state.selection.currentY)})`;
        } else {
          message = `選択中: ${data.labels[state.selection.selectedLabelId.toString()]}`;
        }
        break;
      case 'delete':
        message = "削除モード: 削除する矩形をクリックしてください";
        if (state.selection.selectedAnnotations.length > 0) {
          message += ` (${state.selection.selectedAnnotations.length}個選択中)`;
        }
        break;
      case 'renumber':
        message = "番号振り直しモード: 矩形を順番にクリックしてください";
        if (state.selection.selectedAnnotations.length > 0) {
          message += ` (${state.selection.selectedAnnotations.length}/${data.annotation.length}個選択済)`;
        }
        break;
    }

    if (isImageLoaded) {
      setStatusMessage(message);
    } else {
      setStatusMessage('画像読み込み中...');
    }
  }, [
    state.mode.mode, 
    state.selection.selecting, 
    state.selection.currentX, 
    state.selection.currentY, 
    state.selection.selectedLabelId,
    state.selection.selectedAnnotations.length, 
    data.labels, 
    data.annotation.length, 
    isImageLoaded
  ]);

  return {
    statusMessage,
    setStatusMessage,
    updateStatusMessage
  };
};