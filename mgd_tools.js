/**
 * 木疙瘩消消乐 v3.6 核弹级修复版
 * 修复点：
 * 1. 使用【全局坐标检测】代替元件点击，解决点击无反应的问题
 * 2. 双重启动机制，防止错过启动时机
 * 3. 屏幕上会显示【红色调试字】，告诉你具体哪一步卡住了
 */

(function() {
    // 创建一个屏幕调试框，直接告诉你程序运行状态
    var debugBox = document.createElement('div');
    debugBox.style.cssText = "position:fixed; top:0; left:0; background:rgba(0,0,0,0.7); color:#0f0; padding:10px; z-index:999999; font-size:12px; pointer-events:none; max-width:300px; word-wrap:break-word;";
    document.body.appendChild(debugBox);
    
    function log(msg) {
        console.log(msg);
        debugBox.innerHTML = msg + "<br/>" + debugBox.innerHTML;
    }
    
    log("脚本已注入，等待启动...");

    function startEngine() {
        log("尝试启动引擎...");
        
        var scene = mugeda.currentScene || mugeda.scene;
        if (!scene) {
            log("❌ 错误：无法获取场景对象");
            return;
        }

        var blocks = []; // 存储所有方块数据的数组
        var firstPick = null;
        var isProcessing = false;
        var maxFrames = 4;

        // --- 1. 暴力查找元件 ---
        var foundCount = 0;
        var colorPool = [];
        for(var p=0; p<16; p++) colorPool.push((p % maxFrames) + 1);
        colorPool.sort(function() { return 0.5 - Math.random(); });

        for (var i = 1; i <= 16; i++) {
            var name = "a" + i;
            var element = scene.getObjectByName(name);
            
            if (element) {
                foundCount++;
                var frame = colorPool.pop();
                setFrame(element, frame);
                element.alpha = 1;
                
                // 存入数组，方便后续根据坐标查找
                blocks.push({
                    id: i, // 1~16
                    name: name,
                    obj: element
                });
            } else {
                log("⚠️ 警告：找不到元件 " + name);
            }
        }

        if (foundCount === 0) {
            log("❌ 致命错误：一个元件都没找到！请检查元件名称是否为 a1~a16");
            return;
        }

        log("✅ 初始化成功！找到 " + foundCount + " 个方块。<br>请点击方块尝试。");

        // --- 2. 全局点击监听 (解决点击失效的核心) ---
        // 直接监听整个屏幕的点击，然后计算点到了谁
        document.addEventListener('mousedown', globalClickHandler);
        document.addEventListener('touchstart', globalClickHandler);

        function globalClickHandler(e) {
            if (isProcessing) return;

            // 获取点击坐标
            var clientX = e.clientX || (e.touches && e.touches[0].clientX);
            var clientY = e.clientY || (e.touches && e.touches[0].clientY);

            // 遍历所有方块，看点击位置在哪个方块的范围内
            var clickedBlock = null;
            
            for (var i = 0; i < blocks.length; i++) {
                var b = blocks[i];
                if (!b.obj.dom) continue;
                
                var rect = b.obj.dom.getBoundingClientRect();
                if (clientX >= rect.left && clientX <= rect.right && 
                    clientY >= rect.top && clientY <= rect.bottom) {
                    clickedBlock = b;
                    break;
                }
            }

            if (clickedBlock) {
                log("👇 点击了: " + clickedBlock.name);
                handleGameLogic(clickedBlock);
                // 阻止冒泡，防止触发其他无关事件
                e.stopPropagation(); 
                // e.preventDefault(); // 如果需要阻止滚动可取消注释
            }
        }

        // --- 3. 游戏核心逻辑 ---
        function handleGameLogic(blockWrapper) {
            var tile = blockWrapper.obj;
            var id = blockWrapper.id;

            if (tile.alpha < 0.1) return;

            if (!firstPick) {
                firstPick = { obj: tile, id: id };
                tile.alpha = 0.5; // 变半透明表示选中
                log("选中了第一个: " + id);
            } else if (firstPick.obj === tile) {
                tile.alpha = 1;
                firstPick = null;
                log("取消选中");
            } else {
                var second = tile;
                var id1 = firstPick.id;
                var id2 = id;

                // 4x4 矩阵相邻判断
                // id 是 1~16
                var r1 = Math.ceil(id1 / 4), c1 = (id1 - 1) % 4;
                var r2 = Math.ceil(id2 / 4), c2 = (id2 - 1) % 4;
                var isNext = Math.abs(id1 - id2) === 4 || (Math.abs(id1 - id2) === 1 && r1 === r2);

                if (isNext) {
                    log("🔄 尝试交换: " + id1 + " <-> " + id2);
                    isProcessing = true;
                    var f1 = getFrame(firstPick.obj);
                    var f2 = getFrame(second);

                    setFrame(firstPick.obj, f2);
                    setFrame(second, f1);

                    setTimeout(function() {
                        if (!checkAndRemove()) {
                            log("❌ 匹配失败，还原");
                            setFrame(firstPick.obj, f1);
                            setFrame(second, f2);
                            isProcessing = false;
                        } else {
                            log("✨ 匹配成功！");
                            setTimeout(function() {
                                applyGravity();
                                isProcessing = false;
                            }, 300);
                        }
                    }, 250);
                } else {
                    log("🚫 不相邻，无法交换");
                }

                firstPick.obj.alpha = 1;
                firstPick = null;
            }
        }

        // --- 辅助函数 ---
        function setFrame(obj, frame) {
            if (obj.scene && obj.scene.gotoAndStop) obj.scene.gotoAndStop(frame);
            else if (obj.gotoAndStop) obj.gotoAndStop(frame);
        }

        function getFrame(obj) {
            if (obj.scene && obj.scene.currentId !== undefined) return obj.scene.currentId;
            return obj.currentFrame || 1;
        }

        function checkAndRemove() {
            var toRemove = [];
            // 横向
            for (var r = 0; r < 4; r++) {
                for (var c = 1; c <= 2; c++) {
                    var start = r * 4 + c;
                    var b1 = scene.getObjectByName("a" + start);
                    var b2 = scene.getObjectByName("a" + (start + 1));
                    var b3 = scene.getObjectByName("a" + (start + 2));
                    if (isMatch(b1, b2, b3)) toRemove.push(b1, b2, b3);
                }
            }
            // 纵向
            for (var c = 1; c <= 4; c++) {
                for (var r = 0; r <= 1; r++) {
                    var start = r * 4 + c;
                    var b1 = scene.getObjectByName("a" + start);
                    var b2 = scene.getObjectByName("a" + (start + 4));
                    var b3 = scene.getObjectByName("a" + (start + 8));
                    if (isMatch(b1, b2, b3)) toRemove.push(b1, b2, b3);
                }
            }

            if (toRemove.length > 0) {
                toRemove.forEach(function(item) { item.alpha = 0; });
                return true;
            }
            return false;
        }

        function isMatch(o1, o2, o3) {
            if (!o1 || !o2 || !o3 || o1.alpha === 0 || o2.alpha === 0 || o3.alpha === 0) return false;
            return (getFrame(o1) === getFrame(o2) && getFrame(o1) === getFrame(o3));
        }

        function applyGravity() {
            var changed = false;
            for (var c = 1; c <= 4; c++) {
                for (var r = 3; r >= 0; r--) {
                    var current = scene.getObjectByName("a" + (r * 4 + c));
                    if (current && current.alpha === 0) {
                        var found = false;
                        for (var k = r - 1; k >= 0; k--) {
                            var above = scene.getObjectByName("a" + (k * 4 + c));
                            if (above && above.alpha !== 0) {
                                setFrame(current, getFrame(above));
                                current.alpha = 1;
                                above.alpha = 0;
                                changed = true;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            setFrame(current, Math.floor(Math.random() * maxFrames) + 1);
                            current.alpha = 1;
                            changed = true;
                        }
                    }
                }
            }
            if (changed) {
                setTimeout(function() {
                    if (checkAndRemove()) setTimeout(applyGravity, 300);
                }, 300);
            }
        }
    }

    // --- 双重启动保险 ---
    // 1. 如果舞台已经准备好了，直接跑
    if (mugeda.isRenderReady) {
        startEngine();
    } 
    // 2. 否则等待事件
    else {
        mugeda.addEventListener("renderready", startEngine);
    }

})();