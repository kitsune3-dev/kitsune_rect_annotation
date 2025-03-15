import React from 'react';
import { AnnotationProvider } from './contexts/AnnotationContext';
import { useCanvas } from './hooks/canvas/useCanvas';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Sidebar from './components/Sidebar';
import AnnotationCanvas from './components/AnnotationCanvas';
import ZoomControls from './components/ZoomControls';

const AppContent: React.FC = () => {
  const { statusMessage } = useCanvas();
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen">
      <Sidebar statusMessage={statusMessage} />
      <div className="relative flex-1" data-wheel-zoom-container="true">
        <AnnotationCanvas />
        <ZoomControls />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AnnotationProvider>
      <AppContent />
    </AnnotationProvider>
  );
};

export default App;