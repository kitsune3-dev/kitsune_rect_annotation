import React, { useEffect } from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';

/**
 * ホイールイベントのサポートを強化するためのヘルパーコンポーネント
 * 一部の環境ではイベント伝播が正しく動作しない場合があるため
 */
const WheelEventSupport: React.FC = () => {
  const { zoomIn, zoomOut } = useAnnotation();
  
  useEffect(() => {
    // グローバルホイールイベントハンドラーを設定
    const handleGlobalWheel = (e: WheelEvent) => {
      // canvas-container クラスがある要素内でのみ動作させる
      const target = e.target as HTMLElement;
      const container = target.closest('.canvas-container') || 
                       target.closest('[data-wheel-zoom-container="true"]');
      
      if (container) {
        // 標準のスクロール動作を防止
        e.preventDefault();
        
        // ズーム処理
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    };
    
    // パッシブでないイベントリスナーを追加
    document.addEventListener('wheel', handleGlobalWheel, { passive: false });
    
    // クリーンアップ
    return () => {
      document.removeEventListener('wheel', handleGlobalWheel);
    };
  }, [zoomIn, zoomOut]);
  
  // このコンポーネントは表示要素を持たない
  return null;
};

export default WheelEventSupport;