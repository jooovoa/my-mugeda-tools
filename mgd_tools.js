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
        const self = this;
        console.log("正在尝试查找元件: " + containerName);
        
        mugeda.addEventListener("renderready", function() {
            const scene = mugeda.currentScene;
            const container = scene.getObjectByName(containerName);
            
            if (!container) {
                console.error("找不到名为 '" + containerName + "' 的元件，请确认木疙瘩里的名称！");
                return;
            }

            console.log("成功找到元件，开始挂载 Canvas");

            const canvas = document.createElement('canvas');
            canvas.width = container.width;
            canvas.height = container.height;
            Object.assign(canvas.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                zIndex: '9999',
                backgroundColor: 'rgba(173, 216, 230, 0.2)' // 调试用浅蓝色背景
            });
            container.dom.appendChild(canvas);
            
            self.run(canvas, scene);
        });
    },

    run: function(canvas, scene) {
        const ctx = canvas.getContext('2d');
        const { cols, rows, assets } = this.config;
        const size = canvas.width / cols;
        let grid = [];
        let selected = null;
        let isAnimating = false;

        const images = assets.map(src => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;
            return img;
        });

        function initGrid() {
            for (let r = 0; r < rows; r++) {
                grid[r] = [];
                for (let c = 0; c < cols; c++) {
                    grid[r][c] = { type: Math.floor(Math.random() * assets.length), alpha: 1 };
                }
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 绘制网格辅助线
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            for(let i=0; i<=cols; i++) {
                ctx.beginPath(); ctx.moveTo(i*size, 0); ctx.lineTo(i*size, canvas.height); ctx.stroke();
            }
            for(let i=0; i<=rows; i++) {
                ctx.beginPath(); ctx.moveTo(0, i*size); ctx.lineTo(canvas.width, i*size); ctx.stroke();
            }

            grid.forEach((row, r) => {
                row.forEach((item, c) => {
                    if (item.alpha > 0) {
                        const img = images[item.type];
                        if (img.complete) {
                            ctx.drawImage(img, c * size + 5, r * size + 5, size - 10, size - 10);
                        }
                    }
                });
            });
            requestAnimationFrame(draw);
        }

        initGrid();
        draw();
    }
};

if (typeof mugeda !== 'undefined') {
    Match3Engine.init(mugeda, 'gamearea');
}