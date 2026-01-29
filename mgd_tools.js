/** * 木疙瘩消消乐引擎 - v2.3 终极可视化排查版
 * 专门解决“找到引擎但画面空白”的问题
 */

window.Match3Engine = {
    config: {
        cols: 6,
        rows: 8,
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
        console.log("%c [Match3Engine] 正在启动 v2.3 排查版...", "color: white; background: #000; font-size: 16px;");

        const setup = () => {
            const scene = mugeda.currentScene;
            const container = scene.getObjectByName(containerName);

            if (!container) {
                console.error("致命错误：舞台上没找到名为 " + containerName + " 的元件！");
                setTimeout(setup, 1000);
                return;
            }

            // 1. 强制确定宽高，解决 0 尺寸问题
            let w = container.width || container.dom.offsetWidth;
            let h = container.height || container.dom.offsetHeight;

            if (!w || w < 10) w = 320; // 保底宽度
            if (!h || h < 10) h = 500; // 保底高度

            console.log("最终确定的画布尺寸:", w, "x", h);

            const oldCanvas = container.dom.querySelector('canvas');
            if (oldCanvas) oldCanvas.remove();

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;

            // 2. 强制最高层级样式
            Object.assign(canvas.style, {
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: w + 'px',
                height: h + 'px',
                zIndex: '2147483647', // 最大整数，确保置顶
                backgroundColor: 'rgb(240, 240, 240)', // 淡灰色背景，确保你能看见它
                pointerEvents: 'auto',
                border: '2px solid red', // 加个红边框，如果看见红框说明 Canvas 出来了
                visibility: 'visible',
                display: 'block'
            });

            container.dom.appendChild(canvas);

            // 3. 在 Canvas 上先写一行字测试绘图功能
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "black";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("游戏正在加载图片...", w / 2, h / 2);

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
        let images = assets.map(src => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            return img;
        });

        // 初始化
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                grid[r][c] = { type: Math.floor(Math.random() * assets.length) };
            }
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 背景底色
            ctx.fillStyle = "#F5F5F5";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            grid.forEach((row, r) => {
                row.forEach((item, c) => {
                    const x = c * size;
                    const y = r * size;
                    const img = images[item.type];

                    if (img.complete && img.naturalWidth !== 0) {
                        ctx.drawImage(img, x + 5, y + 5, size - 10, size - 10);
                    } else {
                        // 保底圆圈
                        ctx.fillStyle = colors[item.type % colors.length];
                        ctx.beginPath();
                        ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            });
            requestAnimationFrame(draw);
        };

        draw();
    }
};