document.addEventListener('DOMContentLoaded', function() {
    // キャンバスの設定
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    
    // 状態管理
    let currentState = {
        mode: 'add', // 新機能: 'add', 'delete', 'renumber'のいずれか
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
        commandKeyPressed: false,
        hoveredAnnotationIndex: -1,  // 新機能: マウスホバー中の矩形インデックス
        selectedAnnotations: [],      // 新機能: 選択された矩形インデックスの配列
        lastAssignedId: 0            // 新機能: 最後に割り当てたID
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
    
    // 新機能: モード選択ボタンの設定
    document.querySelectorAll('.mode-btn').forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            setMode(mode);
        });
    });
    
    // 新機能: モード切替機能
    function setMode(mode) {
        // 前のモードの状態をクリア
        currentState.selecting = false;
        currentState.hoveredAnnotationIndex = -1;
        currentState.selectedAnnotations = [];
        currentState.lastAssignedId = 0;
        
        // 削除・番号振り直しモード用のボタンの表示/非表示
        if (mode === 'add') {
            document.getElementById('mode-controls').style.display = 'none';
            document.getElementById('label-buttons').style.display = 'block';
        } else {
            document.getElementById('mode-controls').style.display = 'block';
            document.getElementById('label-buttons').style.display = 'none';
            
            // 番号振り直しモードの場合は、初期IDを設定
            if (mode === 'renumber') {
                currentState.lastAssignedId = 0;
                document.getElementById('ok-btn').style.display = 'inline';
                document.getElementById('highlight-btn').style.display = 'inline';
                document.getElementById('delete-btn').style.display = 'none';
            } else if (mode === 'delete') {
                document.getElementById('ok-btn').style.display = 'none';
                document.getElementById('highlight-btn').style.display = 'none';
                document.getElementById('delete-btn').style.display = 'inline';
            }
        }
        
        // モードボタンの選択状態更新
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('selected');
        
        // モードを設定
        currentState.mode = mode;
        
        // カーソルスタイルを更新
        updateCursorStyle();
        
        // ステータス更新
        updateStatus();
        
        // キャンバス再描画
        drawCanvas();
    }
    
    // カーソルスタイルの更新
    function updateCursorStyle() {
        if (currentState.commandKeyPressed) {
            canvas.style.cursor = 'move';
        } else if (currentState.mode === 'add') {
            if (currentState.selecting) {
                canvas.style.cursor = 'crosshair';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        } else {
            canvas.style.cursor = 'pointer';
        }
    }
    
    // ステータスの更新
    function updateStatus() {
        let statusText = '';
        
        switch (currentState.mode) {
            case 'add':
                if (currentState.selecting) {
                    statusText = "矩形選択中... (" + Math.round(currentState.currentX) + "," + Math.round(currentState.currentY) + ")";
                } else {
                    statusText = `選択中: ${data.labels[currentState.selectedLabelId]}`;
                }
                break;
            case 'delete':
                statusText = "削除モード: 削除する矩形をクリックしてください";
                if (currentState.selectedAnnotations.length > 0) {
                    statusText += ` (${currentState.selectedAnnotations.length}個選択中)`;
                }
                break;
            case 'renumber':
                statusText = "番号振り直しモード: 矩形を順番にクリックしてください";
                if (currentState.selectedAnnotations.length > 0) {
                    statusText += ` (${currentState.selectedAnnotations.length}/${data.annotation.length}個選択済)`;
                }
                break;
        }
        
        document.getElementById('status').textContent = statusText;
    }
    
    // ラベル選択
    document.querySelectorAll('.label-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (!currentState.selecting) {
                document.querySelectorAll('.label-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                this.classList.add('selected');
                currentState.selectedLabelId = parseInt(this.getAttribute('data-label-id'));
                updateStatus();
            }
        });
    });
    
    // 新機能: 削除ボタンの設定
    document.getElementById('delete-btn').addEventListener('click', function() {
        if (currentState.selectedAnnotations.length > 0) {
            // 選択された矩形を削除するために、元の配列からフィルタリング
            const newAnnotations = data.annotation.filter((_, index) => 
                !currentState.selectedAnnotations.includes(index)
            );
            
            // 履歴に追加
            addHistoryState(newAnnotations);
            
            // データを更新
            data.annotation = newAnnotations;
            
            // 選択をクリア
            currentState.selectedAnnotations = [];
            
            // ステータス更新
            updateStatus();
            
            // キャンバス再描画
            drawCanvas();
        }
    });
    
    // 新機能: OKボタンの設定
    document.getElementById('ok-btn').addEventListener('click', function() {
        if (currentState.mode === 'renumber') {
            if (currentState.selectedAnnotations.length < data.annotation.length) {
                // 警告表示
                alert(`すべての矩形が選択されていません。(${currentState.selectedAnnotations.length}/${data.annotation.length}個選択済)`);
                
                // 未選択の矩形を強調表示
                flashUnselectedRectangles();
            } else {
                // 番号振り直し完了
                const newAnnotations = [...data.annotation];
                
                // 履歴に追加
                addHistoryState(newAnnotations);
                
                // モードを元に戻す
                setMode('add');
            }
        }
    });
    
    // 新機能: キャンセルボタンの設定
    document.getElementById('cancel-btn').addEventListener('click', function() {
        setMode('add');
    });
    
    // 新機能: 未選択矩形の強調表示ボタン
    document.getElementById('highlight-btn').addEventListener('click', function() {
        flashUnselectedRectangles();
    });
    
    // 新機能: 未選択の矩形を一瞬強調表示
    function flashUnselectedRectangles() {
        const unselectedIndices = [];
        for (let i = 0; i < data.annotation.length; i++) {
            if (!currentState.selectedAnnotations.includes(i)) {
                unselectedIndices.push(i);
            }
        }
        
        if (unselectedIndices.length === 0) return;
        
        // フラッシュ用の状態保存
        const flashState = { indices: unselectedIndices, count: 0 };
        
        function flash() {
            flashState.count++;
            const isHighlight = flashState.count % 2 === 1;
            
            // 通常描画
            drawCanvas();
            
            // 未選択矩形の強調表示
            if (isHighlight) {
                flashState.indices.forEach(index => {
                    const anno = data.annotation[index];
                    const [x1, y1, x2, y2, x3, y3, x4, y4] = anno.polygon;
                    
                    ctx.fillStyle = "rgba(255, 165, 0, 0.5)"; // オレンジ色
                    ctx.strokeStyle = "rgb(255, 165, 0)";
                    ctx.lineWidth = 4;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y3);
                    ctx.lineTo(x4, y4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                });
            }
            
            if (flashState.count < 4) {
                setTimeout(flash, 200);
            }
        }
        
        flash();
    }
    
    // マウス座標をキャンバス座標に変換
    function getCanvasCoordinates(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        
        // クライアント座標からキャンバス表示領域内の相対座標を計算
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;
        
        // スケールのみを考慮して元の座標に変換
        const x = relativeX / currentState.scale;
        const y = relativeY / currentState.scale;
        
        return { x, y };
    }
    
    // 新機能: 座標が矩形の中にあるかチェック
    function isPointInRectangle(x, y, polygon) {
        const [x1, y1, x2, y2, x3, y3, x4, y4] = polygon;
        
        // 単純な軸並行矩形の場合
        const minX = Math.min(x1, x2, x3, x4);
        const maxX = Math.max(x1, x2, x3, x4);
        const minY = Math.min(y1, y2, y3, y4);
        const maxY = Math.max(y1, y2, y3, y4);
        
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
    
    // 新機能: マウス位置から矩形を検索
    function findRectangleAtPosition(x, y) {
        for (let i = 0; i < data.annotation.length; i++) {
            if (isPointInRectangle(x, y, data.annotation[i].polygon)) {
                return i;
            }
        }
        return -1;
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
        
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        
        switch (currentState.mode) {
            case 'add':
                if (!currentState.selecting) {
                    // 矩形選択開始
                    currentState.selecting = true;
                    currentState.startX = coords.x;
                    currentState.startY = coords.y;
                    currentState.currentX = coords.x;
                    currentState.currentY = coords.y;
                    
                    updateStatus();
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
                    if (currentState.mode === 'delete') {
                        // 削除モード: トグル選択
                        const selIndex = currentState.selectedAnnotations.indexOf(index);
                        if (selIndex === -1) {
                            currentState.selectedAnnotations.push(index);
                        } else {
                            currentState.selectedAnnotations.splice(selIndex, 1);
                        }
                    } else if (currentState.mode === 'renumber') {
                        // 番号振り直しモード: 選択済みでなければIDを割り当て
                        if (!currentState.selectedAnnotations.includes(index)) {
                            currentState.lastAssignedId++;
                            currentState.selectedAnnotations.push(index);
                            data.annotation[index].id = currentState.lastAssignedId;
                        }
                    }
                    updateStatus();
                    drawCanvas();
                }
                break;
        }
    });
    
    canvas.addEventListener('mousemove', function(e) {
        e.preventDefault();
        
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        
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
        
        switch (currentState.mode) {
            case 'add':
                if (currentState.selecting) {
                    currentState.currentX = coords.x;
                    currentState.currentY = coords.y;
                    updateStatus();
                    drawCanvas();
                }
                break;
                
            case 'delete':
            case 'renumber':
                // マウスホバー効果
                const index = findRectangleAtPosition(coords.x, coords.y);
                if (index !== currentState.hoveredAnnotationIndex) {
                    currentState.hoveredAnnotationIndex = index;
                    drawCanvas();
                }
                break;
        }
    });
    
    canvas.addEventListener('mouseup', function(e) {
        e.preventDefault();
        if (currentState.isDragging) {
            currentState.isDragging = false;
        }
    });
    
    // マウスがキャンバスから出た時のイベント
    canvas.addEventListener('mouseout', function(e) {
        if (currentState.hoveredAnnotationIndex !== -1) {
            currentState.hoveredAnnotationIndex = -1;
            drawCanvas();
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
            
            // 履歴管理に追加
            addHistoryState(newAnnotations);
            
            // データを更新
            data.annotation = newAnnotations;
            
            updateStatus();
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
        data.annotation.forEach((anno, index) => {
            const [x1, y1, x2, y2, x3, y3, x4, y4] = anno.polygon;
            
            const isSelected = currentState.selectedAnnotations.includes(index);
            const isHovered = currentState.hoveredAnnotationIndex === index;
            
            // 通常の色/ホバー時の色/選択時の色を決定
            let fillColor = colorMap[anno.label_id];
            let strokeColor = borderColorMap[anno.label_id];
            let lineWidth = 2;
            
            if (isHovered && (currentState.mode === 'delete' || currentState.mode === 'renumber')) {
                // ホバー時は少し明るく
                fillColor = colorMap[anno.label_id].replace('0.3', '0.5');
                lineWidth = 3;
            }
            
            if (isSelected) {
                // 選択時は強調
                if (currentState.mode === 'delete') {
                    strokeColor = "rgb(255, 0, 0)"; // 削除モードでは赤枠
                } else if (currentState.mode === 'renumber') {
                    strokeColor = "rgb(0, 128, 0)"; // 番号振り直しモードでは緑枠
                }
                lineWidth = 3;
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
            
            // 番号振り直しモードで選択済みの場合、IDを表示
            if (currentState.mode === 'renumber' && isSelected) {
                ctx.fillStyle = "white";
                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.font = "bold 14px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                const centerX = (x1 + x3) / 2;
                const centerY = (y1 + y3) / 2;
                
                // 背景円
                ctx.beginPath();
                ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // ID番号
                ctx.fillStyle = "black";
                ctx.fillText(anno.id.toString(), centerX, centerY);
            }
        });
        
        // 選択中の矩形を描画
        if (currentState.mode === 'add' && currentState.selecting) {
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
    
    // キャンバスの位置更新
    function updateCanvasPosition() {
        canvas.style.transform = `scale(${currentState.scale}) translate(${currentState.offsetX / currentState.scale}px, ${currentState.offsetY / currentState.scale}px)`;
        canvas.style.transformOrigin = '0 0';
    }
    
    // 履歴の追加
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
    
    // Undo操作
    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            data.annotation = JSON.parse(JSON.stringify(history[historyIndex]));
            drawCanvas();
            updateButtons();
            document.getElementById('status').textContent = "操作を元に戻しました";
        }
    }
    
    // Redo操作
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
            updateCursorStyle();
            
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
            updateCursorStyle();
        }
    });
    
    // ウィンドウリサイズイベント
    window.addEventListener('resize', function() {
        updateCanvasPosition();
    });
    
    // 初期履歴の追加
    addHistoryState([]);
    
    // 初期モードを設定
    setMode('add');
});