/** * 木疙瘩消消乐引擎 - v3.0 原生元件版
 * 适配：使用舞台上已有的 a1~a16 元件进行逻辑控制
 */

window.Match3Engine = {
    // 对应你的 4 帧颜色：1:红, 2:绿, 3:黄, 4:蓝
    maxFrames: 4,
    
    init: function(mugeda) {
        console.log("%c [Match3Engine] v3.0 启动：操控原生元件 a1~a16", "color: white; background: #2196F3; font-size: 14px;");
        
        const setup = () => {
            const scene = mugeda.currentScene;
            const blocks = [];
            let selectedIndex = -1;

            // 1. 获取并初始化 16 个元件
            for (let i = 1; i <= 16; i++) {
                const name = 'a' + i;
                const obj = scene.getObjectByName(name);
                if (obj) {
                    // 随机跳到 1-4 帧中的一帧
                    const randomFrame = Math.floor(Math.random() * this.maxFrames) + 1;
                    obj.gotoAndStop(randomFrame);
                    
                    blocks.push({
                        id: i - 1,
                        name: name,
                        handle: obj,
                        frame: randomFrame
                    });

                    // 2. 绑定点击事件
                    obj.dom.style.cursor = 'pointer';
                    obj.dom.addEventListener('click', () => {
                        handleBlockClick(i - 1);
                    });
                } else {
                    console.warn("未找到元件: " + name);
                }
            }

            // 处理点击和交换逻辑
            const handleBlockClick = (index) => {
                if (selectedIndex === -1) {
                    // 第一次选中
                    selectedIndex = index;
                    // 给选中的增加点透明度反馈
                    blocks[index].handle.alpha = 0.5;
                } else {
                    const idx1 = selectedIndex;
                    const idx2 = index;
                    
                    // 恢复透明度
                    blocks[idx1].handle.alpha = 1;

                    if (idx1 === idx2) {
                        selectedIndex = -1;
                        return;
                    }

                    // 判断是否相邻（4x4 矩阵逻辑）
                    const r1 = Math.floor(idx1 / 4), c1 = idx1 % 4;
                    const r2 = Math.floor(idx2 / 4), c2 = idx2 % 4;
                    const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

                    if (isAdjacent) {
                        // 交换它们的帧（颜色）
                        const frame1 = blocks[idx1].handle.currentFrame;
                        const frame2 = blocks[idx2].handle.currentFrame;
                        
                        blocks[idx1].handle.gotoAndStop(frame2);
                        blocks[idx2].handle.gotoAndStop(frame1);
                        
                        console.log(`交换了 ${blocks[idx1].name} 和 ${blocks[idx2].name}`);
                        
                        // 可以在这里加入消除检测函数
                        checkMatches(blocks);
                    }
                    
                    selectedIndex = -1;
                }
            };

            // 简单的消除检测逻辑（检测 3 连）
            const checkMatches = (allBlocks) => {
                // 这里暂时只做交换，如果需要自动消除逻辑，可以在此扩展
                // 比如：如果 frame 一样，就一起跳到第 5 帧（空白帧）
            };
        };

        if (mugeda.isRenderReady) setup();
        else mugeda.addEventListener("renderready", setup);
    }
};