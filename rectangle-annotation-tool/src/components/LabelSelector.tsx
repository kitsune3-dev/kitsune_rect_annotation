import React from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';
import classNames from 'classnames';
import { uiColorMap } from '../utils/colorConstants';

const LabelSelector: React.FC = () => {
  const { data, state, setSelectedLabelId } = useAnnotation();
  
  // ラベルIDとテキストの配列を作成
  const labelEntries = Object.entries(data.labels).map(([id, label]) => ({
    id: parseInt(id),
    label
  }));

  // ラベルが選択できるかどうか (モードが追加の場合のみ)
  const canSelectLabel = state.mode.mode === 'add' && !state.selection.selecting;

  return (
    <div className={classNames({ 'opacity-50': !canSelectLabel })}>
      <h3 className="text-lg font-semibold mb-2">矩形種別</h3>
      <div className="flex flex-col space-y-1">
        {labelEntries.map((labelInfo) => {
          const color = uiColorMap[labelInfo.id];
          const isSelected = state.selection.selectedLabelId === labelInfo.id;
          
          return (
            <button
              key={labelInfo.id}
              className={classNames(
                'flex items-center text-left p-2 border rounded transition-all',
                {
                  'cursor-not-allowed': !canSelectLabel,
                  'cursor-pointer hover:bg-opacity-70': canSelectLabel
                }
              )}
              style={{
                backgroundColor: isSelected 
                  ? color.bg.replace('0.2', '0.5') // 選択時は濃く
                  : color.bg,
                borderColor: isSelected
                  ? color.border
                  : '#ddd',
                borderWidth: isSelected ? '2px' : '1px',
                color: isSelected ? color.text : 'inherit'
              }}
              onClick={() => canSelectLabel && setSelectedLabelId(labelInfo.id)}
              disabled={!canSelectLabel}
            >
              <div 
                className="w-5 h-5 mr-2 rounded-sm border flex-shrink-0"
                style={{ 
                  backgroundColor: color.bg.replace('0.2', '0.6'),
                  borderColor: color.border
                }}
              />
              <span className="font-medium">
                {labelInfo.id}. {labelInfo.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LabelSelector;