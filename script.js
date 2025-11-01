
        // ============================================
        // NEUROGRID: PATTERN FUSION - HD PREMIUM
        // Y8.com Professional Quality Standards
        // ============================================

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        // HD Resolution with perfect scaling
        const GAME_WIDTH = 960;
        const GAME_HEIGHT = 640;
        const DPR = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = GAME_WIDTH * DPR;
        canvas.height = GAME_HEIGHT * DPR;
        canvas.style.width = GAME_WIDTH + 'px';
        canvas.style.height = GAME_HEIGHT + 'px';
        ctx.scale(DPR, DPR);

        // Enable crisp rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // ============================================
        // GAME STATE
        // ============================================
        const game = {
            state: 'menu',
            score: 0,
            level: 1,
            timeLeft: 60,
            maxTime: 60,
            targetPattern: null,
            targetValue: 0,
            numbers: [],
            particles: [],
            stars: [],
            nebula: [],
            highScore: parseInt(localStorage.getItem('neuroGridHD_HighScore')) || 0,
            combo: 0,
            maxCombo: 0,
            totalCorrect: 0,
            totalWrong: 0,
            gridPulse: 0,
            lastFrameTime: 0,
            animations: [],
            buttons: {},
            hoverButton: null,
            backgroundOffset: 0,
            energyPulse: 0
        };

        const PATTERNS = {
            SUM: 'sum',
            PRODUCT: 'product',
            EVEN: 'even',
            ODD: 'odd',
            GREATER: 'greater',
            SEQUENCE: 'sequence'
        };

        // ============================================
        // COLOR PALETTE (Y8 Premium Style)
        // ============================================
        const COLORS = {
            primary: '#00E5FF',
            secondary: '#00FFA3',
            accent: '#FF6B9D',
            warning: '#FFB700',
            danger: '#FF3D71',
            success: '#00FF88',
            dark: '#0A0E27',
            darkBlue: '#1A1F40',
            glow: 'rgba(0, 229, 255, 0.5)',
            white: '#FFFFFF'
        };

        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        function randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function lerp(start, end, t) {
            return start + (end - start) * t;
        }

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function easeOutElastic(t) {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }

        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        // ============================================
        // INITIALIZE BACKGROUND
        // ============================================
        function initBackground() {
            // Stars
            for (let i = 0; i < 200; i++) {
                game.stars.push({
                    x: Math.random() * GAME_WIDTH,
                    y: Math.random() * GAME_HEIGHT,
                    size: Math.random() * 2.5,
                    speed: Math.random() * 0.3 + 0.1,
                    opacity: Math.random() * 0.8 + 0.2,
                    twinkle: Math.random() * Math.PI * 2
                });
            }

            // Nebula particles
            for (let i = 0; i < 50; i++) {
                game.nebula.push({
                    x: Math.random() * GAME_WIDTH,
                    y: Math.random() * GAME_HEIGHT,
                    size: randomInt(80, 200),
                    opacity: Math.random() * 0.03 + 0.01,
                    speed: Math.random() * 0.05 + 0.02,
                    hue: randomInt(180, 220)
                });
            }
        }

        // ============================================
        // ANIMATION SYSTEM
        // ============================================
        function addAnimation(type, data) {
            game.animations.push({
                type: type,
                startTime: performance.now(),
                duration: data.duration || 500,
                data: data
            });
        }

        function updateAnimations(currentTime) {
            game.animations = game.animations.filter(anim => {
                const elapsed = currentTime - anim.startTime;
                const progress = Math.min(elapsed / anim.duration, 1);
                const eased = easeOutCubic(progress);
                
                if (anim.type === 'scorePopup') {
                    anim.data.y -= 1.5;
                    anim.data.opacity = 1 - progress;
                    anim.data.scale = 1 + eased * 0.5;
                    return progress < 1;
                }
                
                if (anim.type === 'comboFlash') {
                    anim.data.scale = 1 + Math.sin(progress * Math.PI) * 0.5;
                    anim.data.opacity = 1 - progress;
                    return progress < 1;
                }
                
                if (anim.type === 'numberPop') {
                    const t = easeOutElastic(progress);
                    anim.data.number.scale = lerp(0, 1, t);
                    return progress < 1;
                }
                
                if (anim.type === 'shockwave') {
                    anim.data.radius += 15;
                    anim.data.opacity = 1 - progress;
                    return progress < 1;
                }
                
                return progress < 1;
            });
        }

        // ============================================
        // GAME LOGIC
        // ============================================
        function generatePuzzle() {
            game.numbers = [];
            
            const difficulty = Math.min(game.level, 15);
            const patterns = [PATTERNS.SUM, PATTERNS.EVEN, PATTERNS.ODD, PATTERNS.GREATER];
            
            if (difficulty > 2) patterns.push(PATTERNS.PRODUCT);
            if (difficulty > 5) patterns.push(PATTERNS.SEQUENCE);
            
            game.targetPattern = patterns[randomInt(0, patterns.length - 1)];

            const gridCols = 4;
            const gridRows = 3;
            const startX = 220;
            const startY = 220;
            const spacingX = 175;
            const spacingY = 135;

            const maxNum = Math.min(12 + difficulty * 2, 35);

            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    let value;
                    
                    switch(game.targetPattern) {
                        case PATTERNS.SUM:
                            game.targetValue = randomInt(20 + difficulty * 2, 40 + difficulty * 3);
                            value = randomInt(2, maxNum);
                            break;
                        case PATTERNS.PRODUCT:
                            const products = [12, 18, 20, 24, 30, 36, 40, 48, 60, 72];
                            game.targetValue = products[randomInt(0, Math.min(difficulty - 1, products.length - 1))];
                            value = randomInt(2, 10);
                            break;
                        case PATTERNS.EVEN:
                            game.targetValue = 3 + Math.floor(difficulty / 4);
                            value = randomInt(1, maxNum);
                            break;
                        case PATTERNS.ODD:
                            game.targetValue = 3 + Math.floor(difficulty / 4);
                            value = randomInt(1, maxNum);
                            break;
                        case PATTERNS.GREATER:
                            game.targetValue = 12 + difficulty * 2;
                            value = randomInt(1, maxNum + 8);
                            break;
                        case PATTERNS.SEQUENCE:
                            game.targetValue = 4;
                            value = randomInt(1, 20);
                            break;
                    }
                    
                    const num = {
                        value: value,
                        x: startX + col * spacingX,
                        y: startY + row * spacingY,
                        selected: false,
                        scale: 0,
                        rotation: 0,
                        pulsePhase: Math.random() * Math.PI * 2,
                        glowIntensity: 0
                    };
                    
                    game.numbers.push(num);
                    addAnimation('numberPop', { 
                        number: num, 
                        duration: 400 + (row * gridCols + col) * 40 
                    });
                }
            }
        }

        function checkSolution() {
            const selected = game.numbers.filter(n => n.selected);
            if (selected.length === 0) return false;

            let correct = false;

            switch(game.targetPattern) {
                case PATTERNS.SUM:
                    const sum = selected.reduce((acc, n) => acc + n.value, 0);
                    correct = sum === game.targetValue;
                    break;

                case PATTERNS.PRODUCT:
                    const product = selected.reduce((acc, n) => acc * n.value, 1);
                    correct = product === game.targetValue;
                    break;

                case PATTERNS.EVEN:
                    correct = selected.length === game.targetValue && 
                              selected.every(n => n.value % 2 === 0);
                    break;

                case PATTERNS.ODD:
                    correct = selected.length === game.targetValue && 
                              selected.every(n => n.value % 2 !== 0);
                    break;

                case PATTERNS.GREATER:
                    correct = selected.length >= 3 && 
                              selected.every(n => n.value > game.targetValue);
                    break;

                case PATTERNS.SEQUENCE:
                    if (selected.length === game.targetValue) {
                        const values = selected.map(n => n.value).sort((a, b) => a - b);
                        correct = values.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1);
                    }
                    break;
            }

            return correct;
        }

        function submitAnswer() {
            const selected = game.numbers.filter(n => n.selected);
            if (selected.length === 0) return;

            if (checkSolution()) {
                // CORRECT!
                const basePoints = 150;
                const comboBonus = game.combo * 40;
                const speedBonus = Math.floor((game.timeLeft / game.maxTime) * 80);
                const levelBonus = game.level * 10;
                const totalPoints = basePoints + comboBonus + speedBonus + levelBonus;
                
                game.score += totalPoints;
                game.combo++;
                game.totalCorrect++;
                game.maxCombo = Math.max(game.maxCombo, game.combo);
                game.timeLeft = Math.min(game.timeLeft + 6, game.maxTime);
                
                // Visual feedback
                selected.forEach(n => {
                    createParticleExplosion(n.x, n.y, COLORS.primary, 30);
                    createParticleExplosion(n.x, n.y, COLORS.secondary, 20);
                    addAnimation('shockwave', { x: n.x, y: n.y, radius: 0, opacity: 1, duration: 600 });
                });
                
                addAnimation('scorePopup', {
                    x: GAME_WIDTH / 2,
                    y: 160,
                    text: `+${totalPoints}`,
                    opacity: 1,
                    scale: 1,
                    duration: 1200
                });
                
                if (game.combo > 1) {
                    addAnimation('comboFlash', {
                        x: 150,
                        y: 120,
                        scale: 1,
                        opacity: 1,
                        duration: 600
                    });
                }
                
                playSound('success', Math.min(game.combo, 5));
                
                // Level progression
                const newLevel = Math.floor(game.score / 800) + 1;
                if (newLevel > game.level) {
                    game.level = newLevel;
                    game.maxTime = Math.max(45, 65 - game.level * 2);
                    createLevelUpEffect();
                }
                
                setTimeout(() => generatePuzzle(), 250);
            } else {
                // WRONG!
                game.combo = 0;
                game.totalWrong++;
                game.timeLeft = Math.max(game.timeLeft - 5, 0);
                
                selected.forEach(n => {
                    createParticleExplosion(n.x, n.y, COLORS.danger, 20);
                    n.selected = false;
                    n.scale = 0.8;
                });
                
                playSound('error');
                game.numbers.forEach(n => n.selected = false);
            }
        }

        function startGame() {
            game.state = 'playing';
            game.score = 0;
            game.level = 1;
            game.timeLeft = 60;
            game.maxTime = 60;
            game.combo = 0;
            game.maxCombo = 0;
            game.totalCorrect = 0;
            game.totalWrong = 0;
            game.lastFrameTime = performance.now();
            generatePuzzle();
        }

        function createLevelUpEffect() {
            for (let i = 0; i < 80; i++) {
                setTimeout(() => {
                    const x = Math.random() * GAME_WIDTH;
                    const y = Math.random() * GAME_HEIGHT;
                    createParticleExplosion(x, y, [COLORS.primary, COLORS.secondary, COLORS.warning][randomInt(0, 2)], 5);
                }, i * 15);
            }
            playSound('levelup');
        }

        // ============================================
        // PARTICLE SYSTEM
        // ============================================
        function createParticleExplosion(x, y, color, count) {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
                const speed = randomInt(3, 8);
                game.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    color: color,
                    size: randomInt(4, 10),
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.3,
                    gravity: 0.2
                });
            }
        }

        function updateParticles(dt) {
            game.particles.forEach(p => {
                p.x += p.vx * dt * 60;
                p.y += p.vy * dt * 60;
                p.vy += p.gravity;
                p.rotation += p.rotationSpeed;
                p.life -= dt * 1.2;
                p.vx *= 0.98;
                p.vy *= 0.98;
            });
            game.particles = game.particles.filter(p => p.life > 0);
        }

        // ============================================
        // AUDIO SYSTEM
        // ============================================
        let audioContext = null;

        function initAudio() {
            if (!audioContext) {
                try {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch(e) {}
            }
        }

        function playSound(type, intensity = 1) {
            try {
                initAudio();
                if (!audioContext) return;
                
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const now = audioContext.currentTime;
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.type = 'sine';
                
                if (type === 'success') {
                    const baseFreq = 440 + (intensity * 40);
                    oscillator.frequency.setValueAtTime(baseFreq, now);
                    oscillator.frequency.setValueAtTime(baseFreq * 1.25, now + 0.07);
                    oscillator.frequency.setValueAtTime(baseFreq * 1.5, now + 0.14);
                    gainNode.gain.setValueAtTime(0.15, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    oscillator.start(now);
                    oscillator.stop(now + 0.35);
                } else if (type === 'error') {
                    oscillator.frequency.setValueAtTime(200, now);
                    oscillator.frequency.setValueAtTime(100, now + 0.15);
                    gainNode.gain.setValueAtTime(0.2, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    oscillator.start(now);
                    oscillator.stop(now + 0.3);
                } else if (type === 'click') {
                    oscillator.frequency.setValueAtTime(500, now);
                    gainNode.gain.setValueAtTime(0.1, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    oscillator.start(now);
                    oscillator.stop(now + 0.1);
                } else if (type === 'levelup') {
                    oscillator.frequency.setValueAtTime(350, now);
                    oscillator.frequency.setValueAtTime(500, now + 0.1);
                    oscillator.frequency.setValueAtTime(700, now + 0.2);
                    oscillator.frequency.setValueAtTime(900, now + 0.3);
                    gainNode.gain.setValueAtTime(0.18, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                    oscillator.start(now);
                    oscillator.stop(now + 0.5);
                }
            } catch (e) {}
        }

        // ============================================
        // DRAWING FUNCTIONS
        // ============================================
        function drawBackground() {
            // Deep space gradient
            const gradient = ctx.createRadialGradient(
                GAME_WIDTH / 2, GAME_HEIGHT / 2, 0,
                GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH
            );
            gradient.addColorStop(0, '#0F1535');
            gradient.addColorStop(0.5, '#0A0E27');
            gradient.addColorStop(1, '#050711');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Nebula clouds
            game.nebula.forEach(cloud => {
                cloud.y += cloud.speed;
                cloud.x += Math.sin(game.gridPulse + cloud.y * 0.01) * 0.3;
                
                if (cloud.y > GAME_HEIGHT + cloud.size) {
                    cloud.y = -cloud.size;
                    cloud.x = Math.random() * GAME_WIDTH;
                }
                
                const nebulaGradient = ctx.createRadialGradient(
                    cloud.x, cloud.y, 0,
                    cloud.x, cloud.y, cloud.size
                );
                nebulaGradient.addColorStop(0, `hsla(${cloud.hue}, 100%, 60%, ${cloud.opacity})`);
                nebulaGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = nebulaGradient;
                ctx.fillRect(cloud.x - cloud.size, cloud.y - cloud.size, cloud.size * 2, cloud.size * 2);
            });

            // Stars with twinkle
            game.stars.forEach(star => {
                star.y += star.speed;
                if (star.y > GAME_HEIGHT) {
                    star.y = 0;
                    star.x = Math.random() * GAME_WIDTH;
                }
                
                star.twinkle += 0.05;
                const twinkleOpacity = star.opacity * (0.7 + Math.sin(star.twinkle) * 0.3);
                
                ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
                ctx.shadowBlur = star.size * 2;
                ctx.shadowColor = `rgba(255, 255, 255, ${twinkleOpacity})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.shadowBlur = 0;

            // Energy grid
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.05 + Math.sin(game.gridPulse) * 0.02})`;
            ctx.lineWidth = 1;
            const gridSize = 60;
            
            for (let i = 0; i < GAME_WIDTH; i += gridSize) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, GAME_HEIGHT);
                ctx.stroke();
            }
            
            for (let i = 0; i < GAME_HEIGHT; i += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(GAME_WIDTH, i);
                ctx.stroke();
            }

            game.gridPulse += 0.02;
            game.energyPulse += 0.03;
        }

        function drawGlowText(text, x, y, size, color, glowColor, align = 'center', weight = 'bold') {
            ctx.save();
            ctx.font = `${weight} ${size}px Arial, sans-serif`;
            ctx.textAlign = align;
            ctx.textBaseline = 'middle';
            
            // Outer glow
            ctx.shadowBlur = 25;
            ctx.shadowColor = glowColor;
            ctx.fillStyle = glowColor;
            ctx.fillText(text, x, y);
            
            // Inner glow
            ctx.shadowBlur = 15;
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        function drawPanel(x, y, w, h, alpha = 0.85) {
            ctx.save();
            
            // Panel shadow
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            
            // Panel background gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + h);
            gradient.addColorStop(0, `rgba(26, 31, 64, ${alpha})`);
            gradient.addColorStop(1, `rgba(10, 14, 39, ${alpha})`);
            ctx.fillStyle = gradient;
            
            roundRect(ctx, x, y, w, h, 15);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = `rgba(0, 229, 255, 0.4)`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Inner highlight
            ctx.strokeStyle = `rgba(0, 229, 255, 0.15)`;
            ctx.lineWidth = 1;
            roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 13);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        function drawButton(id, x, y, w, h, text, color, icon = '') {
            game.buttons[id] = { x, y, w, h };
            
            const isHover = game.hoverButton === id;
            const scale = isHover ? 1.08 : 1;
            const actualW = w * scale;
            const actualH = h * scale;
            const actualX = x - (actualW - w) / 2;
            const actualY = y - (actualH - h) / 2;
            
            ctx.save();
            
            // Button shadow
            ctx.shadowBlur = isHover ? 40 : 25;
            ctx.shadowColor = color === COLORS.success ? 'rgba(0, 255, 136, 0.6)' : 'rgba(0, 229, 255, 0.6)';
            
            // Button gradient
            const gradient = ctx.createLinearGradient(actualX, actualY, actualX, actualY + actualH);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, darkenColor(color, 0.4));
            ctx.fillStyle = gradient;
            
            roundRect(ctx, actualX, actualY, actualW, actualH, 15);
            ctx.fill();
            
            // Glossy overlay
            const glossGradient = ctx.createLinearGradient(actualX, actualY, actualX, actualY + actualH / 2);
            glossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
            glossGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glossGradient;
            roundRect(ctx, actualX, actualY, actualW, actualH / 2, 15);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = isHover ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            roundRect(ctx, actualX, actualY, actualW, actualH, 15);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            
            // Button text
            ctx.fillStyle = '#001122';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon + text, actualX + actualW / 2, actualY + actualH / 2);
            
            ctx.restore();
        }

        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }

        function darkenColor(color, amount) {
            if (color.startsWith('#')) {
                const hex = color.replace('#', '');
                const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - amount));
                const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - amount));
                const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - amount));
                return `rgb(${r}, ${g}, ${b})`;
            }
            return color;
        }

        function drawMenu() {
            drawBackground();

            // Floating title animation
            const titleY = 120 + Math.sin(game.gridPulse * 1.5) * 8;
            
            // Main title
            drawGlowText('NEUROGRID', GAME_WIDTH / 2, titleY, 78, COLORS.primary, COLORS.primary);
            
            // Subtitle
            const subtitleGradient = ctx.createLinearGradient(0, titleY + 60, 0, titleY + 80);
            subtitleGradient.addColorStop(0, COLORS.secondary);
            subtitleGradient.addColorStop(1, COLORS.primary);
            ctx.fillStyle = subtitleGradient;
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 20;
            ctx.shadowColor = COLORS.secondary;
            ctx.fillText('PATTERN FUSION', GAME_WIDTH / 2, titleY + 70);
            ctx.shadowBlur = 0;

            // High score panel
            drawPanel(GAME_WIDTH / 2 - 200, 230, 400, 80);
            drawGlowText('HIGH SCORE', GAME_WIDTH / 2, 250, 20, '#AABBCC', COLORS.primary);
            drawGlowText(game.highScore.toString(), GAME_WIDTH / 2, 285, 36, COLORS.primary, COLORS.primary);

            // Start button
            drawButton('start', GAME_WIDTH / 2 - 150, 340, 300, 85, 'START GAME', COLORS.success, '▶ ');

            // Features panel
            drawPanel(GAME_WIDTH / 2 - 300, 460, 600, 140, 0.6);
            
            ctx.fillStyle = COLORS.white;
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'left';
            
            const features = [
                { icon: '🎯', text: 'Match patterns & solve puzzles', x: GAME_WIDTH / 2 - 260, y: 490 },
                { icon: '⚡', text: 'Build combos for massive scores', x: GAME_WIDTH / 2 - 260, y: 530 },
                { icon: '🏆', text: 'Compete for the high score!', x: GAME_WIDTH / 2 - 260, y: 570 }
            ];
            
            features.forEach(f => {
                ctx.fillStyle = COLORS.primary;
                ctx.fillText(f.icon, f.x, f.y);
                ctx.fillStyle = '#DDDDDD';
                ctx.fillText(f.text, f.x + 40, f.y);
            });
        }

        function drawGame() {
            drawBackground();

            // === TOP HUD ===
            // Score panel
            drawPanel(20, 20, 250, 100);
            drawGlowText('SCORE', 35, 42, 18, '#AABBCC', COLORS.primary, 'left');
            drawGlowText(game.score.toString(), 35, 72, 38, COLORS.primary, COLORS.primary, 'left');
            
            if (game.combo > 0) {
                const comboGlow = COLORS.warning + Math.floor(128 + Math.sin(game.energyPulse * 3) * 127).toString(16).padStart(2, '0');
                drawGlowText(`COMBO x${game.combo}`, 240, 60, 24, COLORS.warning, comboGlow, 'right');
            }
            
            // Level panel
            drawPanel(GAME_WIDTH - 270, 20, 250, 100);
            drawGlowText('LEVEL', GAME_WIDTH - 35, 42, 18, '#AABBCC', COLORS.secondary, 'right');
            drawGlowText(game.level.toString(), GAME_WIDTH - 35, 72, 38, COLORS.secondary, COLORS.secondary, 'right');
            
            // Timer bar
            const timerBarW = 220;
            const timerBarX = GAME_WIDTH - 260;
            const timerBarY = 95;
            const timerPercent = game.timeLeft / game.maxTime;
            
            // Timer background
            ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
            roundRect(ctx, timerBarX, timerBarY, timerBarW, 30, 15);
            ctx.fill();
            
            // Timer fill with gradient
            let timerColor1, timerColor2;
            if (timerPercent < 0.25) {
                timerColor1 = COLORS.danger;
                timerColor2 = '#CC0033';
            } else if (timerPercent < 0.5) {
                timerColor1 = COLORS.warning;
                timerColor2 = '#DD8800';
            } else {
                timerColor1 = COLORS.success;
                timerColor2 = '#00CC66';
            }
            
            const timerGradient = ctx.createLinearGradient(timerBarX, timerBarY, timerBarX + timerBarW, timerBarY);
            timerGradient.addColorStop(0, timerColor1);
            timerGradient.addColorStop(1, timerColor2);
            ctx.fillStyle = timerGradient;
            ctx.shadowBlur = 20;
            ctx.shadowColor = timerColor1;
            roundRect(ctx, timerBarX + 3, timerBarY + 3, (timerBarW - 6) * timerPercent, 24, 12);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Timer text
            ctx.fillStyle = COLORS.white;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(`${Math.ceil(game.timeLeft)}s`, timerBarX + timerBarW / 2, timerBarY + 15);
            ctx.shadowBlur = 0;

            // === PATTERN INSTRUCTION ===
            const instructionY = 155;
            drawPanel(GAME_WIDTH / 2 - 350, instructionY - 25, 700, 60);
            
            let instruction = '';
            let instructionColor = COLORS.primary;
            
            switch(game.targetPattern) {
                case PATTERNS.SUM:
                    instruction = `SELECT NUMBERS THAT SUM TO ${game.targetValue}`;
                    instructionColor = COLORS.primary;
                    break;
                case PATTERNS.PRODUCT:
                    instruction = `SELECT NUMBERS THAT MULTIPLY TO ${game.targetValue}`;
                    instructionColor = COLORS.warning;
                    break;
                case PATTERNS.EVEN:
                    instruction = `SELECT ${game.targetValue} EVEN NUMBERS`;
                    instructionColor = COLORS.success;
                    break;
                case PATTERNS.ODD:
                    instruction = `SELECT ${game.targetValue} ODD NUMBERS`;
                    instructionColor = COLORS.accent;
                    break;
                case PATTERNS.GREATER:
                    instruction = `SELECT 3+ NUMBERS GREATER THAN ${game.targetValue}`;
                    instructionColor = COLORS.warning;
                    break;
                case PATTERNS.SEQUENCE:
                    instruction = `SELECT ${game.targetValue} CONSECUTIVE NUMBERS`;
                    instructionColor = '#9966FF';
                    break;
            }
            
            drawGlowText(instruction, GAME_WIDTH / 2, instructionY + 5, 28, instructionColor, instructionColor);

            // === DRAW NUMBERS ===
            game.numbers.forEach(num => {
                ctx.save();
                
                const scale = num.scale || 1;
                const pulseScale = num.selected ? (1 + Math.sin(game.energyPulse * 4) * 0.05) : 1;
                const finalScale = scale * pulseScale;
                
                ctx.translate(num.x, num.y);
                ctx.scale(finalScale, finalScale);
                
                // Number circle with HD graphics
                const radius = 50;
                
                if (num.selected) {
                    // Selected state - ultra bright
                    ctx.shadowBlur = 45;
                    ctx.shadowColor = COLORS.primary;
                    
                    // Outer ring animation
                    for (let i = 0; i < 3; i++) {
                        ctx.strokeStyle = `rgba(0, 229, 255, ${0.3 - i * 0.1})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(0, 0, radius + 8 + i * 5, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    
                    // Main circle gradient
                    const selectedGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
                    selectedGradient.addColorStop(0, '#00FFFF');
                    selectedGradient.addColorStop(0.7, '#00BBFF');
                    selectedGradient.addColorStop(1, '#0088DD');
                    ctx.fillStyle = selectedGradient;
                } else {
                    // Unselected state - sleek dark
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'rgba(0, 100, 200, 0.6)';
                    
                    const unselectedGradient = ctx.createRadialGradient(-10, -10, 0, 0, 0, radius);
                    unselectedGradient.addColorStop(0, '#2A4A6A');
                    unselectedGradient.addColorStop(0.6, '#1A3A5A');
                    unselectedGradient.addColorStop(1, '#0A2A4A');
                    ctx.fillStyle = unselectedGradient;
                }

                // Draw circle
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Circle border
                ctx.strokeStyle = num.selected ? COLORS.white : 'rgba(0, 136, 255, 0.8)';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                // Specular highlight
                ctx.shadowBlur = 0;
                const highlightGradient = ctx.createRadialGradient(-15, -15, 0, 0, 0, radius);
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                highlightGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = highlightGradient;
                ctx.fill();

                // Number text
                ctx.fillStyle = num.selected ? '#001122' : COLORS.white;
                ctx.font = 'bold 42px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowBlur = num.selected ? 0 : 8;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.fillText(num.value, 0, 2);
                ctx.shadowBlur = 0;
                
                ctx.restore();
            });

            // === SUBMIT BUTTON ===
            const selectedCount = game.numbers.filter(n => n.selected).length;
            const buttonColor = selectedCount > 0 ? COLORS.success : '#445566';
            drawButton('submit', GAME_WIDTH / 2 - 120, 555, 240, 70, 'SUBMIT', buttonColor, '✓ ');

            // === PARTICLES ===
            game.particles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;
                
                const half = p.size / 2;
                ctx.fillRect(-half, -half, p.size, p.size);
                
                ctx.restore();
            });

            // === ANIMATIONS ===
            game.animations.forEach(anim => {
                if (anim.type === 'scorePopup') {
                    ctx.save();
                    ctx.globalAlpha = anim.data.opacity;
                    ctx.translate(anim.data.x, anim.data.y);
                    ctx.scale(anim.data.scale, anim.data.scale);
                    drawGlowText(anim.data.text, 0, 0, 42, '#FFFF00', COLORS.warning);
                    ctx.restore();
                }
                
                if (anim.type === 'comboFlash') {
                    ctx.save();
                    ctx.globalAlpha = anim.data.opacity;
                    ctx.translate(anim.data.x, anim.data.y);
                    ctx.scale(anim.data.scale, anim.data.scale);
                    drawGlowText(`COMBO x${game.combo}!`, 0, 0, 28, COLORS.warning, COLORS.warning);
                    ctx.restore();
                }
                
                if (anim.type === 'shockwave') {
                    ctx.save();
                    ctx.globalAlpha = anim.data.opacity * 0.5;
                    ctx.strokeStyle = COLORS.primary;
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = COLORS.primary;
                    ctx.beginPath();
                    ctx.arc(anim.data.x, anim.data.y, anim.data.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }

        function drawGameOver() {
            drawBackground();

            // Result panel
            drawPanel(GAME_WIDTH / 2 - 300, 80, 600, 480);
            
            // Title
            drawGlowText('GAME OVER', GAME_WIDTH / 2, 150, 60, COLORS.danger, COLORS.danger);
            
            // Stats panel
            drawPanel(GAME_WIDTH / 2 - 260, 220, 520, 240, 0.5);
            
            // Final score
            drawGlowText('FINAL SCORE', GAME_WIDTH / 2, 250, 22, '#AABBCC', COLORS.primary);
            drawGlowText(game.score.toString(), GAME_WIDTH / 2, 295, 52, COLORS.primary, COLORS.primary);
            
            // Stats
            ctx.fillStyle = COLORS.white;
            ctx.font = '26px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`High Score: ${game.highScore}`, GAME_WIDTH / 2, 350);
            
            ctx.fillStyle = COLORS.warning;
            ctx.font = '24px Arial';
            ctx.fillText(`Best Combo: x${game.maxCombo}`, GAME_WIDTH / 2, 385);
            
            ctx.fillStyle = COLORS.success;
            ctx.font = '22px Arial';
            ctx.fillText(`Correct: ${game.totalCorrect} | Wrong: ${game.totalWrong}`, GAME_WIDTH / 2, 420);
            
            const accuracy = game.totalCorrect + game.totalWrong > 0 
                ? Math.round((game.totalCorrect / (game.totalCorrect + game.totalWrong)) * 100) 
                : 0;
            ctx.fillStyle = COLORS.secondary;
            ctx.fillText(`Accuracy: ${accuracy}%`, GAME_WIDTH / 2, 445);

            // Play again button
            drawButton('playagain', GAME_WIDTH / 2 - 150, 490, 300, 80, 'PLAY AGAIN', COLORS.success, '↻ ');
        }

        // ============================================
        // INPUT HANDLING
        // ============================================
        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = GAME_WIDTH / rect.width;
            const scaleY = GAME_HEIGHT / rect.height;
            
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        function isInsideButton(pos, buttonId) {
            const btn = game.buttons[buttonId];
            if (!btn) return false;
            return pos.x >= btn.x && pos.x <= btn.x + btn.w &&
                   pos.y >= btn.y && pos.y <= btn.y + btn.h;
        }

        function handleClick(e) {
            e.preventDefault();
            const pos = getMousePos(e);

            if (game.state === 'menu') {
                if (isInsideButton(pos, 'start')) {
                    playSound('click');
                    startGame();
                }
            } else if (game.state === 'playing') {
                let clickedNumber = false;
                
                game.numbers.forEach(num => {
                    const dist = Math.sqrt((pos.x - num.x) ** 2 + (pos.y - num.y) ** 2);
                    if (dist < 50 && num.scale >= 1) {
                        num.selected = !num.selected;
                        playSound('click');
                        clickedNumber = true;
                        
                        // Bounce animation
                        num.scale = 1.15;
                        setTimeout(() => { if (num.scale > 1) num.scale = 1; }, 150);
                    }
                });

                if (!clickedNumber && isInsideButton(pos, 'submit')) {
                    submitAnswer();
                }
            } else if (game.state === 'gameover') {
                if (isInsideButton(pos, 'playagain')) {
                    playSound('click');
                    game.state = 'menu';
                }
            }
        }

        function handleMouseMove(e) {
            const pos = getMousePos(e);
            let foundHover = false;
            
            Object.keys(game.buttons).forEach(btnId => {
                if (isInsideButton(pos, btnId)) {
                    game.hoverButton = btnId;
                    foundHover = true;
                }
            });
            
            if (!foundHover) {
                game.hoverButton = null;
            }
            
            canvas.style.cursor = foundHover ? 'pointer' : 'default';
        }

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);

        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', e => e.preventDefault());

        // ============================================
        // GAME LOOP
        // ============================================
        function update(currentTime) {
            const dt = Math.min((currentTime - game.lastFrameTime) / 1000, 0.1);
            game.lastFrameTime = currentTime;

            if (game.state === 'playing') {
                game.timeLeft -= dt;
                
                if (game.timeLeft <= 0) {
                    game.timeLeft = 0;
                    game.state = 'gameover';
                    
                    if (game.score > game.highScore) {
                        game.highScore = game.score;
                        localStorage.setItem('neuroGridHD_HighScore', game.highScore);
                        
                        // Celebration effect
                        for (let i = 0; i < 100; i++) {
                            setTimeout(() => {
                                createParticleExplosion(
                                    Math.random() * GAME_WIDTH,
                                    Math.random() * GAME_HEIGHT,
                                    [COLORS.primary, COLORS.secondary, COLORS.warning][randomInt(0, 2)],
                                    5
                                );
                            }, i * 20);
                        }
                    }
                }

                updateParticles(dt);
                
                // Smooth number animations
                game.numbers.forEach(num => {
                    if (num.scale > 1) {
                        num.scale = Math.max(1, num.scale - dt * 3);
                    } else if (num.scale < 1 && num.scale > 0) {
                        num.scale = Math.min(1, num.scale + dt * 3);
                    }
                });
            }

            updateAnimations(currentTime);
        }

        function render() {
            if (game.state === 'menu') {
                drawMenu();
            } else if (game.state === 'playing') {
                drawGame();
            } else if (game.state === 'gameover') {
                drawGameOver();
            }
        }

        function gameLoop(currentTime) {
            update(currentTime);
            render();
            requestAnimationFrame(gameLoop);
        }

        // ============================================
        // INITIALIZE
        // ============================================
        initBackground();
        game.lastFrameTime = performance.now();
        gameLoop(game.lastFrameTime);

        // Handle window resize
        window.addEventListener('resize', () => {
            const container = document.getElementById('gameContainer');
            const scale = Math.min(
                window.innerWidth / GAME_WIDTH,
                window.innerHeight / GAME_HEIGHT,
                1
            );
            canvas.style.transform = `scale(${scale})`;
        });
        
        // Trigger initial resize
        window.dispatchEvent(new Event('resize'));
  
