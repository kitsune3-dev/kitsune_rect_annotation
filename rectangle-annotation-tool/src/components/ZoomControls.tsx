import React, { useState, useEffect } from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';

const ZoomControls: React.FC = () => {
  const { zoomIn, zoomOut, zoomReset, state } = useAnnotation();
  const [showTip, setShowTip] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // タッチデバイス判定
  useEffect(() => {
    const checkTouchDevice = () => {
      return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0));
    };
    
    setIsTouchDevice(checkTouchDevice());
  }, []);

  // 初回ロード時にタッチデバイスならヒントを表示
  useEffect(() => {
    if (isTouchDevice) {
      setShowTip(true);
      const timer = setTimeout(() => {
        setShowTip(false);
      }, 5000);  // 5秒後に非表示
      
      return () => clearTimeout(timer);
    }
  }, [isTouchDevice]);

  return (
    <>
      <div className="absolute bottom-5 right-5 bg-white rounded shadow-md p-1 flex zoom-controls">
        <button 
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded mx-0.5 hover:bg-gray-100 text-xl"
          onClick={zoomIn}
          aria-label="拡大"
        >
          +
        </button>
        <button 
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded mx-0.5 hover:bg-gray-100 text-xl"
          onClick={zoomReset}
          aria-label="リセット"
        >
          ⟳
        </button>
        <button 
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded mx-0.5 hover:bg-gray-100 text-xl"
          onClick={zoomOut}
          aria-label="縮小"
        >
          -
        </button>
      </div>
      
      {/* ズーム倍率表示 */}
      <div className="absolute bottom-5 left-5 bg-white bg-opacity-70 rounded px-2 py-1 text-sm">
        {Math.round(state.scale * 100)}%
      </div>

      {/* タッチ操作ヒント */}
      {showTip && (
        <div className="touch-instruction">
          <p>2本指でピンチするとズームできます</p>
          <p>1本指でドラッグすると移動できます</p>
        </div>
      )}
    </>
  );
};

export default ZoomControls;