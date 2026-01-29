/**
 * 极简消消乐脚本
 * 只需要在舞台创建一个名为 'gamearea' 的矩形即可
 */

// 1. 核心游戏引擎 (通常这部分可以外置到服务器，但在木疙瘩内置脚本里也可以直接运行)
const Match3Engine = {
    init: function(mugeda, containerName) {
        mugeda.addEventListener("renderready", function() {
            const scene = mugeda.currentScene;
            const container = scene.getObjectByName(containerName);
            
            if (!container) {
                console.error("找不到元件: " + containerName);
                return;
            }

            // 创建画布
            const canvas = document.createElement('canvas');
            canvas.width = container.width;
            canvas.height = container.height;
            Object.assign(canvas.style, {
                position: 'absolute', top: '0', left: '0', zIndex: '999'
            });
            container.dom.appendChild(canvas);
            
            // 启动游戏逻辑
            Match3Engine.run(canvas);
        });
    },

    run: function(canvas) {
        const ctx = canvas.getContext('2d');
        const COLS = 6, ROWS = 8;
        const size = canvas.width / COLS;
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
        let grid = Array.from({length: ROWS}, () => 
            Array.from({length: COLS}, () => Math.floor(Math.random() * colors.length))
        );

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            grid.forEach((row, r) => {
                row.forEach((type, c) => {
                    ctx.fillStyle = colors[type];
                    // 绘制带圆角的水果方块
                    ctx.beginPath();
                    ctx.roundRect(c * size + 5, r * size + 5, size - 10, size - 10, 10);
                    ctx.fill();
                });
            });
            requestAnimationFrame(draw);
        }
        draw();
        
        // 简单的交互反馈
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / size);
            const y = Math.floor((e.clientY - rect.top) / size);
            console.log("点击了:", x, y, "颜色ID:", grid[y][x]);
            // 这里可以继续添加交换逻辑
        });
    }
};

// 2. 像那个博主一样的极简调用
// 只需要这一行，游戏就能跑起来！
Match3Engine.init(mugeda, 'gamearea');