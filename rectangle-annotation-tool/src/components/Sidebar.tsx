import React from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';
import ModeSelector from './ModeSelector';
import ModeControls from './ModeControls';
import LabelSelector from './LabelSelector';
import Legend from './Legend';

interface SidebarProps {
  statusMessage: string;
}

const Sidebar: React.FC<SidebarProps> = ({ statusMessage }) => {
  const { undo, redo, saveData, historyIndex, history, state } = useAnnotation();

  return (
    <div className="w-64 bg-gray-50 p-4 shadow-md flex flex-col h-screen overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">矩形アノテーションツール</h2>
      
      <ModeSelector />
      
      <div className="separator" />
      
      <ModeControls />
      
      <div className="action-buttons flex justify-between mb-4">
        <button 
          className="btn btn-primary" 
          onClick={undo}
          disabled={historyIndex <= 0}
        >
          Undo
        </button>
        <button 
          className="btn btn-primary" 
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        >
          Redo
        </button>
        <button 
          className="btn btn-primary" 
          onClick={saveData}
        >
          保存
        </button>
      </div>
      
      <div className="separator" />
      
      {state.mode === 'add' && <LabelSelector />}
      
      <Legend />
      
      <div className="mt-auto pt-4 text-sm text-gray-600">
        {statusMessage}
      </div>
    </div>
  );
};

export default Sidebar;