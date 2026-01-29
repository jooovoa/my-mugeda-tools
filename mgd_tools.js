/** * 木疙瘩消消乐引擎 - v2.2 视觉增强版
 * 即使图片加载失败，也会显示彩色方块，确保画面不空白。
 */

window.Match3Engine = {
    config: {
        cols: 6,
        rows: 8,
        // 预设颜色，作为图片加载失败时的保底方案
        colors: ['#FF5252', '#FFEB3B', '#2196F3', '#4CAF50', '#9C27B0'],
        assets: [
            'https://cdn-icons-png.flaticon.com/128/415/415733.png',
            'https://cdn-icons-png.flaticon.com/128/3194/3194766.png',
            'https://cdn-icons-png.flaticon.com/128/2909/2909787.png',
            'https://cdn-icons-png.flaticon.com/128/2909/2909808.png',
            'https://cdn-icons-png.flaticon.com/128/2909/2909890.png'
        ]
    },

    init: function (mugeda, containerName) {
        console.log("%c [Match3Engine] 正在启动 v2.2...", "color: white; background: #E91E63; font-size: 14px;");

        const setup = () => {
            const scene = mugeda.currentScene;
            const container = scene.getObjectByName(containerName);

            if (!container) {
                console.warn("未找到元件: " + containerName);
                setTimeout(setup, 800);
                return;
            }

            // 获取尺寸，如果取不到则给一个默认值
            const w = container.width || 300;
            const h = container.height || 400;

            const oldCanvas = container.dom.querySelector('canvas');
            if (oldCanvas) oldCanvas.remove();

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;

            Object.assign(canvas.style, {
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '100%',
                height: '100%',
                zIndex: '9999',
                backgroundColor: '#FFF', // 强制背景为白，方便观察
                pointerEvents: 'auto'
            });

            container.dom.appendChild(canvas);
            this.run(canvas);
        };

        if (mugeda.isRenderReady) setup();
        else mugeda.addEventListener("renderready", setup);
    },

    run: function (canvas) {
        const ctx = canvas.getContext('2d');
        const { cols, rows, assets, colors } = this.config;
        const size = canvas.width / cols;

        let grid = [];
        let selected = null;
        let isProcessing = false;

        const images = assets.map(src => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            return img;
        });

        // 初始化棋盘
        const createGrid = () => {
            for (let r = 0; r < rows; r++) {
                grid[r] = [];
                for (let c = 0; c < cols; c++) {
                    grid[r][c] = {
                        type: Math.floor(Math.random() * assets.length),
                        alpha: 1
                    };
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 绘制一个淡灰色的网格背景，方便调试时看见边界
            ctx.strokeStyle = "#F0F0F0";
            for (let i = 0; i <= cols; i++) {
                ctx.beginPath(); ctx.moveTo(i * size, 0); ctx.lineTo(i * size, canvas.height); ctx.stroke();
            }

            grid.forEach((row, r) => {
                row.forEach((item, c) => {
                    if (item.alpha > 0) {
                        const x = c * size;
                        const y = r * size;

                        // 选中效果
                        if (selected && selected.r === r && selected.c === c) {
                            ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
                            ctx.fillRect(x, y, size, size);
                        }

                        const img = images[item.type];
                        if (img.complete && img.naturalWidth !== 0) {
                            // 图片加载成功，画图片
                            ctx.drawImage(img, x + 6, y + 6, size - 12, size - 12);
                        } else {
                            // 图片加载失败或还没加载好，画彩色圆圈保底
                            ctx.fillStyle = colors[item.type % colors.length];
                            ctx.beginPath();
                            ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                });
            });
            requestAnimationFrame(draw);
        };

        // 简化的点击交换逻辑
        canvas.addEventListener('mousedown', (e) => {
            if (isProcessing) return;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            const c = Math.floor(x / size);
            const r = Math.floor(y / (canvas.height / rows));

            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                if (!selected) {
                    selected = { r, c };
                } else {
                    const dist = Math.abs(r - selected.r) + Math.abs(c - selected.c);
                    if (dist === 1) {
                        // 交换位置
                        let t = grid[r][c].type;
                        grid[r][c].type = grid[selected.r][selected.c].type;
                        grid[selected.r][selected.c].type = t;
                    }
                    selected = null;
                }
            }
        });

        createGrid();
        draw();
    }
};