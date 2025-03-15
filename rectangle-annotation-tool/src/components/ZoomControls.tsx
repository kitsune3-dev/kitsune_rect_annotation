import React from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';

const ZoomControls: React.FC = () => {
  const { zoomIn, zoomOut, zoomReset } = useAnnotation();

  return (
    <div className="absolute bottom-5 right-5 bg-white rounded shadow-md p-1 flex">
      <button 
        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded mx-0.5 hover:bg-gray-100"
        onClick={zoomIn}
        aria-label="拡大"
      >
        +
      </button>
      <button 
        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded mx-0.5 hover:bg-gray-100"
        onClick={zoomReset}
        aria-label="リセット"
      >
        ⟳
      </button>
      <button 
        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded mx-0.5 hover:bg-gray-100"
        onClick={zoomOut}
        aria-label="縮小"
      >
        -
      </button>
    </div>
  );
};

export default ZoomControls;