import React, { useState } from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';
import ModeSelector from './ModeSelector';
import ModeControls from './ModeControls';
import LabelSelector from './LabelSelector';

interface SidebarProps {
  statusMessage: string;
}

const ResponsiveSidebar: React.FC<SidebarProps> = ({ statusMessage }) => {
  const { undo, redo, saveData, historyIndex, history, state } = useAnnotation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* モバイル用のトグルボタン */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-500 text-white p-2 rounded-full shadow-lg"
        aria-label={isOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
      >
        {isOpen ? "✕" : "≡"}
      </button>

      {/* サイドバーの背景オーバーレイ（モバイルでのみ表示） */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* サイドバー本体 */}
      <div 
        className={`
          fixed md:relative 
          w-64 h-screen 
          bg-gray-50 p-4 shadow-md 
          flex flex-col 
          overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          z-50 md:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <h2 className="text-xl font-bold mb-4">矩形アノテーションツール</h2>
        
        <ModeSelector />
        
        <div className="separator" />
        
        <ModeControls />
        
        <div className="action-buttons flex justify-between mb-4">
          <button 
            className="btn btn-primary text-lg p-3" 
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            Undo
          </button>
          <button 
            className="btn btn-primary text-lg p-3" 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            Redo
          </button>
          <button 
            className="btn btn-primary text-lg p-3" 
            onClick={saveData}
          >
            保存
          </button>
        </div>
        
        <div className="separator" />
        
        {/* 矩形種別選択は常に表示 */}
        <LabelSelector />
        
        <div className="mt-auto pt-4 text-sm text-gray-600">
          {statusMessage}
        </div>
      </div>
    </>
  );
};

export default ResponsiveSidebar;