import React from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';
import classNames from 'classnames';

const LabelSelector: React.FC = () => {
  const { data, state, setSelectedLabelId } = useAnnotation();
  
  // ラベルIDとテキストの配列を作成
  const labelEntries = Object.entries(data.labels).map(([id, label]) => ({
    id: parseInt(id),
    label
  }));

  // ラベルが選択できるかどうか (選択中でない場合のみ)
  const canSelectLabel = !state.selecting;

  return (
    <div className={classNames('mt-4', { 'opacity-50': !canSelectLabel })}>
      <h3 className="text-lg font-semibold mb-2">矩形種別選択</h3>
      <div className="flex flex-col">
        {labelEntries.map((labelInfo) => (
          <button
            key={labelInfo.id}
            className={classNames('label-btn', { 'selected': state.selectedLabelId === labelInfo.id })}
            onClick={() => canSelectLabel && setSelectedLabelId(labelInfo.id)}
            disabled={!canSelectLabel}
          >
            {labelInfo.id}. {labelInfo.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LabelSelector;