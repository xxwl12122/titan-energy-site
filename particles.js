/**
 * 动态能量粒子系统
 * 基于 Canvas 实现，颜色与红蓝流光呼应
 */

class EnergyParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 粒子属性
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        
        // 颜色：红蓝渐变，与流光效果呼应
        const hue = Math.random() > 0.5 ? 
            240 + Math.random() * 60 : // 蓝色系 (240-300)
            0 + Math.random() * 60;   // 红色系 (0-60)
        this.color = `hsla(${hue}, 100%, 60%, 0.7)`;
        
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.trail = [];
        this.maxTrail = 10;
    }

    update() {
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;

        // 边界检测，实现环绕
        if (this.x < 0) this.x = this.canvas.width;
        if (this.x > this.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.canvas.height;
        if (this.y > this.canvas.height) this.y = 0;

        // 更新轨迹
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
    }

    draw() {
        const ctx = this.ctx;
        
        // 绘制轨迹
        ctx.beginPath();
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const opacity = this.opacity * (i / this.trail.length);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = this.color;
            ctx.fillRect(point.x, point.y, this.size, this.size);
        }
        ctx.globalAlpha = 1;
        
        // 绘制粒子主体
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        
        // 添加光晕效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.shadowBlur = 0;
    }
}

class EnergyParticleSystem {
    constructor() {
        this.canvas = document.getElementById('energy-particles');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = Math.min(100, Math.floor(window.innerWidth * window.innerHeight / 10000));
        
        this.init();
        this.animate();
    }

    init() {
        // 设置 Canvas 大小
        this.resize();
        
        // 创建粒子
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new EnergyParticle(this.canvas));
        }
        
        // 事件监听
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新并绘制所有粒子
        this.particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // 连接相近的粒子
        this.connectParticles();
        
        // 循环动画
        requestAnimationFrame(() => this.animate());
    }

    connectParticles() {
        const ctx = this.ctx;
        const distanceThreshold = 150;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < distanceThreshold) {
                    // 根据距离计算线条透明度
                    const opacity = 1 - (distance / distanceThreshold);
                    
                    // 混合两种粒子的颜色
                    const color1 = this.particles[i].color.match(/\d+/g);
                    const color2 = this.particles[j].color.match(/\d+/g);
                    const hue = (parseInt(color1[0]) + parseInt(color2[0])) / 2;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${opacity * 0.3})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }
}

// 页面加载完成后初始化粒子系统
window.addEventListener('load', () => {
    if (document.getElementById('energy-particles')) {
        new EnergyParticleSystem();
    }
});