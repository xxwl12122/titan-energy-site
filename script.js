// 导航栏滚动效果 (基于页面滚动)
window.addEventListener('scroll', function() {
    const nav = document.querySelector('.professional-nav');
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// 页面加载时检查初始滚动位置
window.addEventListener('load', function() {
    const nav = document.querySelector('.professional-nav');
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    }
});

// 导航链接点击平滑滚动
// 为所有导航链接添加点击事件监听器
document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // 只处理内部锚点链接
        if (href && href.startsWith('#')) {
            e.preventDefault(); // 阻止默认的跳转行为
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                // 使用 scrollIntoView 实现平滑滚动
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            // 如果目标元素不存在，则不执行任何操作，保持当前页面位置
        }
    });
});