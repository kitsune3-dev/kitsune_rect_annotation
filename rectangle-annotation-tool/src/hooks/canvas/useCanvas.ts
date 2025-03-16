import { useRef, useEffect, useState, useCallback } from 'react';
import { useAnnotation } from '../../contexts/AnnotationContext';
import { useCanvasDrawing } from './useCanvasDrawing';
import { useCanvasCoordinates } from './useCanvasCoordinates';
import { useCanvasEvents } from './useCanvasEvents';
import { useCanvasStatus } from './useCanvasStatus';
import { useCanvasTouch } from './useCanvasTouch';

export const useCanvas = () => {
    // 基本的な参照の設定
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

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

    // 座標変換関連のフック
    const {
        getCanvasCoordinates,
        findRectangleAtPosition
    } = useCanvasCoordinates(canvasRef, state);

    // 描画関連のフック
    const {
        drawCanvas,
        updateCanvasPosition,
        updateCursorStyle
    } = useCanvasDrawing(canvasRef, imageRef, state, data);

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

                if (canvasRef.current) {
                    // キャンバスのサイズを画像のサイズに設定
                    canvasRef.current.width = img.naturalWidth || 800;
                    canvasRef.current.height = img.naturalHeight || 600;

                    updateCanvasSize(canvasRef.current.width, canvasRef.current.height);
                    drawCanvas();
                }
            };

            img.onerror = () => {
                setIsImageLoaded(false);

                // プレースホルダー設定
                if (canvasRef.current) {
                    canvasRef.current.width = 800;
                    canvasRef.current.height = 600;

                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = "#f0f0f0";
                        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        ctx.fillStyle = "#999";
                        ctx.font = "24px Arial";
                        ctx.textAlign = "center";
                        ctx.fillText("テスト画像が見つかりません", canvasRef.current.width / 2, canvasRef.current.height / 2);
                    }

                    updateCanvasSize(800, 600);
                }
            };

            // 最初のパスを試す
            img.src = `${possiblePaths[0]}?t=${Date.now()}`;
        };

        loadImage();
    }, [drawCanvas, updateCanvasSize]);

    // 描画更新のアニメーションフレーム - 最適化バージョン
    useEffect(() => {
        if (pendingDraw && isImageLoaded) {
            // 既存のリクエストをキャンセル
            if (requestAnimationRef.current !== null) {
                cancelAnimationFrame(requestAnimationRef.current);
            }

            // 新しいフレームで描画
            requestAnimationRef.current = requestAnimationFrame(() => {
                drawCanvas();
                updateCanvasPosition();
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
    }, [pendingDraw, isImageLoaded, drawCanvas, updateCanvasPosition, updateCursorStyle, updateStatusMessage]);

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

    // マウスイベント関連のフック - 型アサーションを削除
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

    // タッチイベント関連のフック - 型アサーションを削除
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
        isImageLoaded
    };
};