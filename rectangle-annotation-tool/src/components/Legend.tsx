import React from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';

const Legend: React.FC = () => {
  const { data } = useAnnotation();
  
  // 色のマッピング
  const getColorStyle = (labelId: number) => {
    const colorMap: Record<number, string> = {
      1: "rgba(255, 0, 0, 0.3)",
      2: "rgba(0, 255, 0, 0.3)",
      3: "rgba(0, 0, 255, 0.3)",
      4: "rgba(255, 255, 0, 0.3)",
      5: "rgba(255, 0, 255, 0.3)",
      6: "rgba(0, 255, 255, 0.3)",
      7: "rgba(128, 0, 128, 0.3)",
      8: "rgba(128, 128, 0, 0.3)",
      9: "rgba(0, 128, 128, 0.3)"
    };
    
    return { backgroundColor: colorMap[labelId] };
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">凡例</h3>
      <div className="flex flex-col">
        {Object.entries(data.labels).map(([id, label]) => (
          <div key={id} className="flex items-center my-1">
            <div 
              className="w-4 h-4 mr-2" 
              style={getColorStyle(parseInt(id))}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;