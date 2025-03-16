import React from 'react';
import { AnnotationProvider } from './contexts/AnnotationContext';
import { useCanvas } from './hooks/canvas/useCanvas';
import ResponsiveSidebar from './components/ResponsiveSidebar';
import AnnotationCanvas from './components/AnnotationCanvas';
import ZoomControls from './components/ZoomControls';

const AppContent: React.FC = () => {
  const { statusMessage } = useCanvas();

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ResponsiveSidebar statusMessage={statusMessage} />
      <div className="relative flex-1 h-screen md:h-auto" data-wheel-zoom-container="true">
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