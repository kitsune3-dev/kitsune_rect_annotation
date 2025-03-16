import { useRef, useEffect, useState, useCallback } from 'react';
import { useAnnotation } from '../../contexts/AnnotationContext';
import { useCanvasDrawing } from './useCanvasDrawing';
import { useCanvasCoordinates } from './useCanvasCoordinates';
import { useCanvasEvents } from './useCanvasEvents';
import { useCanvasStatus } from './useCanvasStatus';
import { useCanvasTouch } from './useCanvasTouch';

// マージンの大きさ（ピクセル）
export const CANVAS_MARGIN = 50;

export const useCanvas = () => {
    // 複数のキャンバス参照を設定
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const patternCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState<number>(0);
    const [canvasHeight, setCanvasHeight] = useState<number>(0);

    // コンテキスト情報を取得
    const {
        data,
        state,
        startSelection,
        updateSelection,
        finishSelection,
        setHoveredAnnotationIndex,
        toggleAnnotationSelection,
        renumberAnnotation,
        startDrag,
        updateDrag,
        endDrag,
        setCommandKeyPressed,
        updateCanvasSize,
        zoomIn,
        zoomOut,
        updateCanvasScale
    } = useAnnotation();

    // 座標変換関連のフック - 修正した座標変換
    const {
        getCanvasCoordinates,
        findRectangleAtPosition
    } = useCanvasCoordinates(canvasRef, state, CANVAS_MARGIN);

    // 描画関連のフック - マージンを考慮した描画
    const {
        drawCanvas,
        updateCanvasPosition,
        updateCursorStyle
    } = useCanvasDrawing(canvasRef, backgroundCanvasRef, imageRef, state, data, CANVAS_MARGIN);

    // ステータスメッセージ関連のフック
    const {
        statusMessage,
        updateStatusMessage
    } = useCanvasStatus(state, data, isImageLoaded);

    // 描画の最適化: requestAnimationFrameを使用
    const [pendingDraw, setPendingDraw] = useState(false);
    const requestAnimationRef = useRef<number | null>(null);

    const requestDraw = useCallback(() => {
        if (!pendingDraw) {
            setPendingDraw(true);
        }
    }, [pendingDraw]);

    // パターンキャンバスの描画関数 - 独立した関数として定義
    const drawPatternCanvas = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // ストライプパターンの描画
        const stripeSize = 10;
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#e0e0e0';
        for (let i = -canvas.height; i < canvas.width + canvas.height; i += stripeSize * 2) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + canvas.height, canvas.height);
            ctx.lineTo(i + canvas.height - stripeSize, canvas.height);
            ctx.lineTo(i - stripeSize, 0);
            ctx.closePath();
            ctx.fill();
        }
        
        // マージン領域をわかりやすくするための枠線
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(CANVAS_MARGIN, CANVAS_MARGIN, width, height);
    }, []);

    // 全キャンバスの位置とスケールを同時に更新する関数
    const syncCanvasPositions = useCallback(() => {
        if (!canvasRef.current || !backgroundCanvasRef.current || !patternCanvasRef.current) return;
        
        // 各キャンバスに同じスタイルを適用
        [canvasRef.current, backgroundCanvasRef.current, patternCanvasRef.current].forEach(canvas => {
            canvas.style.position = 'absolute';
            canvas.style.transform = `scale(${state.view.scale})`;
            canvas.style.transformOrigin = '0 0';
            canvas.style.left = `${state.view.offsetX}px`;
            canvas.style.top = `${state.view.offsetY}px`;
        });
    }, [state.view.scale, state.view.offsetX, state.view.offsetY]);

    // 画像ロード完了時の処理
    useEffect(() => {
        // public フォルダ内の画像ファイルを読み込む
        const loadImage = () => {
            const possiblePaths = [
                '/test.png',
                './test.png',
                'test.png',
                `${window.location.origin}/test.png`
            ];

            const img = new Image();
            img.onload = () => {
                imageRef.current = img;
                setIsImageLoaded(true);

                // 元の画像サイズを保存
                const imgWidth = img.naturalWidth || 800;
                const imgHeight = img.naturalHeight || 600;
                setCanvasWidth(imgWidth);
                setCanvasHeight(imgHeight);

                const totalWidth = imgWidth + CANVAS_MARGIN * 2;
                const totalHeight = imgHeight + CANVAS_MARGIN * 2;

                // すべてのキャンバスのサイズを設定（マージン込み）
                if (canvasRef.current) {
                    canvasRef.current.width = totalWidth;
                    canvasRef.current.height = totalHeight;
                }
                
                if (backgroundCanvasRef.current) {
                    backgroundCanvasRef.current.width = totalWidth;
                    backgroundCanvasRef.current.height = totalHeight;
                }
                
                if (patternCanvasRef.current) {
                    patternCanvasRef.current.width = totalWidth;
                    patternCanvasRef.current.height = totalHeight;
                    
                    // パターンキャンバスを描画
                    drawPatternCanvas(patternCanvasRef.current, imgWidth, imgHeight);
                }

                // キャンバスの位置とスケールを同期
                syncCanvasPositions();
                
                updateCanvasSize(imgWidth, imgHeight);
                drawCanvas();
            };

            img.onerror = () => {
                setIsImageLoaded(false);

                // プレースホルダーサイズ設定
                const width = 800;
                const height = 600;
                setCanvasWidth(width);
                setCanvasHeight(height);

                const totalWidth = width + CANVAS_MARGIN * 2;
                const totalHeight = height + CANVAS_MARGIN * 2;

                // すべてのキャンバスのサイズを設定（マージン込み）
                if (canvasRef.current) {
                    canvasRef.current.width = totalWidth;
                    canvasRef.current.height = totalHeight;
                }
                
                if (backgroundCanvasRef.current) {
                    backgroundCanvasRef.current.width = totalWidth;
                    backgroundCanvasRef.current.height = totalHeight;
                }
                
                if (patternCanvasRef.current) {
                    patternCanvasRef.current.width = totalWidth;
                    patternCanvasRef.current.height = totalHeight;
                    
                    // パターンキャンバスを描画
                    drawPatternCanvas(patternCanvasRef.current, width, height);
                }

                // キャンバスの位置とスケールを同期
                syncCanvasPositions();

                // エラーメッセージを上レイヤーに表示
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = "rgba(240, 240, 240, 0.7)";
                    ctx.fillRect(CANVAS_MARGIN, CANVAS_MARGIN, width, height);
                    ctx.fillStyle = "#999";
                    ctx.font = "24px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText("テスト画像が見つかりません", width / 2 + CANVAS_MARGIN, height / 2 + CANVAS_MARGIN);
                }

                updateCanvasSize(width, height);
            };

            // 最初のパスを試す
            img.src = `${possiblePaths[0]}?t=${Date.now()}`;
        };

        loadImage();
    }, [drawCanvas, updateCanvasSize, drawPatternCanvas, syncCanvasPositions]);

    // 描画更新のアニメーションフレーム - 最適化バージョン
    useEffect(() => {
        if (pendingDraw && isImageLoaded) {
            // 既存のリクエストをキャンセル
            if (requestAnimationRef.current !== null) {
                cancelAnimationFrame(requestAnimationRef.current);
            }

            // 新しいフレームで描画
            requestAnimationRef.current = requestAnimationFrame(() => {
                // パターンキャンバスの再描画（消えないように）
                if (patternCanvasRef.current) {
                    drawPatternCanvas(patternCanvasRef.current, canvasWidth, canvasHeight);
                }
                
                drawCanvas();
                // キャンバス位置を同期
                syncCanvasPositions();
                updateCursorStyle();
                updateStatusMessage();
                setPendingDraw(false);
            });
        }

        return () => {
            if (requestAnimationRef.current !== null) {
                cancelAnimationFrame(requestAnimationRef.current);
            }
        };
    }, [
        pendingDraw, 
        isImageLoaded, 
        drawCanvas, 
        syncCanvasPositions, 
        updateCursorStyle, 
        updateStatusMessage, 
        drawPatternCanvas,
        canvasWidth,
        canvasHeight
    ]);

    // スケールやオフセットが変更されたときに位置を同期
    useEffect(() => {
        syncCanvasPositions();
    }, [syncCanvasPositions, state.view.scale, state.view.offsetX, state.view.offsetY]);

    // 状態変更時に描画をリクエスト - 依存関係を最適化
    useEffect(() => {
        if (isImageLoaded) {
            requestDraw();
        }
    }, [
        isImageLoaded, 
        requestDraw,
        // state内の変更を監視（全体ではなく必要な部分のみ）
        state.selection.selecting,
        state.selection.currentX,
        state.selection.currentY,
        state.selection.hoveredAnnotationIndex,
        state.selection.selectedAnnotations,
        state.view.scale,
        state.view.offsetX,
        state.view.offsetY,
        state.mode.mode,
        state.mode.flashingIndices,
        // アノテーションデータの変更を監視
        data.annotation.length
    ]);

    // マウスイベント関連のフック - マージンを考慮
    const {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseOut,
        handleWheel
    } = useCanvasEvents(
        canvasRef,
        state,
        getCanvasCoordinates,
        findRectangleAtPosition,
        requestDraw,
        updateStatusMessage,
        updateCursorStyle,
        {
            startSelection,
            updateSelection,
            finishSelection,
            setHoveredAnnotationIndex,
            toggleAnnotationSelection,
            renumberAnnotation,
            startDrag,
            updateDrag,
            endDrag,
            setCommandKeyPressed,
            zoomIn,
            zoomOut
        },
        data.annotation
    );

    // タッチイベント関連のフック - マージンを考慮
    const {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleTouchCancel
    } = useCanvasTouch(
        canvasRef,
        containerRef,
        state,
        getCanvasCoordinates,
        findRectangleAtPosition,
        {
            startSelection,
            updateSelection,
            finishSelection,
            setHoveredAnnotationIndex,
            toggleAnnotationSelection,
            renumberAnnotation,
            startDrag,
            updateDrag,
            endDrag,
            setCommandKeyPressed,
            zoomIn,
            zoomOut,
            updateCanvasScale
        },
        data.annotation,
        requestDraw
    );

    // キャンバス強制再描画リスナー - メモ化バージョン
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleForceRedraw = () => {
            // パターンキャンバスを含めて全て再描画
            requestDraw();
        };

        // forceRedrawイベントリスナーを追加
        canvas.addEventListener('forceRedraw', handleForceRedraw);

        // クリーンアップ
        return () => {
            canvas.removeEventListener('forceRedraw', handleForceRedraw);
        };
    }, [canvasRef, requestDraw]);

    // リソース解放のためのクリーンアップ
    useEffect(() => {
        return () => {
            // 画像参照をクリア
            if (imageRef.current) {
                imageRef.current = null;
            }
            
            // アニメーションフレームをキャンセル
            if (requestAnimationRef.current !== null) {
                cancelAnimationFrame(requestAnimationRef.current);
                requestAnimationRef.current = null;
            }
        };
    }, []);

    return {
        canvasRef,
        backgroundCanvasRef,
        patternCanvasRef,
        containerRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseOut,
        handleWheel,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleTouchCancel,
        statusMessage,
        isImageLoaded,
        canvasWidth,
        canvasHeight
    };
};