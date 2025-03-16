import { useCallback } from 'react';
import { AppState, AnnotationData } from '../../types/types';
import { colorMap, borderColorMap } from '../../utils/colorConstants';
import { drawText } from '../../utils/drawingUtils';

export const useCanvasDrawing = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    imageRef: React.RefObject<HTMLImageElement | null>,
    state: AppState,
    data: AnnotationData
) => {
    // キャンバスの描画
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { alpha: false }); // alpha:falseでパフォーマンス向上

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
        drawAnnotations(ctx);

        // 選択中の矩形を描画
        if (state.mode === 'add' && state.selecting) {
            drawSelectionRectangle(ctx);
        }
    }, [canvasRef, imageRef, state, data]);

    // アノテーションの描画
    const drawAnnotations = useCallback((ctx: CanvasRenderingContext2D) => {
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
                drawDeleteMark(ctx, x1, x2, x3, y1, y2, y3);
            }

            // 番号振り直しモードで選択済みの場合、IDを表示
            if (state.mode === 'renumber' && isSelected) {
                drawRenumberMark(ctx, x1, x3, y1, y3, anno.id);
            }

            // すべての矩形にラベル情報を追加
            drawAnnotationLabel(ctx, anno, x1, x2, y1, y3);
        });
    }, [data.annotation, state, colorMap, borderColorMap]);

    // 選択中の矩形を描画
    const drawSelectionRectangle = useCallback((ctx: CanvasRenderingContext2D) => {
        if (!state) return;
        
        const x1 = Math.min(state.startX, state.currentX);
        const y1 = Math.min(state.startY, state.currentY);
        const width = Math.abs(state.currentX - state.startX);
        const height = Math.abs(state.currentY - state.startY);

        ctx.fillStyle = colorMap[state.selectedLabelId];
        ctx.strokeStyle = borderColorMap[state.selectedLabelId];
        ctx.lineWidth = 2;

        ctx.fillRect(x1, y1, width, height);
        ctx.strokeRect(x1, y1, width, height);
    }, [state.startX, state.startY, state.currentX, state.currentY, state.selectedLabelId]);

    // 削除マークを描画
    const drawDeleteMark = useCallback((
        ctx: CanvasRenderingContext2D,
        x1: number, x2: number, x3: number,
        y1: number, y2: number, y3: number
    ) => {
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
    }, []);

    // 番号振り直しマークを描画
    const drawRenumberMark = useCallback((
        ctx: CanvasRenderingContext2D,
        x1: number, x3: number,
        y1: number, y3: number,
        id: number
    ) => {
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
        drawText(ctx, id.toString(), centerX, centerY, {
            textFillStyle: "black",
            textStrokeStyle: "white",
            textStrokeWidth: 1.5,
            font: "bold 14px Arial",
            textAlign: "center",
            textBaseline: "middle"
        });
    }, []);

    // アノテーションラベルを描画
    const drawAnnotationLabel = useCallback((
        ctx: CanvasRenderingContext2D,
        anno: any,
        x1: number, x2: number,
        y1: number, y3: number
    ) => {
        const rectWidth = x2 - x1;
        const rectHeight = y3 - y1;
        const labelText = `${anno.id}: ${data.labels[anno.label_id]}`;
        const bgColor = borderColorMap[anno.label_id].replace('rgb', 'rgba').replace(')', ', 0.7)');

        // 矩形が十分な大きさを持つ場合の表示方法
        if (rectWidth > 100 && rectHeight > 30) {
            // 矩形内にラベルを表示
            drawText(ctx, labelText, x1 + 5, y1 + 5, {
                textFillStyle: "white",
                textStrokeStyle: "black",
                textStrokeWidth: 2,
                font: "bold 12px Arial",
                textAlign: "left",
                textBaseline: "top",
                withBackground: true,
                bgFillStyle: bgColor,
                bgRadius: 3,
                padding: { x: 5, y: 3 }
            });
        } else {
            // 矩形が小さい場合は、矩形の上に表示
            drawText(ctx, labelText, x1 + (rectWidth / 2), y1 - 5, {
                textFillStyle: "white",
                textStrokeStyle: "black",
                textStrokeWidth: 2,
                font: "bold 12px Arial",
                textAlign: "center",
                textBaseline: "bottom",
                withBackground: true,
                bgFillStyle: bgColor,
                bgRadius: 3,
                padding: { x: 5, y: 3 }
            });
        }
    }, [data.labels]);

    // キャンバスの位置更新
    const updateCanvasPosition = useCallback(() => {
        if (!canvasRef.current) return;

        canvasRef.current.style.transform = `scale(${state.scale}) translate(${state.offsetX / state.scale}px, ${state.offsetY / state.scale}px)`;
        canvasRef.current.style.transformOrigin = '0 0';

        // 親要素のoverflowをvisibleに設定（overflow-hidden問題の対策）
        if (canvasRef.current.parentElement) {
            canvasRef.current.parentElement.style.overflow = 'visible';
        }
    }, [canvasRef, state.scale, state.offsetX, state.offsetY]);

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
    }, [canvasRef, state.commandKeyPressed, state.mode]);

    return {
        drawCanvas,
        updateCanvasPosition,
        updateCursorStyle
    };
};