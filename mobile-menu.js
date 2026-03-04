// 移动端菜单功能实现
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const drawerCloseBtn = document.querySelector('.drawer-close');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    // 确保元素存在
    if (mobileMenuBtn && mobileDrawer && drawerCloseBtn) {
        // 打开侧滑菜单
        mobileMenuBtn.addEventListener('click', function() {
            mobileDrawer.classList.add('open');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });

        // 关闭侧滑菜单
        drawerCloseBtn.addEventListener('click', function() {
            mobileDrawer.classList.remove('open');
            document.body.style.overflow = ''; // 恢复背景滚动
        });

        // 点击菜单外部区域关闭
        mobileDrawer.addEventListener('click', function(e) {
            if (e.target === mobileDrawer) {
                mobileDrawer.classList.remove('open');
                document.body.style.overflow = '';
            }
        });

        // 点击菜单项后关闭
        drawerLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileDrawer.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    } else {
        console.error('移动端菜单相关元素未找到');
    }
});