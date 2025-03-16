import { useState, useCallback } from 'react';
import { AppState, AnnotationData } from '../../types/types';

export const useCanvasStatus = (
    state: AppState,
    data: AnnotationData,
    isImageLoaded: boolean
) => {
    const [statusMessage, setStatusMessage] = useState('読み込み中...');

    // ステータスメッセージの更新
    const updateStatusMessage = useCallback(() => {
        let message = '';

        switch (state.mode) {
            case 'add':
                if (state.selecting) {
                    message = `矩形選択中... (${Math.round(state.currentX)},${Math.round(state.currentY)})`;
                } else {
                    message = `選択中: ${data.labels[state.selectedLabelId.toString()]}`;
                }
                break;
            case 'delete':
                message = "削除モード: 削除する矩形をクリックしてください";
                if (state.selectedAnnotations.length > 0) {
                    message += ` (${state.selectedAnnotations.length}個選択中)`;
                }
                break;
            case 'renumber':
                message = "番号振り直しモード: 矩形を順番にクリックしてください";
                if (state.selectedAnnotations.length > 0) {
                    message += ` (${state.selectedAnnotations.length}/${data.annotation.length}個選択済)`;
                }
                break;
        }

        if (isImageLoaded) {
            setStatusMessage(message);
        } else {
            setStatusMessage('画像読み込み中...');
        }
    }, [
        state.mode, 
        state.selecting, 
        state.currentX, 
        state.currentY, 
        state.selectedLabelId,
        state.selectedAnnotations.length, 
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