import React from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';

const ModeControls: React.FC = () => {
  const { 
    state, 
    data,
    setMode, 
    deleteSelectedAnnotations, 
    completeRenumbering, 
    flashUnselectedRectangles
  } = useAnnotation();

  // OKボタンのクリックハンドラ
  const handleOkClick = () => {
    if (state.selection.selectedAnnotations.length < data.annotation.length) {
      // 未選択の矩形がある場合は警告と強調表示
      alert(`すべての矩形が選択されていません。(${state.selection.selectedAnnotations.length}/${data.annotation.length}個選択済)`);
      // 未選択矩形の強調表示
      flashUnselectedRectangles();
    } else {
      // 全ての矩形が選択されていれば完了して追加モードに戻る
      completeRenumbering();
      setMode('add');
    }
  };

  // キャンセルボタンのクリックハンドラ
  const handleCancelClick = () => {
    // setMode('add')を呼び出すだけで、AnnotationContext内の
    // useEffect内でキャンセル処理が自動的に行われる
    setMode('add');
  };

  // 削除ボタンのクリックハンドラ
  const handleDeleteClick = () => {
    deleteSelectedAnnotations();
  };

  // 強調表示ボタンのクリックハンドラ
  const handleHighlightClick = () => {
    flashUnselectedRectangles();
  };

  if (state.mode.mode === 'add') {
    return null;
  }

  return (
    <div className="my-4">
      <div className="action-buttons flex flex-wrap gap-2">
        {state.mode.mode === 'renumber' && (
          <>
            <button className="btn btn-primary" onClick={handleOkClick}>
              OK
            </button>
            <button 
              className="btn btn-info" 
              onClick={handleHighlightClick}
              title="未選択の矩形を強調表示"
            >
              未選択矩形を強調表示 ({data.annotation.length - state.selection.selectedAnnotations.length}個)
            </button>
          </>
        )}
        
        {state.mode.mode === 'delete' && (
          <button 
            className="btn btn-danger" 
            onClick={handleDeleteClick}
            disabled={state.selection.selectedAnnotations.length === 0}
          >
            削除 ({state.selection.selectedAnnotations.length}個選択中)
          </button>
        )}
        
        <button className="btn btn-secondary" onClick={handleCancelClick}>
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default ModeControls;