/**
 * キャンバス関連のヘルパー関数
 */

// キャンバス要素が正しく表示されているか確認し修正する
export const ensureCanvasVisibility = (canvasElement: HTMLCanvasElement | null): boolean => {
    if (!canvasElement) return false;
    
    // キャンバスのスタイルを確認
    const computedStyle = window.getComputedStyle(canvasElement);
    console.log('Canvas computed style:', {
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      zIndex: computedStyle.zIndex,
      position: computedStyle.position,
      transform: computedStyle.transform,
      overflow: computedStyle.overflow
    });
    
    // 問題のある状態を修正
    if (computedStyle.display === 'none') {
      canvasElement.style.display = 'block';
    }
    
    if (computedStyle.visibility === 'hidden') {
      canvasElement.style.visibility = 'visible';
    }
    
    if (computedStyle.opacity === '0') {
      canvasElement.style.opacity = '1';
    }
    
    // 親要素のoverflow確認と修正
    if (canvasElement.parentElement) {
      const parentStyle = window.getComputedStyle(canvasElement.parentElement);
      if (parentStyle.overflow === 'hidden') {
        canvasElement.parentElement.style.overflow = 'visible';
        console.log('Fixed parent overflow from hidden to visible');
      }
    }
    
    // z-index 確認
    if (parseInt(computedStyle.zIndex) < 0) {
      canvasElement.style.zIndex = '1';
    }
    
    // キャンバスが見える範囲に入っているかチェック
    const rect = canvasElement.getBoundingClientRect();
    const isInViewport = (
      rect.top <= window.innerHeight &&
      rect.bottom >= 0 &&
      rect.left <= window.innerWidth &&
      rect.right >= 0
    );
    
    console.log('Canvas visibility check:', {
      isInViewport,
      rect,
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    });
    
    return isInViewport;
  };
  
  // キャンバスに単純な描画を行い、描画が機能しているか確認
  export const testCanvasDrawing = (canvasElement: HTMLCanvasElement | null): boolean => {
    if (!canvasElement) return false;
    
    try {
      const ctx = canvasElement.getContext('2d');
      if (!ctx) return false;
      
      // 現在のキャンバスデータを保存
      const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      
      // テスト描画
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(10, 10, 20, 20);
      
      // 描画が成功したか確認
      const testData = ctx.getImageData(15, 15, 1, 1);
      const hasColor = testData.data[0] > 0; // 赤色成分があるか
      
      // 元の状態に戻す
      ctx.putImageData(imageData, 0, 0);
      
      return hasColor;
    } catch (e) {
      console.error('Canvas drawing test failed:', e);
      return false;
    }
  };
  
  // キャンバスと親コンテナのサイズを適切に設定
  export const setupCanvasSize = (
    canvasElement: HTMLCanvasElement | null,
    containerElement: HTMLElement | null,
    width: number,
    height: number
  ): void => {
    if (!canvasElement) return;
    
    // キャンバスの論理的サイズを設定
    canvasElement.width = width;
    canvasElement.height = height;
    
    // コンテナが存在する場合はスタイルも設定
    if (containerElement) {
      // 最小サイズ設定
      containerElement.style.minWidth = `${width / 2}px`;
      containerElement.style.minHeight = `${height / 2}px`;
    }
    
    console.log('Canvas size setup complete:', {
      canvas: { width, height },
      container: containerElement ? {
        clientWidth: containerElement.clientWidth,
        clientHeight: containerElement.clientHeight
      } : 'No container'
    });
  };