import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // 画像ファイルかどうか確認
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    // FileReader でファイルを読み込む
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        console.log('Uploaded image loaded', {
          width: img.width,
          height: img.height,
          src: img.src
        });
        onImageLoad(img);
      };
      
      img.onerror = () => {
        console.error('Failed to load uploaded image');
        alert('画像の読み込みに失敗しました');
      };
      
      if (event.target && typeof event.target.result === 'string') {
        img.src = event.target.result;
      }
    };
    
    reader.onerror = () => {
      console.error('File reading failed');
      alert('ファイルの読み込みに失敗しました');
    };
    
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        onClick={triggerFileInput}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
      >
        画像をアップロード
      </button>
    </div>
  );
};

export default ImageUploader;