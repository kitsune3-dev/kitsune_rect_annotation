import React from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';
import classNames from 'classnames';
import { Mode } from '../types/types';

const ModeSelector: React.FC = () => {
  const { state, setMode } = useAnnotation();
  
  const modes: { id: Mode, label: string }[] = [
    { id: 'add', label: '矩形追加' },
    { id: 'delete', label: '矩形削除' },
    { id: 'renumber', label: '矩形番号振り直し' }
  ];

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">モード選択</h3>
      <div className="flex flex-col">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className={classNames('mode-btn', { 'selected': state.mode === mode.id })}
            onClick={() => setMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;