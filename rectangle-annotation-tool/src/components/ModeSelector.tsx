import React from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';
import classNames from 'classnames';
import { Mode } from '../types/types';

const ModeSelector: React.FC = () => {
  const { state, setMode } = useAnnotation();
  
  const modes: { id: Mode, label: string, description: string }[] = [
    { 
      id: 'add', 
      label: '矩形追加', 
      description: '画像上で矩形を追加します。種別を選択して範囲をクリックまたはドラッグします。'
    },
    { 
      id: 'delete', 
      label: '矩形削除', 
      description: '削除したい矩形をクリックして選択し「削除」ボタンで削除します。'
    },
    { 
      id: 'renumber', 
      label: '矩形番号振り直し', 
      description: '順番に矩形をクリックして番号を振り直します。すべての矩形を選択してOKを押してください。'
    }
  ];

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">モード選択</h3>
      <div className="space-y-2">
        {modes.map((mode) => (
          <div 
            key={mode.id}
            className={classNames(
              'border rounded p-2 cursor-pointer transition-colors',
              {
                'bg-blue-50 border-blue-500': state.mode.mode === mode.id,
                'bg-white border-gray-300 hover:bg-gray-50': state.mode.mode !== mode.id
              }
            )}
            onClick={() => setMode(mode.id)}
          >
            <div className="font-semibold">{mode.label}</div>
            <div className="text-xs text-gray-600 mt-1">{mode.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;