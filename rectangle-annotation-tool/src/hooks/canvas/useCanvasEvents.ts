import { useCallback, useEffect, useRef } from 'react';
import { AppState } from '../../types/types'; 

export const useCanvasEvents = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    state: AppState,
    getCanvasCoordinates: (clientX: number, clientY: number) => { x: number; y: number },
    findRectangleAtPosition: (x: number, y: number, annotations: any[]) => number,
    drawCanvas: () => void,
    updateStatusMessage: () => void,
    updateCursorStyle: () => void,
    handlers: {
        startSelection: (x: number, y: number) => void;
        updateSelection: (x: number, y: number) => void;
        finishSelection: () => void;
        setHoveredAnnotationIndex: (index: number) => void;
        toggleAnnotationSelection: (index: number) => void;
        renumberAnnotation: (index: number) => void;
        startDrag: (clientX: number, clientY: number) => void;
        updateDrag: (clientX: number, clientY: number) => void;
        endDrag: () => void;
        setCommandKeyPressed: (pressed: boolean) => void;
        zoomIn: () => void;
        zoomOut: () => void;
    },
    annotations: any[]
) => {
    // 描画最適化のためのdebounce/throttle処理用
    const lastDrawTime = useRef(0);
    const mouseMoveThrottleDelay = 16; // 約60fpsに制限
    const {
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
    } = handlers;

    // マウスダウンイベントハンドラ
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        // commandキーが押されていたら画像ドラッグモード
        if (state.commandKeyPressed) {
            startDrag(e.clientX, e.clientY);
            return;
        }

        const coords = getCanvasCoordinates(e.clientX, e.clientY);

        switch (state.mode) {
            case 'add':
                if (!state.selecting) {
                    // 矩形選択開始
                    startSelection(coords.x, coords.y);
                } else {
                    // 矩形選択終了
                    finishSelection();
                }
                break;

            case 'delete':
            case 'renumber':
                // 矩形選択
                const index = findRectangleAtPosition(coords.x, coords.y, annotations);
                if (index !== -1) {

                    if (state.mode === 'delete') {
                        // 削除モード: 選択トグル
                        toggleAnnotationSelection(index);
                        // 描画を即時更新
                        drawCanvas();
                    } else if (state.mode === 'renumber') {
                        // 番号振り直しモード
                        renumberAnnotation(index);
                        // 描画を即時更新
                        drawCanvas();
                    }
                } else {
                    console.log('クリック位置に矩形がありません');
                }
                break;
        }

        // ステータスメッセージ更新
        updateStatusMessage();
    }, [
        state.commandKeyPressed, 
        state.mode, 
        state.selecting, 
        startDrag, 
        getCanvasCoordinates, 
        startSelection, 
        finishSelection, 
        findRectangleAtPosition, 
        annotations, 
        toggleAnnotationSelection, 
        renumberAnnotation, 
        drawCanvas, 
        updateStatusMessage
    ]);

    // マウスムーブイベントハンドラ
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        const now = performance.now();
        if (now - lastDrawTime.current < mouseMoveThrottleDelay && !state.selecting && !state.isDragging) {
            // スロットリング: 高頻度の再描画を防止（選択中やドラッグ中は除外）
            return;
        }
        lastDrawTime.current = now;

        const coords = getCanvasCoordinates(e.clientX, e.clientY);

        if (state.isDragging) {
            // 画像ドラッグ
            updateDrag(e.clientX, e.clientY);
            drawCanvas(); // ドラッグ中は即時描画
            return;
        }

        switch (state.mode) {
            case 'add':
                if (state.selecting) {
                    // 選択領域の更新
                    updateSelection(coords.x, coords.y);
                    updateStatusMessage();
                    drawCanvas(); // 選択中は即時描画
                }
                break;

            case 'delete':
            case 'renumber':
                // マウスホバー効果
                const index = findRectangleAtPosition(coords.x, coords.y, annotations);
                if (index !== state.hoveredAnnotationIndex) {
                    setHoveredAnnotationIndex(index);
                    drawCanvas(); // ホバー状態変更時は即時描画
                }
                break;
        }
    }, [
        state.isDragging, 
        state.mode, 
        state.selecting, 
        state.hoveredAnnotationIndex,
        getCanvasCoordinates, 
        updateDrag, 
        updateSelection, 
        findRectangleAtPosition, 
        annotations, 
        setHoveredAnnotationIndex, 
        updateStatusMessage, 
        drawCanvas,
        mouseMoveThrottleDelay,
        lastDrawTime
    ]);

    // マウスアップイベントハンドラ
    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (state.isDragging) {
            endDrag();
        }
    }, [state.isDragging, endDrag]);

    // マウスアウトイベントハンドラ
    const handleMouseOut = useCallback(() => {
        if (state.hoveredAnnotationIndex !== -1) {
            setHoveredAnnotationIndex(-1);
            drawCanvas();
        }
    }, [state.hoveredAnnotationIndex, setHoveredAnnotationIndex, drawCanvas]);

    // ホイールイベントハンドラ (ズーム)
    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        // 標準のスクロール動作を防止
        e.preventDefault();
        e.stopPropagation();

        // ズーム処理
        if (e.deltaY < 0) {
            // ズームイン (ホイールを上に回した)
            zoomIn();
        } else {
            // ズームアウト (ホイールを下に回した)
            zoomOut();
        }
    }, [zoomIn, zoomOut]);

    // キーイベントハンドラ
    useEffect(() => {
        // キーダウンイベントハンドラ
        const handleKeyDown = (e: KeyboardEvent) => {
            // Macのcommandキー (metaKey) または Windowsのctrlキー (ctrlKey)
            if (e.metaKey || e.ctrlKey) {
                setCommandKeyPressed(true);
                updateCursorStyle();
            }
        };

        // キーアップイベントハンドラ
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Meta' || e.key === 'Control') {
                setCommandKeyPressed(false);
                updateCursorStyle();
            }
        };

        // グローバルイベントリスナー
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [setCommandKeyPressed, updateCursorStyle]);

    // キャンバス強制再描画リスナー
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleForceRedraw = () => {
            drawCanvas();
        };

        // forceRedrawイベントリスナーを追加
        canvas.addEventListener('forceRedraw', handleForceRedraw);

        // クリーンアップ
        return () => {
            canvas.removeEventListener('forceRedraw', handleForceRedraw);
        };
    }, [canvasRef, drawCanvas]);

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseOut,
        handleWheel
    };
};