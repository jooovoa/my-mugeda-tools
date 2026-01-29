/** * VERSION_FINAL_DEBUG - 2026/01/30
 * 如果你在浏览器能看到这行，说明 Push 成功了！
 */

window.Match3Engine = {
    config: {
        cols: 6,
        rows: 8,
        assets: [
            'https://cdn-icons-png.flaticon.com/128/415/415733.png',
            'https://cdn-icons-png.flaticon.com/128/3194/3194766.png',
            'https://cdn-icons-png.flaticon.com/128/2909/2909787.png',
            'https://cdn-icons-png.flaticon.com/128/2909/2909808.png',
            'https://cdn-icons-png.flaticon.com/128/2909/2909890.png'
        ]
    },

    init: function(mugeda, containerName) {
        console.log("%c [Match3Engine] 引擎正在启动...", "color: white; background: green; font-size: 20px;");
        
        const setup = () => {
            const scene = mugeda.currentScene;
            const container = scene.getObjectByName(containerName);
            
            if (!container) {
                console.warn("找不到元件: " + containerName + "，正在重试...");
                setTimeout(setup, 1000);
                return;
            }

            // 强制改变背景色，证明脚本已接管
            container.dom.style.backgroundColor = "lightgreen";

            const canvas = document.createElement('canvas');
            canvas.width = container.width;
            canvas.height = container.height;
            Object.assign(canvas.style, {
                position: 'absolute', top: '0', left: '0', zIndex: '999',
                pointerEvents: 'auto'
            });
            container.dom.appendChild(canvas);
            
            this.run(canvas, scene);
        };

        if (mugeda.isRenderReady) setup();
        else mugeda.addEventListener("renderready", setup);
    },

    run: function(canvas, scene) {
        const ctx = canvas.getContext('2d');
        const { cols, rows, assets } = this.config;
        const size = canvas.width / cols;
        let grid = Array.from({length: rows}, () => 
            Array.from({length: cols}, () => ({ type: Math.floor(Math.random() * assets.length) }))
        );

        const images = assets.map(src => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            return img;
        });

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            grid.forEach((row, r) => {
                row.forEach((item, c) => {
                    const img = images[item.type];
                    if (img.complete) ctx.drawImage(img, c * size + 5, r * size + 5, size - 10, size - 10);
                });
            });
            requestAnimationFrame(draw);
        };
        draw();
    }
};

console.log("mgd_tools.js 已在全局 window 环境挂载 Match3Engine");