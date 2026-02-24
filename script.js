document.addEventListener('DOMContentLoaded', () => {
    // 注册插件
    gsap.registerPlugin(ScrollTrigger);

    // 专业动画配置
    const professionalAnimations = {
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.1
    };

    // 1. 主题切换功能
    const themeToggle = document.querySelector('.theme-toggle');
    let isDarkTheme = false;
    
    // 初始化主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkTheme = true;
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle('dark-theme');
        themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
        ScrollTrigger.refresh();
    });

    // 2. 搜索按钮功能
    const searchBtn = document.querySelector('.search-btn');
    let searchOverlay = null;
    
    searchBtn.addEventListener('click', () => {
        // 如果搜索覆盖层已存在，则移除
        if (searchOverlay) {
            searchOverlay.remove();
            searchOverlay = null;
            return;
        }
        
        // 创建搜索覆盖层
        searchOverlay = document.createElement('div');
        searchOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1002;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // 创建搜索框
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
            transform: scale(0.8);
            transition: transform 0.3s ease;
        `;
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '搜索产品、技术或解决方案...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 1rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1.1rem;
            outline: none;
            transition: border-color 0.3s ease;
        `;
        
        searchInput.addEventListener('focus', () => {
            searchInput.style.borderColor = '#0066cc';
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.style.borderColor = '#e0e0e0';
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    alert(`搜索: ${searchTerm}`);
                    searchOverlay.remove();
                    searchOverlay = null;
                }
            }
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
            transition: color 0.3s ease;
        `;
        
        closeBtn.addEventListener('click', () => {
            searchOverlay.remove();
            searchOverlay = null;
        });
        
        searchContainer.appendChild(closeBtn);
        searchContainer.appendChild(searchInput);
        searchOverlay.appendChild(searchContainer);
        document.body.appendChild(searchOverlay);
        
        // 动画显示
        setTimeout(() => {
            searchOverlay.style.opacity = '1';
            searchContainer.style.transform = 'scale(1)';
        }, 10);
        
        // 聚焦输入框
        setTimeout(() => {
            searchInput.focus();
        }, 300);
        
        // 点击背景关闭
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                searchOverlay.remove();
                searchOverlay = null;
            }
        });
    });

    // 2. 导航栏滚动效果
    const navbar = document.querySelector('.professional-nav');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const opacity = Math.max(0.1, 1 - scrolled / 200);
        
        gsap.to(navbar, {
            background: isDarkTheme 
                ? `rgba(30, 30, 30, ${opacity * 0.85})`
                : `rgba(255, 255, 255, ${opacity * 0.85})`,
            duration: 0.3,
            ease: "power2.out"
        });
    });

    // 3. 英雄区域动画
    gsap.timeline()
        .to(".hero-badge", {
            opacity: 1,
            y: 0,
            duration: professionalAnimations.duration,
            ease: professionalAnimations.ease
        })
        .to(".hero-title .title-line", {
            opacity: 1,
            y: 0,
            duration: professionalAnimations.duration,
            ease: professionalAnimations.ease,
            stagger: 0.2
        }, "-=0.4")
        .to(".hero-subtitle", {
            opacity: 1,
            y: 0,
            duration: professionalAnimations.duration,
            ease: professionalAnimations.ease
        }, "-=0.3")
        .to(".hero-actions", {
            opacity: 1,
            y: 0,
            duration: professionalAnimations.duration,
            ease: professionalAnimations.ease
        }, "-=0.2")
        .to(".hero-stats", {
            opacity: 1,
            y: 0,
            duration: professionalAnimations.duration,
            ease: professionalAnimations.ease
        }, "-=0.1");

    // 4. 电池模型动画
    gsap.to(".battery-model", {
        y: -20,
        rotation: 2,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    // 5. 产品卡片动画
    gsap.to(".products-section", {
        opacity: 1,
        duration: professionalAnimations.duration,
        ease: professionalAnimations.ease
    });

    gsap.to(".product-card", {
        opacity: 1,
        y: 0,
        duration: professionalAnimations.duration,
        ease: professionalAnimations.ease,
        stagger: professionalAnimations.stagger
    });

    // 6. 产品卡片悬停效果
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                y: -10,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                y: 0,
                duration: 0.3,
                ease: "power2.out"
            });
        });
    });

    // 7. 技术创新区域动画
    gsap.to(".technology-section", {
        opacity: 1,
        duration: professionalAnimations.duration,
        ease: professionalAnimations.ease
    });

    gsap.to(".tech-item", {
        opacity: 1,
        x: 0,
        duration: professionalAnimations.duration,
        ease: professionalAnimations.ease,
        stagger: professionalAnimations.stagger
    });

    // 8. 技术项目悬停效果
    const techItems = document.querySelectorAll('.tech-item');
    
    techItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            gsap.to(item, {
                x: 10,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        item.addEventListener('mouseleave', () => {
            gsap.to(item, {
                x: 0,
                duration: 0.3,
                ease: "power2.out"
            });
        });
    });

    // 9. 应用场景动画
    gsap.to(".solutions-section", {
        opacity: 1,
        duration: professionalAnimations.duration,
        ease: professionalAnimations.ease
    });

    gsap.to(".solution-card", {
        opacity: 1,
        y: 0,
        duration: professionalAnimations.duration,
        ease: professionalAnimations.ease,
        stagger: professionalAnimations.stagger
    });

    // 10. 解决方案卡片悬停效果
    const solutionCards = document.querySelectorAll('.solution-card');
    
    solutionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                y: -5,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                y: 0,
                duration: 0.3,
                ease: "power2.out"
            });
        });
    });

    // 11. 数据统计动画
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const animateStats = () => {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const current = 0;
            const increment = target / 50;
            
            const updateNumber = () => {
                const currentValue = Math.floor(current);
                stat.textContent = currentValue + (stat.textContent.includes('M') ? 'M+' : stat.textContent.includes('%') ? '%' : '+');
                
                if (currentValue < target) {
                    current += increment;
                    requestAnimationFrame(updateNumber);
                } else {
                    stat.textContent = stat.textContent.includes('M') ? '100M+' : stat.textContent.includes('%') ? '99.9%' : target + '+';
                }
            };
            
            updateNumber();
        });
    };

    gsap.to(".stats-section", {
        opacity: 1,
        duration: professionalAnimations.duration,
        ease: professionalAnimations.ease,
        onComplete: animateStats
    });

    // 12. 页面滚动触发动画
    const scrollTriggerElements = [
        { trigger: ".products-section", elements: ".product-card", direction: "y" },
        { trigger: ".technology-section", elements: ".tech-item", direction: "x" },
        { trigger: ".solutions-section", elements: ".solution-card", direction: "y" },
        { trigger: ".stats-section", elements: ".stat-card", direction: "y" }
    ];

    scrollTriggerElements.forEach(({ trigger, elements, direction }) => {
        gsap.utils.toArray(elements).forEach(element => {
            gsap.to(element, {
                opacity: 1,
                [direction]: 0,
                duration: professionalAnimations.duration,
                ease: professionalAnimations.ease,
                scrollTrigger: {
                    trigger: trigger,
                    start: "top 80%",
                    end: "bottom 20%",
                    toggleActions: "play none none reverse"
                }
            });
        });
    });

    // 13. 导航链接平滑滚动
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                gsap.to(window, {
                    scrollTo: {
                        y: targetElement.offsetTop - 80,
                        autoKill: false
                    },
                    duration: 1,
                    ease: "power2.inOut"
                });
            }
        });
    });

    // 14. 按钮交互效果
    const buttons = document.querySelectorAll('.primary-btn, .secondary-btn, .product-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            gsap.to(button, {
                scale: 1.05,
                duration: 0.2,
                ease: "power2.out"
            });
        });

        button.addEventListener('mouseleave', () => {
            gsap.to(button, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
            });
        });

        // 添加点击涟漪效果
        button.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.6)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = (e.clientX - button.offsetLeft) + 'px';
            ripple.style.top = (e.clientY - button.offsetTop) + 'px';
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // 15. 背景轨道动画
    const orbits = document.querySelectorAll('.orbit');
    
    orbits.forEach((orbit, index) => {
        gsap.to(orbit, {
            rotation: 360,
            duration: 20 + index * 5,
            repeat: -1,
            ease: "none"
        });
    });

    // 16. 电源流动画
    gsap.to(".power-flow", {
        scale: 1.2,
        opacity: 1,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    // 17. 页面加载动画
    gsap.from(".logo", {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power2.out"
    });

    gsap.from(".nav-menu", {
        opacity: 0,
        y: -20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
    });

    gsap.from(".search-btn, .theme-toggle, .mobile-menu", {
        opacity: 0,
        y: -20,
        duration: 0.6,
        delay: 0.2,
        stagger: 0.1,
        ease: "power2.out"
    });

    // 18. 性能优化：减少不必要的重绘
    let ticking = false;
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateAnimations);
            ticking = true;
        }
    }

    function updateAnimations() {
        // 更新动画逻辑
        ticking = false;
    }

    // 监听滚动事件
    window.addEventListener('scroll', requestTick);

    // 19. 响应式处理
    function handleResize() {
        ScrollTrigger.refresh();
    }

    window.addEventListener('resize', handleResize);

    // 20. 添加页面可见性变化处理
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            gsap.globalTimeline.pause();
        } else {
            gsap.globalTimeline.play();
        }
    });

    // 21. 优化GSAP性能
    gsap.config({
        nullTargetWarn: false,
        trialWarn: false
    });

    // 22. 初始化ScrollTrigger
    ScrollTrigger.refresh();

    // 23. 鼠标移动视差效果
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        gsap.to(".hero-title", {
            x: (mouseX - 0.5) * 30,
            y: (mouseY - 0.5) * 30,
            duration: 1,
            ease: "power2.out"
        });
    });

    // 24. 添加涟漪动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // 25. 添加导航下拉菜单交互
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const dropdown = item.querySelector('.nav-dropdown');
            if (dropdown) {
                gsap.to(dropdown, {
                    opacity: 1,
                    visibility: 'visible',
                    y: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });

        item.addEventListener('mouseleave', () => {
            const dropdown = item.querySelector('.nav-dropdown');
            if (dropdown) {
                gsap.to(dropdown, {
                    opacity: 0,
                    visibility: 'hidden',
                    y: -10,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
    });

    // 26. 移动端菜单切换
    const mobileMenu = document.querySelector('.mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    // 初始化移动端菜单状态
    if (window.innerWidth <= 768) {
        navMenu.style.display = 'none';
    }
    
    mobileMenu.addEventListener('click', () => {
        const isHidden = navMenu.style.display === 'none' || navMenu.style.display === '';
        
        if (isHidden) {
            navMenu.style.display = 'flex';
            navMenu.style.position = 'absolute';
            navMenu.style.top = '100%';
            navMenu.style.left = '0';
            navMenu.style.right = '0';
            navMenu.style.background = 'var(--glass-bg)';
            navMenu.style.flexDirection = 'column';
            navMenu.style.padding = '1rem';
            navMenu.style.borderTop = '1px solid var(--glass-border)';
            navMenu.style.boxShadow = 'var(--shadow-md)';
            
            gsap.from(navMenu, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                ease: "power2.out"
            });
            
            mobileMenu.textContent = '✕';
        } else {
            navMenu.style.display = 'none';
            mobileMenu.textContent = '☰';
        }
    });
    
    // 窗口大小改变时处理菜单
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navMenu.style.display = 'flex';
            navMenu.style.position = 'static';
            navMenu.style.top = 'auto';
            navMenu.style.left = 'auto';
            navMenu.style.right = 'auto';
            navMenu.style.flexDirection = 'row';
            navMenu.style.padding = '0';
            navMenu.style.borderTop = 'none';
            navMenu.style.boxShadow = 'none';
            mobileMenu.textContent = '☰';
        } else {
            navMenu.style.display = 'none';
            mobileMenu.textContent = '☰';
        }
    });

    // 27. 添加滚动进度条
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 2px;
        background: linear-gradient(90deg, #0066cc, #ff6b35);
        z-index: 1001;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrolled = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrolled + '%';
    });

    // 28. 初始化动画完成后的回调
    gsap.globalTimeline.eventCallback("onComplete", () => {
        console.log("所有动画加载完成");
    });
});