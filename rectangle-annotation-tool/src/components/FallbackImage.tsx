import React, { useState, useEffect, useRef } from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';

interface FallbackImageProps {
  imageUrl: string;
}

// キャンバス描画に問題がある場合のフォールバック画像
const FallbackImage: React.FC<FallbackImageProps> = ({ imageUrl }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { state } = useAnnotation();

  // キャンバス表示タイムアウト後にフォールバック表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000); // 2秒後に表示

    return () => clearTimeout(timer);
  }, []);

  // 画像読み込み完了時の処理
  const handleImageLoad = () => {
    console.log('Fallback image loaded');
    setImageLoaded(true);
  };

  // 画像読み込みエラー時の処理
  const handleImageError = () => {
    console.error('Fallback image failed to load');
    setImageLoaded(false);
  };

  // 画像がドラッグされないようにする
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  if (!isVisible) return null;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10"
      style={{ 
        transform: `scale(${state.scale}) translate(${state.offsetX / state.scale}px, ${state.offsetY / state.scale}px)`,
        transformOrigin: '0 0'
      }}
    >
      <div className="relative">
        <img
          ref={imgRef}
          src={`${imageUrl}?t=${Date.now()}`} // キャッシュ回避
          alt="アノテーション対象画像"
          className="max-w-full max-h-full object-contain"
          style={{ opacity: 0.95 }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onDragStart={handleDragStart}
        />
        <div className="absolute inset-0 pointer-events-none">
          {/* アノテーションをオーバーレイできる場所 */}
        </div>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-600">画像読み込み中...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FallbackImage;