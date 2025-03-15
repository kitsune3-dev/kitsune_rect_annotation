/**
 * 画像ファイル読み込みなどのユーティリティ関数
 */

// 画像のロード処理
export const loadImage = (
    url: string,
    onSuccess: (image: HTMLImageElement) => void,
    onError: (error: unknown) => void
  ): void => {
    const img = new Image();
    
    img.onload = () => {
      console.log('Image loaded successfully in fileUtils', {
        src: img.src,
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      });
      onSuccess(img);
    };
    
    img.onerror = (error) => {
      console.error('Error loading image in fileUtils:', error);
      onError(error);
    };
    
    // Chrome のキャッシュ問題を回避するためにタイムスタンプを追加
    const cacheBuster = `?t=${new Date().getTime()}`;
    img.src = url + cacheBuster;
    
    // 一部のブラウザではcorsを明示的に設定
    img.crossOrigin = 'anonymous';
  };
  
  // JSON形式でのデータ保存
  export const saveAsJson = (data: any, filename: string): void => {
    const outputData = JSON.stringify(data, null, 2);
    const blob = new Blob([outputData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };