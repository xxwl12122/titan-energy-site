// 平滑滚动锚点
// 确保 html 元素有 scroll-behavior: smooth
// 这已在 CSS 中设置

// 导航栏滚动效果
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