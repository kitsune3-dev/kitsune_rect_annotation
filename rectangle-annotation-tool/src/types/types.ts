// モード定義
export type Mode = 'add' | 'delete' | 'renumber';

// ラベル定義
export interface Labels {
  [key: string]: string;
}

// 矩形アノテーション定義
export interface Annotation {
  id: number;
  label_id: number;
  polygon: number[]; // [x1, y1, x2, y2, x3, y3, x4, y4]
}

// アノテーションデータ定義
export interface AnnotationData {
  image: string;
  labels: Labels;
  annotation: Annotation[];
}

// アプリケーション状態定義
export interface AppState {
  mode: Mode;
  selecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  selectedLabelId: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  commandKeyPressed: boolean;
  hoveredAnnotationIndex: number;
  selectedAnnotations: number[];
  lastAssignedId: number;
  flashingIndices: number[]; // 追加: 点滅表示する矩形のインデックス配列
}

// 履歴管理用
export interface HistoryState {
  annotations: Annotation[];
}

// 色マッピング用
export interface ColorMap {
  [key: number]: string;
}