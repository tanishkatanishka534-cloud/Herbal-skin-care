/* ===== Herbal Skin Care — Main Script ===== */
(() => {
    'use strict';

    // ── DOM Helpers ──
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    const navbar = $('#navbar');
    const hamburger = $('#hamburger');
    const navLinks = $('#navLinks');
    const searchToggle = $('#searchToggle');
    const searchOverlay = $('#searchOverlay');
    const searchClose = $('#searchClose');
    const searchInput = $('#searchInput');
    const cartBtn = $('#cartBtn');
    const cartOverlay = $('#cartOverlay');
    const cartDrawer = $('#cartDrawer');
    const cartClose = $('#cartClose');
    const cartItems = $('#cartItems');
    const cartEmpty = $('#cartEmpty');
    const cartFooter = $('#cartFooter');
    const cartCount = $('#cartCount');
    const cartTotal = $('#cartTotal');
    const productGrid = $('#productGrid');
    const backToTop = $('#backToTop');
    const toastContainer = $('#toastContainer');
    const newsletterForm = $('#newsletterForm');

    // ── Cart State (localStorage) ──
    let cart = JSON.parse(localStorage.getItem('herbal_cart') || '[]');

    // ── Navbar Scroll ──
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 60);
        backToTop.classList.toggle('visible', y > 500);
    });

    // ── Mobile Menu ──
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // ── Active Nav Link on Scroll ──
    const sections = $$('section[id]');
    window.addEventListener('scroll', () => {
        const y = window.scrollY + 200;
        sections.forEach(sec => {
            const top = sec.offsetTop;
            const h = sec.offsetHeight;
            const id = sec.getAttribute('id');
            const link = $(`.nav-link[href="#${id}"]`);
            if (link) link.classList.toggle('active', y >= top && y < top + h);
        });
    });

    // ── Search ──
    searchToggle.addEventListener('click', () => {
        searchOverlay.classList.toggle('active');
        if (searchOverlay.classList.contains('active')) searchInput.focus();
    });
    searchClose.addEventListener('click', () => searchOverlay.classList.remove('active'));

    // ── Cart Drawer ──
    function openCart() {
        cartDrawer.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeCart() {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // ── Cart Logic ──
    function saveCart() {
        localStorage.setItem('herbal_cart', JSON.stringify(cart));
    }

    function updateCartUI() {
        const totalItems = cart.reduce((s, i) => s + i.qty, 0);
        cartCount.textContent = totalItems;
        cartCount.classList.add('bump');
        setTimeout(() => cartCount.classList.remove('bump'), 400);

        if (cart.length === 0) {
            cartEmpty.style.display = 'flex';
            cartFooter.style.display = 'none';
            $$('.cart-item', cartItems).forEach(el => el.remove());
            return;
        }

        cartEmpty.style.display = 'none';
        cartFooter.style.display = 'block';
        $$('.cart-item', cartItems).forEach(el => el.remove());

        cart.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
        <div class="cart-item-img"><img src="${item.img}" alt="${item.name}" /></div>
        <div class="cart-item-details">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${item.id}">✕</button>
      `;
            cartItems.appendChild(el);
        });

        const sum = cart.reduce((s, i) => s + i.price * i.qty, 0);
        cartTotal.textContent = `$${sum.toFixed(2)}`;
    }

    // Cart item actions (delegated)
    cartItems.addEventListener('click', e => {
        const btn = e.target.closest('[data-id]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (action === 'inc') {
            const item = cart.find(i => i.id === id);
            if (item) item.qty++;
        } else if (action === 'dec') {
            const item = cart.find(i => i.id === id);
            if (item) { item.qty--; if (item.qty <= 0) cart = cart.filter(i => i.id !== id); }
        } else if (btn.classList.contains('cart-item-remove')) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
        updateCartUI();
    });

    // Add to cart from product cards
    productGrid.addEventListener('click', e => {
        const btn = e.target.closest('.btn-add-cart');
        if (!btn) return;
        const { id, name, price, img } = btn.dataset;
        const existing = cart.find(i => i.id === id);
        if (existing) { existing.qty++; }
        else { cart.push({ id, name, price: parseFloat(price), img, qty: 1 }); }
        saveCart();
        updateCartUI();
        showToast(`🌿 ${name} added to cart!`);
    });

    // Wishlist toggle
    productGrid.addEventListener('click', e => {
        const btn = e.target.closest('.product-wishlist');
        if (!btn) return;
        btn.classList.toggle('active');
        showToast(btn.classList.contains('active') ? 'Added to wishlist ♥' : 'Removed from wishlist');
    });

    // ── Product Filters ──
    const filterBtns = $$('.filter-btn');
    const productCards = $$('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            productCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'none';
                    card.offsetHeight;
                    card.style.animation = 'fadeUp .5s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // ── Toast ──
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span class="toast-icon">✓</span><span class="toast-msg">${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }

    // ── Newsletter ──
    newsletterForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = $('#emailInput').value.trim();
        if (email) {
            showToast('Welcome to the Herbal family! 🌿');
            newsletterForm.reset();
        }
    });

    // ── Back to Top ──
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ── Scroll Reveal (Intersection Observer) ──
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach(el => revealObserver.observe(el));

    // ── Counter Animation ──
    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                animateCount(el, parseInt(el.dataset.target));
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    $$('[data-target]').forEach(el => counterObserver.observe(el));

    function animateCount(el, target) {
        const duration = 1600;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(ease * target);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ── Checkout ──
    document.addEventListener('click', e => {
        if (e.target.closest('.btn-checkout')) showToast('Checkout coming soon! 🛒');
    });

    // ── Inject keyframes ──
    const style = document.createElement('style');
    style.textContent = `
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
  `;
    document.head.appendChild(style);

    // ── Init ──
    updateCartUI();

})();
