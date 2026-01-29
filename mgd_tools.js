/** * 木疙瘩消消乐引擎 - v2.6 图片容错版
 * 即使图片路径错误，也会显示彩色方块，保证游戏可玩。
 */

window.Match3Engine = {
    config: {
        cols: 6,
        rows: 8,
        // --- 图片配置区 ---
        assets: [
            'https://jooovoa.github.io/my-mugeda-tools/images/1.png', 
            'https://jooovoa.github.io/my-mugeda-tools/images/2.png',
            'https://jooovoa.github.io/my-mugeda-tools/images/3.png',
            'https://jooovoa.github.io/my-mugeda-tools/images/4.png',
            'https://jooovoa.github.io/my-mugeda-tools/images/5.png'
        ],
        colors: ['#FF5252', '#FFEB3B', '#2196F3', '#4CAF50', '#9C27B0']
    },

    init: function(mugeda, containerName) {
        console.log("%c [Match3Engine] v2.6 启动中...", "color: white; background: #FF5722; font-size: 14px;");
        
        const setup = () => {
            const scene = mugeda.currentScene;
            const container = scene.getObjectByName(containerName);
            
            if (!container) {
                setTimeout(setup, 800);
                return;
            }

            const rect = container.dom.getBoundingClientRect();
            let existing = document.getElementById('mgd_match3_canvas');
            if (existing) existing.remove();

            const canvas = document.createElement('canvas');
            canvas.id = 'mgd_match3_canvas';
            canvas.width = container.width || rect.width || 320;
            canvas.height = container.height || rect.height || 480;
            
            Object.assign(canvas.style, {
                position: 'fixed',
                top: rect.top + 'px',
                left: rect.left + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px',
                zIndex: '999999',
                pointerEvents: 'auto',
                backgroundColor: '#FFF',
                border: '2px dashed #ccc'
            });
            
            document.body.appendChild(canvas);
            
            // 实时同步位置
            const sync = () => {
                const r = container.dom.getBoundingClientRect();
                canvas.style.top = r.top + 'px';
                canvas.style.left = r.left + 'px';
                if(document.getElementById('mgd_match3_canvas')) requestAnimationFrame(sync);
            };
            sync();

            this.run(canvas);
        };

        if (mugeda.isRenderReady) setup();
        else mugeda.addEventListener("renderready", setup);
    },

    run: function(canvas) {
        const ctx = canvas.getContext('2d');
        const { cols, rows, assets, colors } = this.config;
        const size = canvas.width / cols;
        
        let grid = [];
        let images = [];
        let selected = null;

        // 尝试加载图片，失败了也不怕
        assets.forEach((src, index) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            images[index] = img;
        });

        // 初始化棋盘
        const createGrid = () => {
            for (let r = 0; r < rows; r++) {
                grid[r] = [];
                for (let c = 0; c < cols; c++) {
                    grid[r][c] = { type: Math.floor(Math.random() * assets.length), alpha: 1 };
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            grid.forEach((row, r) => {
                row.forEach((item, c) => {
                    if (item.alpha <= 0) return;
                    const x = c * size;
                    const y = r * size;
                    const img = images[item.type];
                    
                    // 选中效果
                    if (selected && selected.r === r && selected.c === c) {
                        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
                        ctx.fillRect(x, y, size, size);
                    }

                    if (img.complete && img.naturalWidth !== 0) {
                        // 图片加载成功，画图
                        ctx.drawImage(img, x + 8, y + 8, size - 16, size - 16);
                    } else {
                        // 图片加载失败，画彩色圆圈，中间写个编号
                        ctx.fillStyle = colors[item.type % colors.length];
                        ctx.beginPath();
                        ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI*2);
                        ctx.fill();
                        ctx.fillStyle = "white";
                        ctx.textAlign = "center";
                        ctx.font = "bold 14px Arial";
                        ctx.fillText(item.type + 1, x + size/2, y + size/2 + 5);
                    }
                });
            });
            requestAnimationFrame(draw);
        };

        // 点击逻辑
        canvas.addEventListener('mousedown', (e) => {
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