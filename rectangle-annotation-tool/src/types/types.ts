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