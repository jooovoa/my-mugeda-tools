/** * 木疙瘩消消乐正式版引擎 - v2.1
 * 解决画面空白与层级问题
 */

window.Match3Engine = {
    config: {
        cols: 6,
        rows: 8,
        assets: [
            'https://cdn-icons-png.flaticon.com/128/415/415733.png',   // 西瓜
            'https://cdn-icons-png.flaticon.com/128/3194/3194766.png',  // 冰块
            'https://cdn-icons-png.flaticon.com/128/2909/2909787.png',  // 橙子
            'https://cdn-icons-png.flaticon.com/128/2909/2909808.png',  // 葡萄
            'https://cdn-icons-png.flaticon.com/128/2909/2909890.png'   // 梨
        ]
    },

    init: function(mugeda, containerName) {
        console.log("%c [Match3Engine] 正在深度检查容器状态...", "color: white; background: #2196F3; font-size: 14px;");
        
        const setup = () => {
            const scene = mugeda.currentScene;
            const container = scene.getObjectByName(containerName);
            
            if (!container) {
                console.warn("找不到元件: " + containerName + "，继续尝试...");
                setTimeout(setup, 500);
                return;
            }

            // 获取容器真实的宽高
            const width = container.width || container.dom.offsetWidth || 300;
            const height = container.height || container.dom.offsetHeight || 400;

            console.log("容器尺寸确认:", width, "x", height);

            // 如果已经存在画布则先清理
            const oldCanvas = container.dom.querySelector('canvas');
            if (oldCanvas) oldCanvas.remove();

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            // 核心修复：确保 Canvas 浮在最上层且充满容器
            Object.assign(canvas.style, {
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: width + 'px',
                height: height + 'px',
                zIndex: '10000',      // 极高层级
                backgroundColor: '#ffffff', // 强制白色背景防止透明
                pointerEvents: 'auto',
                display: 'block'
            });
            
            container.dom.appendChild(canvas);
            console.log("Canvas 已挂载，开始运行逻辑...");
            this.run(canvas, scene);
        };

        if (mugeda.isRenderReady) setup();
        else mugeda.addEventListener("renderready", setup);
    },

    run: function(canvas, scene) {
        const ctx = canvas.getContext('2d');
        const { cols, rows, assets } = this.config;
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

        const createGrid = () => {
            for (let r = 0; r < rows; r++) {
                grid[r] = [];
                for (let c = 0; c < cols; c++) {
                    let type;
                    do {
                        type = Math.floor(Math.random() * assets.length);
                    } while (
                        (c >= 2 && grid[r][c-1].type === type && grid[r][c-2].type === type) ||
                        (r >= 2 && grid[r-1][c].type === type && grid[r-2][c].type === type)
                    );
                    grid[r][c] = { type, alpha: 1 };
                }
            }
        };

        const findMatches = () => {
            let matches = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols - 2; c++) {
                    if (grid[r][c].type === grid[r][c+1].type && grid[r][c].type === grid[r][c+2].type) {
                        matches.push({r, c}, {r, c:c+1}, {r, c:c+2});
                    }
                }
            }
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows - 2; r++) {
                    if (grid[r][c].type === grid[r+1][c].type && grid[r][c].type === grid[r+2][c].type) {
                        matches.push({r, c}, {r:r+1, c}, {r:r+2, c});
                    }
                }
            }
            return matches;
        };

        const handleElimination = async () => {
            let matches = findMatches();
            if (matches.length === 0) {
                isProcessing = false;
                return;
            }

            matches.forEach(m => grid[m.r][m.c].alpha = 0);
            await new Promise(r => setTimeout(r, 200));

            for (let c = 0; c < cols; c++) {
                let empty = 0;
                for (let r = rows - 1; r >= 0; r--) {
                    if (grid[r][c].alpha === 0) empty++;
                    else if (empty > 0) {
                        grid[r+empty][c].type = grid[r][c].type;
                        grid[r+empty][c].alpha = 1;
                        grid[r][c].alpha = 0;
                    }
                }
                for (let i = 0; i < empty; i++) {
                    grid[i][c].type = Math.floor(Math.random() * assets.length);
                    grid[i][c].alpha = 1;
                }
            }
            setTimeout(handleElimination, 250);
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 绘制底色
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            grid.forEach((row, r) => {
                row.forEach((item, c) => {
                    if (item.alpha > 0) {
                        if (selected && selected.r === r && selected.c === c) {
                            ctx.fillStyle = "rgba(0, 150, 255, 0.2)";
                            ctx.fillRect(c * size, r * size, size, size);
                        }
                        const img = images[item.type];
                        if (img.complete) {
                            ctx.drawImage(img, c * size + 5, r * size + 5, size - 10, size - 10);
                        } else {
                            // 图片没加载出来时的占位
                            ctx.fillStyle = "#ddd";
                            ctx.beginPath();
                            ctx.arc(c * size + size/2, r * size + size/2, size/3, 0, Math.PI*2);
                            ctx.fill();
                        }
                    }
                });
            });
            requestAnimationFrame(draw);
        };

        canvas.addEventListener('mousedown', async (e) => {
            if (isProcessing) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const c = Math.floor(x / (rect.width / cols));
            const r = Math.floor(y / (rect.height / rows));

            if (!selected) {
                selected = { r, c };
            } else {
                const dist = Math.abs(r - selected.r) + Math.abs(c - selected.c);
                if (dist === 1) {
                    isProcessing = true;
                    let t1 = grid[r][c].type;
                    grid[r][c].type = grid[selected.r][selected.c].type;
                    grid[selected.r][selected.c].type = t1;
                    if (findMatches().length > 0) handleElimination();
                    else {
                        setTimeout(() => {
                            grid[selected.r][selected.c].type = grid[r][c].type;
                            grid[r][c].type = t1;
                            isProcessing = false;
                        }, 200);
                    }
                }
                selected = null;
            }
        });

        createGrid();
        draw();
    }
};