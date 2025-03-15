document.addEventListener('DOMContentLoaded', function() {
    // キャンバスの設定
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    
    // 状態管理
    let currentState = {
        selecting: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        selectedLabelId: 1,
        isDragging: false,
        lastX: 0,
        lastY: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        commandKeyPressed: false
    };
    
    // アノテーションデータ
    let data = {
        image: "test.png",
        labels: {
            1: "章タイトル",
            2: "節タイトル",
            3: "概要",
            4: "本文",
            5: "補足",
            6: "コラム",
            7: "用語解説",
            8: "図",
            9: "表"
        },
        annotation: []
    };
    
    // 履歴管理
    let history = [];
    let historyIndex = -1;
    
    // 画像
    const image = new Image();
    image.src = "test.png";  // テスト用画像
    image.onload = function() {
        canvas.width = image.width;
        canvas.height = image.height;
        
        // キャンバスを中央に配置
        updateCanvasPosition();
        drawCanvas();
        
        document.getElementById('status').textContent = "準備完了";
    };
    
    image.onerror = function() {
        document.getElementById('status').textContent = "画像の読み込みに失敗しました";
        // プレースホルダー画像を作成
        canvas.width = 800;
        canvas.height = 600;
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#999";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("テスト画像が見つかりません", canvas.width/2, canvas.height/2);
        updateCanvasPosition();
    };
    
    // 色のマッピング
    const colorMap = {
        1: "rgba(255, 0, 0, 0.3)",
        2: "rgba(0, 255, 0, 0.3)",
        3: "rgba(0, 0, 255, 0.3)",
        4: "rgba(255, 255, 0, 0.3)",
        5: "rgba(255, 0, 255, 0.3)",
        6: "rgba(0, 255, 255, 0.3)",
        7: "rgba(128, 0, 128, 0.3)",
        8: "rgba(128, 128, 0, 0.3)",
        9: "rgba(0, 128, 128, 0.3)"
    };
    
    const borderColorMap = {
        1: "rgb(255, 0, 0)",
        2: "rgb(0, 255, 0)",
        3: "rgb(0, 0, 255)",
        4: "rgb(255, 255, 0)",
        5: "rgb(255, 0, 255)",
        6: "rgb(0, 255, 255)",
        7: "rgb(128, 0, 128)",
        8: "rgb(128, 128, 0)",
        9: "rgb(0, 128, 128)"
    };
    
    // ラベル選択
    document.querySelectorAll('.label-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (!currentState.selecting) {
                document.querySelectorAll('.label-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                this.classList.add('selected');
                currentState.selectedLabelId = parseInt(this.getAttribute('data-label-id'));
                document.getElementById('status').textContent = `選択中: ${data.labels[currentState.selectedLabelId]}`;
            }
        });
    });
    
    // マウス座標をキャンバス座標に変換 - 最終修正版
    function getCanvasCoordinates(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        
        // クライアント座標からキャンバス表示領域内の相対座標を計算
        // 重要: ここでのrect.leftとrect.topは既にtransform全体（scale+translate）の影響を受けている
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;
        
        // スケールのみを考慮して元の座標に変換
        // offsetを引く必要はない - getBoundingClientRectが返す位置は
        // 既にtranslateの影響を含んでいるため
        const x = relativeX / currentState.scale;
        const y = relativeY / currentState.scale;
        
        // デバッグ情報（必要に応じてコメントアウト）
        console.log("クリック位置（クライアント座標）:", clientX, clientY);
        console.log("canvas位置:", rect.left, rect.top);
        console.log("canvas内での相対位置:", relativeX, relativeY);
        console.log("計算された画像上の座標:", x, y);
        
        return { x, y };
    }
    
    // キャンバスイベント
    canvas.addEventListener('mousedown', function(e) {
        e.preventDefault();
        
        // commandキーが押されていたら画像ドラッグモード
        if (currentState.commandKeyPressed) {
            currentState.isDragging = true;
            currentState.lastX = e.clientX;
            currentState.lastY = e.clientY;
            return;
        }
        
        if (!currentState.selecting) {
            // 矩形選択開始
            const coords = getCanvasCoordinates(e.clientX, e.clientY);
            
            currentState.selecting = true;
            currentState.startX = coords.x;
            currentState.startY = coords.y;
            currentState.currentX = coords.x;
            currentState.currentY = coords.y;
            
            document.getElementById('status').textContent = "矩形選択中... (" + Math.round(coords.x) + "," + Math.round(coords.y) + ")";
            
            // デバッグ情報
            console.log("選択開始: ", coords);
            console.log("現在のオフセット: ", currentState.offsetX, currentState.offsetY);
            console.log("現在のスケール: ", currentState.scale);
        } else {
            // 矩形選択終了
            finishSelection();
        }
    });
    
    canvas.addEventListener('mousemove', function(e) {
        e.preventDefault();
        
        if (currentState.isDragging) {
            // 画像ドラッグ
            const dx = e.clientX - currentState.lastX;
            const dy = e.clientY - currentState.lastY;
            
            currentState.offsetX += dx;
            currentState.offsetY += dy;
            
            currentState.lastX = e.clientX;
            currentState.lastY = e.clientY;
            
            updateCanvasPosition();
            drawCanvas();
            return;
        }
        
        if (currentState.selecting) {
            const coords = getCanvasCoordinates(e.clientX, e.clientY);
            currentState.currentX = coords.x;
            currentState.currentY = coords.y;
            drawCanvas();
        }
    });
    
    canvas.addEventListener('mouseup', function(e) {
        e.preventDefault();
        if (currentState.isDragging) {
            currentState.isDragging = false;
        }
    });
    
    // 矩形選択の終了処理
    function finishSelection() {
        if (Math.abs(currentState.currentX - currentState.startX) > 5 && 
            Math.abs(currentState.currentY - currentState.startY) > 5) {
            
            // 新しいアノテーションの追加
            const x1 = Math.min(currentState.startX, currentState.currentX);
            const y1 = Math.min(currentState.startY, currentState.currentY);
            const x2 = Math.max(currentState.startX, currentState.currentX);
            const y2 = Math.max(currentState.startY, currentState.currentY);
            
            const newAnnotation = {
                id: data.annotation.length > 0 ? Math.max(...data.annotation.map(a => a.id)) + 1 : 1,
                label_id: currentState.selectedLabelId,
                polygon: [
                    x1, y1,  // 左上
                    x2, y1,  // 右上
                    x2, y2,  // 右下
                    x1, y2   // 左下
                ]
            };
            
            const newAnnotations = [...data.annotation, newAnnotation];
            
            // 履歴管理に追加 - 変更後に履歴を追加
            addHistoryState(newAnnotations);
            
            // データを更新
            data.annotation = newAnnotations;
            
            document.getElementById('status').textContent = `${data.labels[currentState.selectedLabelId]}を追加しました (座標: ${Math.round(x1)},${Math.round(y1)} - ${Math.round(x2)},${Math.round(y2)})`;
            
            // デバッグ情報
            console.log("選択終了: ", { x1, y1, x2, y2 });
            console.log("現在のオフセット: ", currentState.offsetX, currentState.offsetY);
            console.log("現在のスケール: ", currentState.scale);
        }
        
        // 選択状態をリセット
        currentState.selecting = false;
        drawCanvas();
    }
    
    // キャンバスの描画
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 画像の描画
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        // 既存のアノテーションを描画
        data.annotation.forEach(anno => {
            const [x1, y1, x2, y2, x3, y3, x4, y4] = anno.polygon;
            
            ctx.fillStyle = colorMap[anno.label_id];
            ctx.strokeStyle = borderColorMap[anno.label_id];
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
        
        // 選択中の矩形を描画
        if (currentState.selecting) {
            const x1 = Math.min(currentState.startX, currentState.currentX);
            const y1 = Math.min(currentState.startY, currentState.currentY);
            const width = Math.abs(currentState.currentX - currentState.startX);
            const height = Math.abs(currentState.currentY - currentState.startY);
            
            ctx.fillStyle = colorMap[currentState.selectedLabelId];
            ctx.strokeStyle = borderColorMap[currentState.selectedLabelId];
            ctx.lineWidth = 2;
            
            ctx.fillRect(x1, y1, width, height);
            ctx.strokeRect(x1, y1, width, height);
        }
    }
    
    // キャンバスの位置更新 - 修正版
    function updateCanvasPosition() {
        // transformの適用順序：まずscale、次にtranslate
        canvas.style.transform = `scale(${currentState.scale}) translate(${currentState.offsetX / currentState.scale}px, ${currentState.offsetY / currentState.scale}px)`;
        canvas.style.transformOrigin = '0 0';
    }
    
    // 履歴の追加 - 修正版
    function addHistoryState(annotationData) {
        // データをディープコピー
        const currentData = JSON.parse(JSON.stringify(annotationData));
        
        // 現在の履歴インデックスより後のものを削除
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        
        // 新しい履歴を追加
        history.push(currentData);
        historyIndex = history.length - 1;
        
        // ボタンの状態を更新
        updateButtons();
    }
    
    // Undo操作 - 修正版
    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            data.annotation = JSON.parse(JSON.stringify(history[historyIndex]));
            drawCanvas();
            updateButtons();
            document.getElementById('status').textContent = "操作を元に戻しました";
        }
    }
    
    // Redo操作 - 修正版
    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            data.annotation = JSON.parse(JSON.stringify(history[historyIndex]));
            drawCanvas();
            updateButtons();
            document.getElementById('status').textContent = "操作をやり直しました";
        }
    }
    
    // ボタンの状態更新
    function updateButtons() {
        document.getElementById('undo-btn').disabled = historyIndex <= 0;
        document.getElementById('redo-btn').disabled = historyIndex >= history.length - 1;
    }
    
    // 保存処理
    function saveData() {
        const outputData = JSON.stringify(data, null, 2);
        const blob = new Blob([outputData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotation.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        document.getElementById('status').textContent = "データを保存しました";
    }
    
    // ズーム処理
    function zoomIn() {
        currentState.scale *= 1.1;
        updateCanvasPosition();
        drawCanvas();
    }
    
    function zoomOut() {
        currentState.scale /= 1.1;
        updateCanvasPosition();
        drawCanvas();
    }
    
    function zoomReset() {
        currentState.scale = 1;
        currentState.offsetX = 0;
        currentState.offsetY = 0;
        updateCanvasPosition();
        drawCanvas();
    }
    
    // イベントリスナー
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
    document.getElementById('save-btn').addEventListener('click', saveData);
    document.getElementById('zoom-in').addEventListener('click', zoomIn);
    document.getElementById('zoom-out').addEventListener('click', zoomOut);
    document.getElementById('zoom-reset').addEventListener('click', zoomReset);
    
    // スクロールでズーム
    canvasContainer.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    });
    
    // キーボードイベント
    document.addEventListener('keydown', function(e) {
        // Macのcommandキー (metaKey) または Windowsのctrlキー (ctrlKey)
        if (e.metaKey || e.ctrlKey) {
            currentState.commandKeyPressed = true;
            canvas.style.cursor = 'move';
            
            // Undo (Cmd+Z / Ctrl+Z)
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            
            // Redo (Cmd+Shift+Z / Ctrl+Shift+Z) または (Cmd+Y / Ctrl+Y)
            if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                e.preventDefault();
                redo();
            }
            
            // 保存 (Cmd+S / Ctrl+S)
            if (e.key === 's') {
                e.preventDefault();
                saveData();
            }
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (e.key === 'Meta' || e.key === 'Control') {
            currentState.commandKeyPressed = false;
            canvas.style.cursor = 'crosshair';
        }
    });
    
    // ウィンドウリサイズイベント
    window.addEventListener('resize', function() {
        updateCanvasPosition();
    });
    
    // 初期履歴の追加
    addHistoryState([]);
});