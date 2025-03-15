// 既存のimport文が必要であれば追加する
// import { CanvasState as ExistingCanvasState } from '...';

// アノテーション状態の型定義
export interface AnnotationState {
    mode: 'add' | 'delete' | 'renumber';
    selecting: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    selectedLabelId: number;
    selectedAnnotations: number[];
    hoveredAnnotationIndex: number;
    flashingIndices?: number[];
    isDragging: boolean;
    dragStartX?: number;
    dragStartY?: number;
    offsetX: number;
    offsetY: number;
    scale: number;
    commandKeyPressed: boolean;
}

export interface AnnotationData {
    labels: { [key: string]: string };
    annotation: Array<{
        id: number;
        label_id: number;
        polygon: number[];
    }>;
}

// 既存のAppStateとの互換性を保持するためのヘルパー型
export type AppStateWithAnnotation = any; // 実際のAppState型に合わせて調整