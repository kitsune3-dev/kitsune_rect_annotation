/**
 * テキスト描画に関するユーティリティ関数
 */

/**
 * 縁取り付きテキストを描画する
 * @param ctx キャンバスコンテキスト
 * @param text 描画するテキスト
 * @param x X座標
 * @param y Y座標
 * @param fillStyle 文字の塗りつぶし色
 * @param strokeStyle 縁取りの色
 * @param strokeWidth 縁取りの太さ
 * @param font フォント設定（オプション）
 * @param textAlign テキスト揃え位置（オプション）
 * @param textBaseline テキストベースライン（オプション）
 */
export const drawTextWithStroke = (
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    fillStyle: string = "white", 
    strokeStyle: string = "black",
    strokeWidth: number = 3,
    font?: string,
    textAlign?: CanvasTextAlign,
    textBaseline?: CanvasTextBaseline
  ) => {
    // 現在の設定を保存
    ctx.save();
    
    // フォント設定
    if (font) ctx.font = font;
    
    // テキスト配置設定
    if (textAlign) ctx.textAlign = textAlign;
    if (textBaseline) ctx.textBaseline = textBaseline;
    
    // テキストの縁取り
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.lineJoin = 'round'; // 角を丸くする
    ctx.miterLimit = 2;
    ctx.strokeText(text, x, y);
    
    // テキスト本体
    ctx.fillStyle = fillStyle;
    ctx.fillText(text, x, y);
    
    // 設定を元に戻す
    ctx.restore();
  };
  
  /**
   * 背景付きテキストを描画する
   * @param ctx キャンバスコンテキスト
   * @param text 描画するテキスト
   * @param x X座標
   * @param y Y座標
   * @param textOptions テキスト描画オプション
   * @param bgOptions 背景描画オプション
   */
  export const drawTextWithBackground = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    textOptions: {
      fillStyle?: string,
      strokeStyle?: string,
      strokeWidth?: number,
      font?: string,
      textAlign?: CanvasTextAlign,
      textBaseline?: CanvasTextBaseline,
      padding?: { x: number, y: number }
    } = {},
    bgOptions: {
      fillStyle?: string,
      strokeStyle?: string,
      lineWidth?: number,
      radius?: number
    } = {}
  ) => {
    // デフォルト設定
    const textSettings = {
      fillStyle: "white",
      strokeStyle: "black",
      strokeWidth: 2,
      font: "12px Arial",
      textAlign: "left" as CanvasTextAlign,
      textBaseline: "top" as CanvasTextBaseline,
      padding: { x: 4, y: 2 }
    };
    
    const bgSettings = {
      fillStyle: "rgba(0, 0, 0, 0.7)",
      strokeStyle: undefined,
      lineWidth: 0,
      radius: 0
    };
    
    // ユーザー設定で上書き
    Object.assign(textSettings, textOptions);
    Object.assign(bgSettings, bgOptions);
    
    // 現在の設定を保存
    ctx.save();
    
    // フォント設定
    ctx.font = textSettings.font;
    ctx.textAlign = textSettings.textAlign;
    ctx.textBaseline = textSettings.textBaseline;
    
    // テキストの幅を測定
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    
    // テキスト位置の調整（テキスト配置に基づく）
    let rectX = x;
    if (textSettings.textAlign === 'center') {
      rectX = x - textWidth / 2;
    } else if (textSettings.textAlign === 'right') {
      rectX = x - textWidth;
    }
    
    let rectY = y;
    if (textSettings.textBaseline === 'middle') {
      rectY = y - textHeight / 2;
    } else if (textSettings.textBaseline === 'bottom' || textSettings.textBaseline === 'alphabetic') {
      rectY = y - textHeight;
    }
    
    // 背景描画
    const bgX = rectX - textSettings.padding.x;
    const bgY = rectY - textSettings.padding.y;
    const bgWidth = textWidth + (textSettings.padding.x * 2);
    const bgHeight = textHeight + (textSettings.padding.y * 2);
    
    ctx.fillStyle = bgSettings.fillStyle;
    
    if (bgSettings.radius > 0) {
      // 角丸四角形
      const radius = Math.min(bgSettings.radius, bgWidth / 2, bgHeight / 2);
      
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
      
      if (bgSettings.strokeStyle) {
        ctx.strokeStyle = bgSettings.strokeStyle;
        ctx.lineWidth = bgSettings.lineWidth;
        ctx.stroke();
      }
    } else {
      // 通常の四角形
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      
      if (bgSettings.strokeStyle) {
        ctx.strokeStyle = bgSettings.strokeStyle;
        ctx.lineWidth = bgSettings.lineWidth;
        ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
      }
    }
    
    // テキスト描画（縁取り付き）
    drawTextWithStroke(
      ctx,
      text,
      x,
      y,
      textSettings.fillStyle,
      textSettings.strokeStyle,
      textSettings.strokeWidth
    );
    
    // 設定を元に戻す
    ctx.restore();
  };