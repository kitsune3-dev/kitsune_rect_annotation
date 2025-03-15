import { useState, useEffect, useCallback } from 'react';

export const useCanvasImage = (
    canvasRef: React.RefObject<HTMLCanvasElement|null>,
    imageRef: React.RefObject<HTMLImageElement|null>,
    drawCanvas: () => void,
    updateCanvasSize: (width: number, height: number) => void
) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    // 画像のロード
    const loadImage = useCallback(() => {
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

            // 確実に画像が描画されるように少し遅延
            setTimeout(() => {
                drawCanvas();
                console.log('Canvas redrawn after image load');
            }, 100);
        };

        // 読み込み開始
        loadImageWithPaths(possiblePaths);
    }, [canvasRef, imageRef, updateCanvasSize, drawCanvas]);

    useEffect(() => {
        loadImage();
    }, [loadImage]);

    return {
        isImageLoaded,
        setIsImageLoaded
    };
};