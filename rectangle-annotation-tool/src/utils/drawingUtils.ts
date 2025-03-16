/**
 * テキスト描画に関するユーティリティ関数
 */

/**
 * テキストを描画するための統合関数
 * (縁取りとオプションの背景付き)
 * 
 * @param ctx キャンバスコンテキスト
 * @param text 描画するテキスト
 * @param x X座標
 * @param y Y座標
 * @param options テキストと背景の描画オプション
 */
export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    // テキスト関連の設定
    textFillStyle?: string,
    textStrokeStyle?: string,
    textStrokeWidth?: number,
    font?: string,
    textAlign?: CanvasTextAlign,
    textBaseline?: CanvasTextBaseline,
    
    // 背景関連の設定
    withBackground?: boolean,
    bgFillStyle?: string,
    bgStrokeStyle?: string,
    bgLineWidth?: number,
    bgRadius?: number,
    padding?: { x: number, y: number }
  } = {}
) => {
  // デフォルト設定
  const defaultOptions = {
    // テキスト関連のデフォルト
    textFillStyle: "white",
    textStrokeStyle: "black",
    textStrokeWidth: 2,
    font: "12px Arial",
    textAlign: "left" as CanvasTextAlign,
    textBaseline: "top" as CanvasTextBaseline,
    
    // 背景関連のデフォルト
    withBackground: false,
    bgFillStyle: "rgba(0, 0, 0, 0.7)",
    bgStrokeStyle: undefined,
    bgLineWidth: 0,
    bgRadius: 0,
    padding: { x: 4, y: 2 }
  };
  
  // デフォルト設定をユーザー指定の設定で上書き
  const settings = { ...defaultOptions, ...options };
  
  // 現在の設定を保存
  ctx.save();
  
  // フォント設定を適用
  ctx.font = settings.font;
  ctx.textAlign = settings.textAlign;
  ctx.textBaseline = settings.textBaseline;
  
  // 背景付きの場合
  if (settings.withBackground) {
    // テキストの幅を測定
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    
    // テキスト位置の調整（テキスト配置に基づく）
    let rectX = x;
    if (settings.textAlign === 'center') {
      rectX = x - textWidth / 2;
    } else if (settings.textAlign === 'right') {
      rectX = x - textWidth;
    }
    
    let rectY = y;
    if (settings.textBaseline === 'middle') {
      rectY = y - textHeight / 2;
    } else if (settings.textBaseline === 'bottom' || settings.textBaseline === 'alphabetic') {
      rectY = y - textHeight;
    }
    
    // 背景描画
    const bgX = rectX - settings.padding.x;
    const bgY = rectY - settings.padding.y;
    const bgWidth = textWidth + (settings.padding.x * 2);
    const bgHeight = textHeight + (settings.padding.y * 2);
    
    ctx.fillStyle = settings.bgFillStyle;
    
    if (settings.bgRadius > 0) {
      // 角丸四角形
      const radius = Math.min(settings.bgRadius, bgWidth / 2, bgHeight / 2);
      
      ctx.beginPath();
      ctx.moveTo(bgX + radius, bgY);
      ctx.lineTo(bgX + bgWidth - radius, bgY);
      ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
      ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
      ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
      ctx.lineTo(bgX + radius, bgY + bgHeight);
      ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
      ctx.lineTo(bgX, bgY + radius);
      ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
      ctx.closePath();
      ctx.fill();
      
      if (settings.bgStrokeStyle) {
        ctx.strokeStyle = settings.bgStrokeStyle;
        ctx.lineWidth = settings.bgLineWidth;
        ctx.stroke();
      }
    } else {
      // 通常の四角形
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      
      if (settings.bgStrokeStyle) {
        ctx.strokeStyle = settings.bgStrokeStyle;
        ctx.lineWidth = settings.bgLineWidth;
        ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
      }
    }
  }
  
  // テキストの縁取り
  if (settings.textStrokeStyle && settings.textStrokeWidth > 0) {
    ctx.lineWidth = settings.textStrokeWidth;
    ctx.strokeStyle = settings.textStrokeStyle;
    ctx.lineJoin = 'round'; // 角を丸くする
    ctx.miterLimit = 2;
    ctx.strokeText(text, x, y);
  }
  
  // テキスト本体
  ctx.fillStyle = settings.textFillStyle;
  ctx.fillText(text, x, y);
  
  // 設定を元に戻す
  ctx.restore();
};