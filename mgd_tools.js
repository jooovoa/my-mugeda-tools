/** * TEST_VERSION_1.1 - 确认文件名: mgd_tools.js
 * 如果你在浏览器看到这行，说明路径完全正确！
 */

const Match3Engine = {
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
        console.log("Match3Engine: 正在通过 mgd_tools.js 初始化...");
        
        const setup = () => {
            const scene = mugeda.currentScene;
            const container = scene.getObjectByName(containerName);
            
            if (!container) {
                console.warn("Match3Engine: 找不到元件 '" + containerName + "'，正在等待木疙瘩加载...");
                setTimeout(setup, 800);
                return;
            }

            // 防止重复创建
            if (container.dom.querySelector('canvas')) return;

            const canvas = document.createElement('canvas');
            canvas.width = container.width;
            canvas.height = container.height;
            Object.assign(canvas.style, {
                position: 'absolute', 
                top: '0', 
                left: '0', 
                zIndex: '999',
                backgroundColor: '#f9f9f9', 
                pointerEvents: 'auto'
            });
            container.dom.appendChild(canvas);
            
            console.log("Match3Engine: 画布已挂载到 " + containerName);
            this.run(canvas, scene);
        };

        mugeda.addEventListener("renderready", setup);
        if (mugeda.isRenderReady) setup();
    },

    run: function(canvas, scene) {
        const ctx = canvas.getContext('2d');
        const { cols, rows, assets } = this.config;
        const size = canvas.width / cols;
        let grid = [];
        
        const images = assets.map(src => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            return img;
        });

        // 初始化棋盘
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                grid[r][c] = { type: Math.floor(Math.random() * assets.length) };
            }
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            grid.forEach((row, r) => {
                row.forEach((item, c) => {
                    const img = images[item.type];
                    if (img.complete) {
                        ctx.drawImage(img, c * size + 5, r * size + 5, size - 10, size - 10);
                    }
                });
            });
            requestAnimationFrame(draw);
        };
        draw();
    }
};

// 这里的 'gamearea' 必须和你在木疙瘩右侧属性栏填写的“名称”完全一致
if (typeof mugeda !== 'undefined') {
    Match3Engine.init(mugeda, 'gamearea');
}