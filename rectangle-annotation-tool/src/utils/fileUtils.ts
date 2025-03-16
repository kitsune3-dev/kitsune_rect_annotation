/**
 * 画像ファイル読み込みなどのユーティリティ関数
 */

  // JSON形式でのデータ保存
  export const saveAsJson = (data: any, filename: string): void => {
    const outputData = JSON.stringify(data, null, 2);
    const blob = new Blob([outputData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };