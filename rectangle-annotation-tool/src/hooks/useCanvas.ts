import { useRef, useEffect, useState, useCallback } from 'react';
import { useAnnotation } from '../contexts/AnnotationContext';
import { colorMap, borderColorMap } from '../utils/colorConstants';
import { drawTextWithStroke, drawTextWithBackground } from '../utils/drawingUtils';


export const useCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [statusMessage, setStatusMessage] = useState('読み込み中...');

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
        zoomOut
    } = useAnnotation();

    // 座標変換: クライアント座標 → キャンバス座標
    const getCanvasCoordinates = (clientX: number, clientY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };

        const rect = canvasRef.current.getBoundingClientRect();

        // クライアント座標からキャンバス表示領域内の相対座標を計算
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        // スケールのみを考慮して元の座標に変換
        const x = relativeX / state.scale;
        const y = relativeY / state.scale;

        return { x, y };
    };

    // 点が矩形の中にあるかチェック
    const isPointInRectangle = (x: number, y: number, polygon: number[]) => {
        const [x1, y1, x2, y2, x3, y3, x4, y4] = polygon;

        // 単純な軸並行矩形の場合
        const minX = Math.min(x1, x2, x3, x4);
        const maxX = Math.max(x1, x2, x3, x4);
        const minY = Math.min(y1, y2, y3, y4);
        const maxY = Math.max(y1, y2, y3, y4);

        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    };

    // マウス位置から矩形を検索
    const findRectangleAtPosition = (x: number, y: number) => {
        for (let i = 0; i < data.annotation.length; i++) {
            if (isPointInRectangle(x, y, data.annotation[i].polygon)) {
                return i;
            }
        }
        return -1;
    };

    // キャンバスの描画
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) {
            return;
        }

        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 画像の描画
        if (imageRef.current && imageRef.current.complete) {
            try {
                // ctx の状態をリセット
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.globalAlpha = 1.0;

                // 画像全体がキャンバスに表示されるように描画
                ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
            } catch (err) {
                console.error('Error drawing image:', err);
            }
        } else {
            // プレースホルダー表示
            ctx.fillStyle = "#f0f0f0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#999";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("画像が読み込まれていません", canvas.width / 2, canvas.height / 2);
        }

        // 既存のアノテーションを描画
        data.annotation.forEach((anno, index) => {
            const [x1, y1, x2, y2, x3, y3, x4, y4] = anno.polygon;

            const isSelected = state.selectedAnnotations.includes(index);
            const isHovered = state.hoveredAnnotationIndex === index;
            const isFlashing = state.flashingIndices?.includes(index);

            // 通常の色/ホバー時の色/選択時の色/フラッシュ時の色を決定
            let fillColor = colorMap[anno.label_id];
            let strokeColor = borderColorMap[anno.label_id];
            let lineWidth = 2;

            if (isFlashing) {
                // フラッシュ時はオレンジ色でハイライト
                fillColor = "rgba(255, 165, 0, 0.5)";
                strokeColor = "rgb(255, 165, 0)";
                lineWidth = 4;
            } else if (isHovered && (state.mode === 'delete' || state.mode === 'renumber')) {
                // ホバー時は少し明るく
                fillColor = colorMap[anno.label_id].replace('0.3', '0.5');
                lineWidth = 3;
            }

            if (isSelected) {
                // 選択時は強調表示を強化
                if (state.mode === 'delete') {
                    // 削除モードでは赤く強調
                    fillColor = "rgba(255, 0, 0, 0.4)"; // より明確な赤色の半透明
                    strokeColor = "rgb(255, 0, 0)";      // 赤色の枠線
                    lineWidth = 4;                       // 太い線幅
                } else if (state.mode === 'renumber') {
                    // 番号振り直しモードでは緑で強調
                    fillColor = "rgba(0, 128, 0, 0.3)";  // 緑色の半透明
                    strokeColor = "rgb(0, 128, 0)";     // 緑色の枠線
                    lineWidth = 3;
                }
            }

            ctx.fillStyle = fillColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 削除モードで選択された矩形には✕印を表示
            if (state.mode === 'delete' && isSelected) {
                const centerX = (x1 + x3) / 2;
                const centerY = (y1 + y3) / 2;
                const size = Math.min(Math.abs(x2 - x1), Math.abs(y3 - y2)) * 0.4; // ✕印のサイズ

                ctx.strokeStyle = "rgb(255, 0, 0)";
                ctx.lineWidth = 4;
                ctx.beginPath();
                // ✕の左上から右下への線
                ctx.moveTo(centerX - size, centerY - size);
                ctx.lineTo(centerX + size, centerY + size);
                // ✕の右上から左下への線
                ctx.moveTo(centerX + size, centerY - size);
                ctx.lineTo(centerX - size, centerY + size);
                ctx.stroke();
            }

            // 番号振り直しモードで選択済みの場合、IDを表示
            if (state.mode === 'renumber' && isSelected) {
                const centerX = (x1 + x3) / 2;
                const centerY = (y1 + y3) / 2;
                
                // 背景円
                ctx.fillStyle = "white";
                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // ID番号（縁取り付き）
                drawTextWithStroke(
                  ctx, 
                  anno.id.toString(), 
                  centerX, 
                  centerY, 
                  "black",  // 文字色
                  "white",  // 縁取り色
                  1.5,       // 縁取りの太さ
                  "bold 14px Arial",
                  "center",
                  "middle"
                );
              }

            // すべての矩形にラベル情報を追加
            const rectWidth = x2 - x1;
            const rectHeight = y3 - y1;

            // ラベル背景（左上に配置）
            const labelText = `${anno.id}: ${data.labels[anno.label_id]}`;

  
            // 矩形が十分な大きさを持つ場合の表示方法
            if (rectWidth > 100 && rectHeight > 30) {
                // 矩形内にラベルを表示
                const bgColor = borderColorMap[anno.label_id].replace('rgb', 'rgba').replace(')', ', 0.7)');

                drawTextWithBackground(
                    ctx,
                    labelText,
                    x1 + 5,
                    y1 + 5,
                    {
                        fillStyle: "white",
                        strokeStyle: "black",
                        strokeWidth: 2,
                        font: "bold 12px Arial",
                        textAlign: "left",
                        textBaseline: "top",
                        padding: { x: 5, y: 3 }
                    },
                    {
                        fillStyle: bgColor,
                        radius: 3  // 角丸の半径
                    }
                );
            } else {
                // 矩形が小さい場合は、矩形の上に表示
                const bgColor = borderColorMap[anno.label_id].replace('rgb', 'rgba').replace(')', ', 0.7)');

                drawTextWithBackground(
                    ctx,
                    labelText,
                    x1 + (rectWidth / 2),
                    y1 - 5,
                    {
                        fillStyle: "white",
                        strokeStyle: "black",
                        strokeWidth: 2,
                        font: "bold 12px Arial",
                        textAlign: "center",
                        textBaseline: "bottom",
                        padding: { x: 5, y: 3 }
                    },
                    {
                        fillStyle: bgColor,
                        radius: 3  // 角丸の半径
                    }
                );
            }
        });

        // 選択中の矩形を描画
        if (state.mode === 'add' && state.selecting) {
            const x1 = Math.min(state.startX, state.currentX);
            const y1 = Math.min(state.startY, state.currentY);
            const width = Math.abs(state.currentX - state.startX);
            const height = Math.abs(state.currentY - state.startY);

            ctx.fillStyle = colorMap[state.selectedLabelId];
            ctx.strokeStyle = borderColorMap[state.selectedLabelId];
            ctx.lineWidth = 2;

            ctx.fillRect(x1, y1, width, height);
            ctx.strokeRect(x1, y1, width, height);
        }
    }, [data.annotation, state, colorMap, borderColorMap]);

    // キャンバスの位置更新
    const updateCanvasPosition = useCallback(() => {
        if (!canvasRef.current) return;

        canvasRef.current.style.transform = `scale(${state.scale}) translate(${state.offsetX / state.scale}px, ${state.offsetY / state.scale}px)`;
        canvasRef.current.style.transformOrigin = '0 0';

        // 親要素のoverflowをvisibleに設定（overflow-hidden問題の対策）
        if (canvasRef.current.parentElement) {
            canvasRef.current.parentElement.style.overflow = 'visible';
        }
    }, [state.scale, state.offsetX, state.offsetY]);

    // カーソルスタイルの更新
    const updateCursorStyle = useCallback(() => {
        if (!canvasRef.current) return;

        if (state.commandKeyPressed) {
            canvasRef.current.style.cursor = 'move';
        } else if (state.mode === 'add') {
            canvasRef.current.style.cursor = 'crosshair';
        } else {
            canvasRef.current.style.cursor = 'pointer';
        }
    }, [state.commandKeyPressed, state.mode]);

    // マウスダウンイベントハンドラ
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        // commandキーが押されていたら画像ドラッグモード
        if (state.commandKeyPressed) {
            startDrag(e.clientX, e.clientY);
            return;
        }

        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        console.log(`マウスクリック: 位置(${Math.round(coords.x)}, ${Math.round(coords.y)}), モード: ${state.mode}`);

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
                const index = findRectangleAtPosition(coords.x, coords.y);
                if (index !== -1) {
                    console.log(`矩形発見: インデックス ${index}`);

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
    };

    // マウスムーブイベントハンドラ
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        const coords = getCanvasCoordinates(e.clientX, e.clientY);

        if (state.isDragging) {
            // 画像ドラッグ
            updateDrag(e.clientX, e.clientY);
            updateCanvasPosition();
            drawCanvas();
            return;
        }

        switch (state.mode) {
            case 'add':
                if (state.selecting) {
                    // 選択領域の更新
                    updateSelection(coords.x, coords.y);
                    updateStatusMessage();
                    drawCanvas();
                }
                break;

            case 'delete':
            case 'renumber':
                // マウスホバー効果
                const index = findRectangleAtPosition(coords.x, coords.y);
                if (index !== state.hoveredAnnotationIndex) {
                    setHoveredAnnotationIndex(index);
                    drawCanvas();
                }
                break;
        }
    };

    // マウスアップイベントハンドラ
    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (state.isDragging) {
            endDrag();
        }
    };

    // マウスアウトイベントハンドラ
    const handleMouseOut = () => {
        if (state.hoveredAnnotationIndex !== -1) {
            setHoveredAnnotationIndex(-1);
            drawCanvas();
        }
    };

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

    // ステータスメッセージの更新
    const updateStatusMessage = useCallback(() => {
        let message = '';

        switch (state.mode) {
            case 'add':
                if (state.selecting) {
                    message = `矩形選択中... (${Math.round(state.currentX)},${Math.round(state.currentY)})`;
                } else {
                    message = `選択中: ${data.labels[state.selectedLabelId.toString()]}`;
                }
                break;
            case 'delete':
                message = "削除モード: 削除する矩形をクリックしてください";
                if (state.selectedAnnotations.length > 0) {
                    message += ` (${state.selectedAnnotations.length}個選択中)`;
                }
                break;
            case 'renumber':
                message = "番号振り直しモード: 矩形を順番にクリックしてください";
                if (state.selectedAnnotations.length > 0) {
                    message += ` (${state.selectedAnnotations.length}/${data.annotation.length}個選択済)`;
                }
                break;
        }

        if (isImageLoaded) {
            setStatusMessage(message);
        } else {
            setStatusMessage('画像読み込み中...');
        }
    }, [state.mode, state.selecting, state.currentX, state.currentY, state.selectedLabelId,
    state.selectedAnnotations.length, data.labels, data.annotation.length, isImageLoaded]);

    // 画像のロード
    useEffect(() => {
        console.log('Loading image...');

        // public フォルダ内の画像ファイルを読み込む (複数の可能性を試す)
        const possiblePaths = [
            '/test.png',
            './test.png',
            'test.png',
            `${window.location.origin}/test.png`
        ];

        const loadImageWithPaths = (paths: string[], index = 0) => {
            if (index >= paths.length) {
                console.error('Failed to load image from all possible paths');
                setStatusMessage('画像の読み込みに失敗しました');
                setupPlaceholder();
                return;
            }

            const path = paths[index];
            console.log(`Trying to load image from: ${path}`);

            const img = new Image();
            img.onload = () => {
                console.log(`Image loaded successfully from: ${path}`, {
                    width: img.width,
                    height: img.height,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight
                });

                if (canvasRef.current) {
                    setupLoadedImage(img);
                }
            };

            img.onerror = () => {
                console.warn(`Failed to load image from: ${path}`);
                // 次のパスを試す
                loadImageWithPaths(paths, index + 1);
            };

            // タイムスタンプ付きでロード (キャッシュ回避)
            img.src = `${path}?t=${Date.now()}`;
        };

        // プレースホルダー設定
        const setupPlaceholder = () => {
            if (canvasRef.current) {
                // プレースホルダー画像を作成
                const canvas = canvasRef.current;
                canvas.width = 800;
                canvas.height = 600;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = "#f0f0f0";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "#999";
                    ctx.font = "24px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText("テスト画像が見つかりません", canvas.width / 2, canvas.height / 2);
                }

                updateCanvasSize(800, 600);
            }
        };

        // 読み込まれた画像の設定
        const setupLoadedImage = (img: HTMLImageElement) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // キャンバスのサイズを画像のサイズに設定
            canvas.width = img.naturalWidth || 800;
            canvas.height = img.naturalHeight || 600;

            console.log('Canvas size set to', canvas.width, canvas.height);

            // 画像参照を保存
            imageRef.current = img;
            setIsImageLoaded(true);
            updateCanvasSize(canvas.width, canvas.height);

            // 状態更新と再描画
            updateStatusMessage();

            // 確実に画像が描画されるように少し遅延
            setTimeout(() => {
                drawCanvas();
                console.log('Canvas redrawn after image load');
            }, 100);
        };

        // 読み込み開始
        loadImageWithPaths(possiblePaths);

        // グローバルイベントリスナー
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // 状態が変わったら描画を更新
    useEffect(() => {
        if (isImageLoaded) {
            drawCanvas();
            updateCanvasPosition();
            updateCursorStyle();
            updateStatusMessage();
        }
    }, [state, data.annotation, isImageLoaded, drawCanvas, updateCanvasPosition, updateCursorStyle, updateStatusMessage]);

    // 他のuseEffectと並べて配置する
    // キャンバス強制再描画リスナーを追加
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleForceRedraw = () => {
            console.log('キャンバス強制再描画');
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
        canvasRef,
        containerRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseOut,
        handleWheel,
        statusMessage,
        isImageLoaded
    };
};