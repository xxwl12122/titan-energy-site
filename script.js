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

// 恢复右上角功能按钮的点击事件
// 1. 搜索按钮
const searchBtn = document.querySelector('.search-btn');
const searchOverlay = document.createElement('div');
searchOverlay.className = 'search-overlay';
searchOverlay.innerHTML = `
    <div class="search-container">
        <input type="text" class="search-input" placeholder="搜索产品...">
        <button class="search-close">×</button>
    </div>
`;
document.body.appendChild(searchOverlay);

searchBtn.addEventListener('click', function() {
    searchOverlay.style.display = 'flex';
    setTimeout(() => {
        searchOverlay.style.opacity = '1';
        searchOverlay.querySelector('.search-container').style.transform = 'scale(1)';
    }, 10);
});

searchOverlay.querySelector('.search-close').addEventListener('click', function() {
    searchOverlay.style.opacity = '0';
    searchOverlay.querySelector('.search-container').style.transform = 'scale(0.8)';
    setTimeout(() => {
        searchOverlay.style.display = 'none';
    }, 300);
});

// 2. 主题切换按钮
const themeToggle = document.querySelector('.theme-toggle');

themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
    // 更新图标
    this.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
});

// 3. 移动端菜单按钮
const mobileMenuBtn = document.querySelector('.mobile-menu');

mobileMenuBtn.addEventListener('click', function() {
    // 展开移动端侧边栏菜单
    document.querySelector('.mobile-drawer').classList.add('open');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
});

// 确保移动端菜单存在
const mobileDrawer = document.querySelector('.mobile-drawer');
if (!mobileDrawer) {
    console.error('移动端侧边栏菜单未找到');
}

// 关闭移动端侧边栏菜单
const drawerCloseBtn = document.querySelector('.drawer-close');
drawerCloseBtn.addEventListener('click', function() {
    document.querySelector('.mobile-drawer').classList.remove('open');
    document.body.style.overflow = ''; // 恢复背景滚动
});

// 点击遮罩层关闭菜单
const mobileDrawer = document.querySelector('.mobile-drawer');
mobileDrawer.addEventListener('click', function(e) {
    if (e.target === mobileDrawer) {
        mobileDrawer.classList.remove('open');
        document.body.style.overflow = '';
    }
});