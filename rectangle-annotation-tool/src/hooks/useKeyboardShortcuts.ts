import { useEffect } from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';

export const useKeyboardShortcuts = () => {
  const { undo, redo, saveData } = useAnnotation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Macのcommandキー (metaKey) または Windowsのctrlキー (ctrlKey)
      if (e.metaKey || e.ctrlKey) {
        // Undo (Cmd+Z / Ctrl+Z)
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        }
        
        // Redo (Cmd+Shift+Z / Ctrl+Shift+Z) または (Cmd+Y / Ctrl+Y)
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
        
        // 保存 (Cmd+S / Ctrl+S)
        if (e.key === 's') {
          e.preventDefault();
          saveData();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, saveData]);
};