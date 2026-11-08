/**
 * YOUNES PARFUM - Core JavaScript Application
 * Reactive, real-time updates without page reloading ("بدون غمض")
 * Protected Admin Panel with passcode 2999
 */

// ==========================================================================
// 1. STATE & STORAGE MANAGEMENT
// ==========================================================================

const APP_STATE = {
  products: [],
  orders: [],
  settings: {},
  cart: [],
  currentFilter: 'all',
  currentSort: 'featured',
  searchQuery: '',
  adminFilter: 'all',
  activeOrderProduct: null
};

// Initialize State from LocalStorage or Defaults
function initAppState() {
  try {
    const storedProducts = localStorage.getItem('yp_products');
    APP_STATE.products = storedProducts ? JSON.parse(storedProducts) : DEFAULT_PRODUCTS;

    const storedOrders = localStorage.getItem('yp_orders');
    APP_STATE.orders = storedOrders ? JSON.parse(storedOrders) : DEFAULT_ORDERS;

    const storedSettings = localStorage.getItem('yp_settings');
    APP_STATE.settings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;

    const storedCart = localStorage.getItem('yp_cart');
    APP_STATE.cart = storedCart ? JSON.parse(storedCart) : [];
  } catch (err) {
    console.error("Error reading localStorage, using defaults", err);
    APP_STATE.products = DEFAULT_PRODUCTS;
    APP_STATE.orders = DEFAULT_ORDERS;
    APP_STATE.settings = DEFAULT_SETTINGS;
  }
}

function saveProductsToStorage() {
  localStorage.setItem('yp_products', JSON.stringify(APP_STATE.products));
  broadcastStateChange('products');
}

function saveOrdersToStorage() {
  localStorage.setItem('yp_orders', JSON.stringify(APP_STATE.orders));
  broadcastStateChange('orders');
}

function saveSettingsToStorage() {
  localStorage.setItem('yp_settings', JSON.stringify(APP_STATE.settings));
  broadcastStateChange('settings');
}

function saveCartToStorage() {
  localStorage.setItem('yp_cart', JSON.stringify(APP_STATE.cart));
  updateCartBadge();
}

// BroadcastChannel for cross-tab instant reactivity ("بدون غمض")
let broadcastChannel = null;
try {
  if (window.BroadcastChannel) {
    broadcastChannel = new BroadcastChannel('yp_perfumes_live_sync');
    broadcastChannel.onmessage = (event) => {
      handleLiveSync(event.data);
    };
  }
} catch (e) {
  console.warn("BroadcastChannel not supported", e);
}

// Listen to storage event for multi-tab sync fallback
window.addEventListener('storage', (e) => {
  if (e.key === 'yp_orders' || e.key === 'yp_products' || e.key === 'yp_settings') {
    initAppState();
    renderStorefront();
    if (isAdminLoggedIn()) {
      renderAdminDashboard();
    }
  }
});

function broadcastStateChange(type) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, timestamp: Date.now() });
  }
}

function handleLiveSync(data) {
  initAppState();
  if (data.type === 'orders') {
    playNotificationChime();
    showToast("🔔 تم استقبال طلب جديد في المتجر!", "info");
    if (isAdminLoggedIn()) {
      renderAdminDashboard();
    }
  } else if (data.type === 'products') {
    renderStorefront();
    if (isAdminLoggedIn()) {
      renderAdminProductsTable();
      updateAdminStats();
    }
  }
}

// ==========================================================================
// 2. AUDIO CHIME (Web Audio API - No external file dependencies)
// ==========================================================================
function playNotificationChime() {
  if (!APP_STATE.settings.soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.log("Audio alert not triggered:", err);
  }
}

// ==========================================================================
// 3. TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';
  if (type === 'info') icon = 'fa-bell';

  toast.innerHTML = `
    <i class="fas ${icon}" style="color: ${type === 'error' ? 'var(--color-danger)' : 'var(--gold-primary)'}; font-size: 1.2rem;"></i>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// 4. STOREFRONT RENDERING & FILTERS
// ==========================================================================

function renderStorefront() {
  const grid = document.getElementById('perfumesGrid');
  if (!grid) return;

  let filtered = [...APP_STATE.products];

  // Category Filter
  if (APP_STATE.currentFilter !== 'all') {
    filtered = filtered.filter(p => p.category === APP_STATE.currentFilter);
  }

  // Search Filter
  if (APP_STATE.searchQuery.trim() !== '') {
    const q = APP_STATE.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.notes && (
        (p.notes.top && p.notes.top.toLowerCase().includes(q)) ||
        (p.notes.heart && p.notes.heart.toLowerCase().includes(q)) ||
        (p.notes.base && p.notes.base.toLowerCase().includes(q))
      ))
    );
  }

  // Sorting
  if (APP_STATE.currentSort === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (APP_STATE.currentSort === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (APP_STATE.currentSort === 'rating') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
    // Featured / newest
    filtered.sort((a, b) => b.id - a.id);
  }

  // Update product count label
  const countLabel = document.getElementById('productsCountLabel');
  if (countLabel) {
    countLabel.innerText = `عرض ${filtered.length} من إجمالي ${APP_STATE.products.length} عطر فاخر`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        <i class="fas fa-search" style="font-size: 3rem; color: var(--gold-primary); margin-bottom: 16px; opacity: 0.5;"></i>
        <h3 style="font-size: 1.3rem; margin-bottom: 8px;">لم نجد أي عطر يطابق بحثك</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">جرب البحث بكلمات أخرى أو تصفح الأقسام الرئيسية</p>
        <button class="cta-gold-btn" onclick="resetFilters()">عرض كل العطور</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const formatPrice = Number(product.price).toLocaleString();
    const formatOldPrice = product.oldPrice ? Number(product.oldPrice).toLocaleString() : null;
    const discountPercent = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
    const notesSummary = product.notes ? `${product.notes.top} • ${product.notes.heart}` : (product.description || '');

    return `
      <article class="perfume-card" data-id="${product.id}">
        <div class="card-media-wrapper">
          <img src="${product.img || 'assets/logo.png'}" alt="${product.name}" loading="lazy">
          <div class="card-badges">
            ${product.badge ? `<span class="badge-tag">${product.badge}</span>` : ''}
            ${discountPercent > 0 ? `<span class="badge-tag sale">خصم ${discountPercent}%</span>` : ''}
          </div>
          <span class="volume-tag"><i class="fas fa-wine-bottle" style="margin-left: 4px;"></i>${product.volume || '100 مل'}</span>
          <button class="view-details-btn" title="تفاصيل العطر" onclick="openProductDetails(${product.id})">
            <i class="fas fa-eye"></i>
          </button>
        </div>

        <div class="card-body">
          <div class="card-category-row">
            <span>${product.categoryName || 'عطور فاخرة'}</span>
            <span class="concentration-label">${product.concentration || 'Eau de Parfum'}</span>
          </div>

          <h3 class="card-title" title="${product.name}">${product.name}</h3>
          
          <p class="card-notes-preview">
            <i class="fas fa-feather-alt" style="color: var(--gold-primary); margin-left: 6px;"></i>
            ${notesSummary}
          </p>

          <div class="card-footer">
            <div class="card-pricing-row">
              <div class="price-current">${formatPrice} <small>دج</small></div>
              ${formatOldPrice ? `<div class="price-old">${formatOldPrice} دج</div>` : ''}
            </div>

            <div class="card-buttons-row">
              <button class="quick-order-btn" onclick="openQuickOrder(${product.id})">
                <i class="fas fa-shopping-bag"></i>
                <span>طلب سريع</span>
              </button>
              <button class="add-cart-btn" title="إضافة إلى السلة" onclick="addToCart(${product.id})">
                <i class="fas fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function resetFilters() {
  APP_STATE.currentFilter = 'all';
  APP_STATE.searchQuery = '';
  const searchInput = document.getElementById('storeSearchInput');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === 'all');
  });
  renderStorefront();
}

// ==========================================================================
// 5. SHOPPING CART & QUICK ORDER
// ==========================================================================

function addToCart(productId) {
  const product = APP_STATE.products.find(p => p.id === productId);
  if (!product) return;

  const existing = APP_STATE.cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    APP_STATE.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      img: product.img,
      volume: product.volume,
      qty: 1
    });
  }

  saveCartToStorage();
  showToast(`تمت إضافة "${product.name}" إلى السلة 🛍️`);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadgeCount');
  if (!badge) return;
  const count = APP_STATE.cart.reduce((acc, item) => acc + item.qty, 0);
  badge.innerText = count;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
}

function openCartDrawer() {
  const drawerOverlay = document.getElementById('cartDrawerOverlay');
  const cartList = document.getElementById('cartItemsList');
  const cartTotalVal = document.getElementById('cartTotalValue');

  if (!drawerOverlay || !cartList) return;

  if (APP_STATE.cart.length === 0) {
    cartList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <i class="fas fa-shopping-basket" style="font-size: 2.5rem; color: var(--border-gold); margin-bottom: 12px;"></i>
        <p>سلتك فارغة حالياً</p>
      </div>
    `;
    if (cartTotalVal) cartTotalVal.innerText = '0 دج';
  } else {
    let subtotal = 0;
    cartList.innerHTML = APP_STATE.cart.map(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      return `
        <div class="cart-item-row">
          <img src="${item.img || 'assets/logo.png'}" class="cart-item-img" alt="${item.name}">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-price">${Number(item.price).toLocaleString()} دج × ${item.qty}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button onclick="changeCartQty(${item.id}, -1)" style="background: none; border: 1px solid var(--border-subtle); color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer;">-</button>
            <span style="font-weight: 700; font-size: 0.9rem;">${item.qty}</span>
            <button onclick="changeCartQty(${item.id}, 1)" style="background: none; border: 1px solid var(--border-subtle); color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer;">+</button>
            <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: var(--color-danger); cursor: pointer; margin-right: 6px;" title="حذف"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    if (cartTotalVal) {
      cartTotalVal.innerText = `${subtotal.toLocaleString()} دج`;
    }
  }

  drawerOverlay.classList.add('active');
}

function closeCartDrawer() {
  const drawerOverlay = document.getElementById('cartDrawerOverlay');
  if (drawerOverlay) drawerOverlay.classList.remove('active');
}

function changeCartQty(id, delta) {
  const item = APP_STATE.cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    APP_STATE.cart = APP_STATE.cart.filter(i => i.id !== id);
  }
  saveCartToStorage();
  openCartDrawer(); // Re-render cart drawer
}

function removeFromCart(id) {
  APP_STATE.cart = APP_STATE.cart.filter(i => i.id !== id);
  saveCartToStorage();
  openCartDrawer();
}

function proceedCartCheckout() {
  if (APP_STATE.cart.length === 0) {
    showToast("سلتك فارغة!", "error");
    return;
  }
  closeCartDrawer();
  // Open quick order modal configured for the full cart
  openMultiOrderModal();
}

// Quick Order Modal for single product
function openQuickOrder(productId) {
  const product = APP_STATE.products.find(p => p.id === productId);
  if (!product) return;

  APP_STATE.activeOrderProduct = product;
  const modal = document.getElementById('quickOrderModal');
  
  // Populate Product Summary in Modal
  document.getElementById('modalOrderProdName').innerText = product.name;
  document.getElementById('modalOrderProdPrice').innerText = `${Number(product.price).toLocaleString()} دج`;
  document.getElementById('modalOrderProdVolume').innerText = `${product.volume || '100 مل'} • ${product.concentration || 'عطر مركز'}`;
  document.getElementById('modalOrderProdImg').src = product.img || 'assets/logo.png';
  document.getElementById('orderQtyInput').value = 1;

  // Populate Wilayas select
  populateWilayasSelect('orderWilayaSelect');
  updateModalPricing();

  modal.classList.add('active');
}

function openMultiOrderModal() {
  // Aggregate cart into an order product representation
  const total = APP_STATE.cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const itemsText = APP_STATE.cart.map(i => `${i.name} (×${i.qty})`).join(' + ');

  APP_STATE.activeOrderProduct = {
    id: 999999,
    name: `سلة التسوق (${APP_STATE.cart.length} أصناف)`,
    price: total,
    volume: itemsText,
    concentration: 'طلب سلة متعدد',
    img: APP_STATE.cart[0]?.img || 'assets/logo.png'
  };

  const modal = document.getElementById('quickOrderModal');
  document.getElementById('modalOrderProdName').innerText = APP_STATE.activeOrderProduct.name;
  document.getElementById('modalOrderProdPrice').innerText = `${total.toLocaleString()} دج`;
  document.getElementById('modalOrderProdVolume').innerText = `${APP_STATE.cart.length} عطور مختارة`;
  document.getElementById('modalOrderProdImg').src = APP_STATE.activeOrderProduct.img;
  document.getElementById('orderQtyInput').value = 1;

  populateWilayasSelect('orderWilayaSelect');
  updateModalPricing();
  modal.classList.add('active');
}

function closeQuickOrderModal() {
  const modal = document.getElementById('quickOrderModal');
  if (modal) modal.classList.remove('active');
  APP_STATE.activeOrderProduct = null;
}

function populateWilayasSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">-- اختر ولاية التوصيل --</option>' +
    ALGERIA_WILAYAS.map(w => `<option value="${w.code}" data-fee="${w.fee}">${w.name} (توصيل: ${w.fee} دج)</option>`).join('');
}

function updateModalPricing() {
  if (!APP_STATE.activeOrderProduct) return;
  const qty = parseInt(document.getElementById('orderQtyInput')?.value || 1, 10);
  const wilayaSelect = document.getElementById('orderWilayaSelect');
  const selectedOption = wilayaSelect?.options[wilayaSelect.selectedIndex];
  const shippingFee = selectedOption && selectedOption.dataset.fee ? parseInt(selectedOption.dataset.fee, 10) : 0;

  const productTotal = APP_STATE.activeOrderProduct.price * qty;
  const grandTotal = productTotal + shippingFee;

  const subtotalEl = document.getElementById('orderSubtotalVal');
  const shippingEl = document.getElementById('orderShippingVal');
  const grandTotalEl = document.getElementById('orderGrandTotalVal');

  if (subtotalEl) subtotalEl.innerText = `${productTotal.toLocaleString()} دج`;
  if (shippingEl) shippingEl.innerText = shippingFee > 0 ? `${shippingFee.toLocaleString()} دج` : 'اختر الولاية لتحديد التوصيل';
  if (grandTotalEl) grandTotalEl.innerText = `${grandTotal.toLocaleString()} دج`;
}

// Handle Order Submission
function handleOrderFormSubmit(e) {
  e.preventDefault();
  if (!APP_STATE.activeOrderProduct) return;

  const name = document.getElementById('custFullName').value.trim();
  const phone = document.getElementById('custPhoneNum').value.trim();
  const wilayaSelect = document.getElementById('orderWilayaSelect');
  const wilayaText = wilayaSelect.options[wilayaSelect.selectedIndex]?.text || '';
  const wilayaFee = parseInt(wilayaSelect.options[wilayaSelect.selectedIndex]?.dataset.fee || 0, 10);
  const baladiya = document.getElementById('custBaladiya').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const notes = document.getElementById('custOrderNotes')?.value.trim() || '';
  const qty = parseInt(document.getElementById('orderQtyInput').value || 1, 10);

  if (!name || !phone || !wilayaText || wilayaSelect.value === '') {
    showToast("يرجى ملء جميع الحقول المطلوبة بما فيها الولاية", "error");
    return;
  }

  // Create new order object
  const newOrderId = Date.now();
  const orderNumber = `YP-${Math.floor(1000 + Math.random() * 9000)}`;

  let orderItems = [];
  if (APP_STATE.activeOrderProduct.id === 999999) {
    orderItems = APP_STATE.cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
  } else {
    orderItems = [{
      id: APP_STATE.activeOrderProduct.id,
      name: APP_STATE.activeOrderProduct.name,
      price: APP_STATE.activeOrderProduct.price,
      qty: qty
    }];
  }

  const totalProducts = orderItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const finalTotal = totalProducts + wilayaFee;

  const newOrder = {
    id: newOrderId,
    orderNumber: orderNumber,
    customerName: name,
    phone: phone,
    wilaya: wilayaText,
    baladiya: baladiya,
    address: address,
    items: orderItems,
    totalProducts: totalProducts,
    shippingFee: wilayaFee,
    total: finalTotal,
    status: 'pending',
    notes: notes,
    createdAt: new Date().toISOString()
  };

  // Prepend to orders list
  APP_STATE.orders.unshift(newOrder);
  saveOrdersToStorage();

  // If ordering cart, clear cart
  if (APP_STATE.activeOrderProduct.id === 999999) {
    APP_STATE.cart = [];
    saveCartToStorage();
  }

  closeQuickOrderModal();
  document.getElementById('quickOrderForm').reset();

  // Play audio alert & show confirmation
  playNotificationChime();
  openOrderSuccessModal(newOrder);

  // If Admin panel is open, update it instantly without reload ("بدون غمض")
  if (isAdminLoggedIn()) {
    renderAdminOrdersTable();
    updateAdminStats();
  }
}

// Order Success Receipt Modal
function openOrderSuccessModal(order) {
  const modal = document.getElementById('orderSuccessModal');
  if (!modal) return;

  document.getElementById('successOrderNumber').innerText = order.orderNumber;
  document.getElementById('successCustomerName').innerText = order.customerName;
  document.getElementById('successPhone').innerText = order.phone;
  document.getElementById('successWilaya').innerText = order.wilaya;
  document.getElementById('successTotal').innerText = `${order.total.toLocaleString()} دج`;

  // WhatsApp confirmation link
  const waBtn = document.getElementById('successWhatsAppBtn');
  if (waBtn) {
    const waMsg = encodeURIComponent(`مرحباً YOUNES PARFUM، لقد قمت بطلب العطر برقم الطلب: ${order.orderNumber} بمبلغ إجمالي: ${order.total} دج. يرجى تأكيد الشحن والتوصيل.`);
    waBtn.href = `https://wa.me/${APP_STATE.settings.whatsappNumber || '213550000000'}?text=${waMsg}`;
  }

  modal.classList.add('active');
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.remove('active');
}

// Product Details Modal
function openProductDetails(productId) {
  const product = APP_STATE.products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productDetailsModal');
  if (!modal) return;

  document.getElementById('detailProdImg').src = product.img || 'assets/logo.png';
  document.getElementById('detailProdTitle').innerText = product.name;
  document.getElementById('detailProdCategory').innerText = product.categoryName || 'عطور فاخرة';
  document.getElementById('detailProdConcentration').innerText = product.concentration || 'Extrait de Parfum';
  document.getElementById('detailProdVolume').innerText = product.volume || '100 مل';
  document.getElementById('detailProdPrice').innerText = `${Number(product.price).toLocaleString()} دج`;
  document.getElementById('detailProdDesc').innerText = product.description || '';

  const notesBox = document.getElementById('detailProdNotes');
  if (notesBox && product.notes) {
    notesBox.innerHTML = `
      <div style="background: #0f1014; padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-top: 12px;">
        <div style="margin-bottom: 8px;"><strong style="color: var(--gold-light);">افتتاحية العطر:</strong> ${product.notes.top || 'نوتات منعشة'}</div>
        <div style="margin-bottom: 8px;"><strong style="color: var(--gold-light);">قلب العطر:</strong> ${product.notes.heart || 'نوتات زهرية وخشبية'}</div>
        <div><strong style="color: var(--gold-light);">قاعدة العطر:</strong> ${product.notes.base || 'عنبر، مسك، عود'}</div>
      </div>
    `;
  }

  const buyBtn = document.getElementById('detailOrderBtn');
  if (buyBtn) {
    buyBtn.onclick = () => {
      closeProductDetailsModal();
      openQuickOrder(product.id);
    };
  }

  modal.classList.add('active');
}

function closeProductDetailsModal() {
  const modal = document.getElementById('productDetailsModal');
  if (modal) modal.classList.remove('active');
}

// ==========================================================================
// 6. SECRET ADMIN ACCESS (PIN: 2999) - REQUESTED FEATURE
// ==========================================================================

function isAdminLoggedIn() {
  return sessionStorage.getItem('yp_admin_authenticated') === 'true';
}

function triggerSecretAdminAccess() {
  // If already authenticated in current session, jump straight into admin view!
  if (isAdminLoggedIn()) {
    showAdminDashboard();
  } else {
    openPinModal();
  }
}

function openPinModal() {
  const modal = document.getElementById('adminPinModal');
  const input = document.getElementById('adminPinInput');
  const errorMsg = document.getElementById('pinErrorMsg');

  if (!modal) return;
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 200);
  }
  if (errorMsg) errorMsg.innerText = '';
  modal.classList.add('active');
}

function closePinModal() {
  const modal = document.getElementById('adminPinModal');
  if (modal) modal.classList.remove('active');
}

function verifyAdminPin() {
  const input = document.getElementById('adminPinInput');
  const errorMsg = document.getElementById('pinErrorMsg');
  const pinCard = document.querySelector('.pin-modal-card');
  const enteredPin = input ? input.value.trim() : '';

  // Check against the configured PIN (default: 2999)
  const requiredPin = APP_STATE.settings.adminPin || '2999';

  if (enteredPin === requiredPin) {
    sessionStorage.setItem('yp_admin_authenticated', 'true');
    closePinModal();
    showToast("تم فتح لوحة تحكم YOUNES PARFUM بنجاح 👑", "success");
    showAdminDashboard();
  } else {
    // Incorrect password feedback: shake + red error
    if (errorMsg) {
      errorMsg.innerText = "كلمة المرور غير صحيحة! يرجى إدخال الرمز الصحيح.";
    }
    if (pinCard) {
      pinCard.classList.remove('shake');
      void pinCard.offsetWidth; // trigger reflow
      pinCard.classList.add('shake');
    }
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function showAdminDashboard() {
  const storeView = document.getElementById('storeMainView');
  const adminView = document.getElementById('adminMainView');

  if (storeView && adminView) {
    storeView.style.display = 'none';
    adminView.classList.add('active');
    renderAdminDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function exitAdminToStore() {
  const storeView = document.getElementById('storeMainView');
  const adminView = document.getElementById('adminMainView');

  if (storeView && adminView) {
    adminView.classList.remove('active');
    storeView.style.display = 'block';
    renderStorefront();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function lockAdminAndExit() {
  sessionStorage.removeItem('yp_admin_authenticated');
  showToast("تم قفل لوحة التحكم والعودة للمتجر 🔒");
  exitAdminToStore();
}

// ==========================================================================
// 7. REAL-TIME ADMIN DASHBOARD ("تتحدث بدون غمض")
// ==========================================================================

function renderAdminDashboard() {
  updateAdminStats();
  renderAdminOrdersTable();
  renderAdminProductsTable();
  updateLiveClock();
}

// Live real-time statistics cards
function updateAdminStats() {
  const totalOrders = APP_STATE.orders.length;
  const pendingOrders = APP_STATE.orders.filter(o => o.status === 'pending').length;
  const shippingOrders = APP_STATE.orders.filter(o => o.status === 'shipping').length;
  const completedOrders = APP_STATE.orders.filter(o => o.status === 'completed').length;
  
  // Total Revenue: sum of delivered / confirmed orders
  const totalRevenue = APP_STATE.orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const totalProducts = APP_STATE.products.length;

  // Update DOM elements smoothly without blinking
  const revEl = document.getElementById('statTotalRevenue');
  const ordEl = document.getElementById('statTotalOrders');
  const pendEl = document.getElementById('statPendingOrders');
  const shipEl = document.getElementById('statShippingOrders');
  const prodEl = document.getElementById('statProductsCount');

  if (revEl) revEl.innerText = `${totalRevenue.toLocaleString()} دج`;
  if (ordEl) ordEl.innerText = totalOrders;
  if (pendEl) pendEl.innerText = pendingOrders;
  if (shipEl) shipEl.innerText = shippingOrders;
  if (prodEl) prodEl.innerText = totalProducts;

  // Update tabs badge counts
  const ordersTabBadge = document.getElementById('adminOrdersBadge');
  if (ordersTabBadge) ordersTabBadge.innerText = pendingOrders;
}

// Live Orders Management Table
function renderAdminOrdersTable() {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  const searchInput = document.getElementById('adminOrderSearch');
  const filterVal = APP_STATE.adminFilter || 'all';
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = [...APP_STATE.orders];

  if (filterVal !== 'all') {
    filtered = filtered.filter(o => o.status === filterVal);
  }

  if (query) {
    filtered = filtered.filter(o => 
      o.customerName.toLowerCase().includes(query) ||
      o.phone.includes(query) ||
      o.wilaya.toLowerCase().includes(query) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(query))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.4;"></i>
          لا توجد طلبات تطابق الفلتر المحدد حالياً.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const formattedDate = new Date(order.createdAt).toLocaleDateString('ar-DZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsSummary = (order.items || []).map(i => `${i.name} (×${i.qty})`).join('، ') || 'عطر فاخر';
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '213' + cleanPhone.substring(1) : cleanPhone;
    const waMsg = encodeURIComponent(`مرحباً أستاذ(ة) ${order.customerName}، معكم متجر YOUNES PARFUM بخصوص طلبكم رقم ${order.orderNumber}. هل تؤكدون عنوان التوصيل في ${order.wilaya}؟`);

    return `
      <tr data-order-id="${order.id}">
        <td>
          <div style="font-weight: 800; color: var(--gold-light);">${order.orderNumber || 'YP-' + order.id}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">${formattedDate}</div>
        </td>
        <td>
          <div style="font-weight: 700;">${order.customerName}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);"><i class="fas fa-map-marker-alt" style="margin-left: 4px;"></i>${order.wilaya} ${order.baladiya ? '• ' + order.baladiya : ''}</div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.88rem; direction: ltr; text-align: right;">${order.phone}</div>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <a href="https://wa.me/${waPhone}?text=${waMsg}" target="_blank" class="action-icon-btn whatsapp" title="محادثة واتساب">
              <i class="fab fa-whatsapp"></i>
            </a>
            <a href="tel:${order.phone}" class="action-icon-btn" title="اتصال هاتفي">
              <i class="fas fa-phone-alt"></i>
            </a>
          </div>
        </td>
        <td>
          <div style="font-size: 0.85rem; max-width: 250px; white-space: normal; line-height: 1.4;">${itemsSummary}</div>
          ${order.notes ? `<div style="font-size: 0.75rem; color: var(--gold-light); margin-top: 4px;"><i class="fas fa-comment-dots"></i> ${order.notes}</div>` : ''}
        </td>
        <td>
          <div style="font-weight: 900; color: var(--gold-light); font-size: 1rem;">${Number(order.total).toLocaleString()} دج</div>
          <div style="font-size: 0.72rem; color: var(--text-dim);">شامل التوصيل: ${order.shippingFee || 0} دج</div>
        </td>
        <td>
          <select class="status-select-quick" onchange="updateOrderStatusQuick(${order.id}, this.value)">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ قيد الانتظار</option>
            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>📞 تم التأكيد</option>
            <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>🚚 جاري التوصيل</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ تم التسليم</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ ملغى</option>
          </select>
        </td>
        <td>
          <div class="table-actions">
            <button class="action-icon-btn" onclick="printDeliverySlip(${order.id})" title="طباعة وصل التوصيل">
              <i class="fas fa-print"></i>
            </button>
            <button class="action-icon-btn delete" onclick="deleteOrderLive(${order.id})" title="حذف الطلب">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Instant Status Updater without Page Reload ("بدون غمض")
function updateOrderStatusQuick(orderId, newStatus) {
  const order = APP_STATE.orders.find(o => o.id === orderId);
  if (!order) return;

  order.status = newStatus;
  saveOrdersToStorage();

  // Instant UI updates without reload
  updateAdminStats();
  showToast(`تم تحديث حالة الطلب #${order.orderNumber || order.id} فورياً ✨`);
}

function deleteOrderLive(orderId) {
  if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً من النظام؟")) return;

  APP_STATE.orders = APP_STATE.orders.filter(o => o.id !== orderId);
  saveOrdersToStorage();

  renderAdminOrdersTable();
  updateAdminStats();
  showToast("تم حذف الطلب بنجاح 🗑️");
}

function filterOrdersByStatus(status, chipElement) {
  APP_STATE.adminFilter = status;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (chipElement) chipElement.classList.add('active');
  renderAdminOrdersTable();
}

// Print Delivery Slip for Algerian Courier
function printDeliverySlip(orderId) {
  const order = APP_STATE.orders.find(o => o.id === orderId);
  if (!order) return;

  let slipContainer = document.getElementById('printableSlip');
  if (!slipContainer) {
    slipContainer = document.createElement('div');
    slipContainer.id = 'printableSlip';
    document.body.appendChild(slipContainer);
  }

  const itemsHtml = (order.items || []).map(i => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${i.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${i.qty}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${(i.price * i.qty).toLocaleString()} دج</td>
    </tr>
  `).join('');

  slipContainer.innerHTML = `
    <div style="max-width: 650px; margin: 20px auto; padding: 25px; border: 2px solid #222; font-family: 'Cairo', sans-serif; direction: rtl; color: #000; background: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 15px;">
        <div>
          <h2 style="margin: 0; font-size: 22px;">YOUNES PARFUM</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #555;">متجر العطور والروائح الفاخرة • هاتف: ${APP_STATE.settings.contactPhone}</p>
        </div>
        <div style="text-align: left;">
          <h3 style="margin: 0; font-size: 18px;">وصل تسليم (Bordereau)</h3>
          <p style="margin: 4px 0 0; font-weight: bold;">رقم الطلب: ${order.orderNumber || order.id}</p>
          <p style="margin: 2px 0 0; font-size: 12px;">التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-DZ')}</p>
        </div>
      </div>

      <div style="background: #f7f7f7; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="width: 50%; padding: 4px;"><strong>الزبون:</strong> ${order.customerName}</td>
            <td style="width: 50%; padding: 4px;"><strong>الهاتف:</strong> ${order.phone}</td>
          </tr>
          <tr>
            <td style="padding: 4px;"><strong>الولاية:</strong> ${order.wilaya}</td>
            <td style="padding: 4px;"><strong>البلدية:</strong> ${order.baladiya || 'وسط المدينة'}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px;"><strong>العنوان الدقيق:</strong> ${order.address || 'حسب الاتصال بالزبون'}</td>
          </tr>
          ${order.notes ? `<tr><td colspan="2" style="padding: 4px; color: #c0392b;"><strong>ملاحظات التوصيل:</strong> ${order.notes}</td></tr>` : ''}
        </table>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 14px;">
        <thead>
          <tr style="background: #eee;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">العطر / المنتج</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center; width: 60px;">الكمية</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; width: 110px;">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <table style="width: 280px; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px;">سعر المنتجات:</td>
            <td style="padding: 4px; text-align: left; font-weight: bold;">${(order.totalProducts || order.total - (order.shippingFee || 0)).toLocaleString()} دج</td>
          </tr>
          <tr>
            <td style="padding: 4px;">سعر التوصيل:</td>
            <td style="padding: 4px; text-align: left; font-weight: bold;">${(order.shippingFee || 0).toLocaleString()} دج</td>
          </tr>
          <tr style="border-top: 2px solid #000; font-size: 17px;">
            <td style="padding: 6px 4px; font-weight: bold;">المبلغ المستحق للدفع:</td>
            <td style="padding: 6px 4px; text-align: left; font-weight: bold; color: #000;">${order.total.toLocaleString()} دج</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 12px; border-top: 1px dashed #bbb; padding-top: 10px; color: #666;">
        شكراً لتسوقكم من YOUNES PARFUM • نتمنى لكم تجربة عطرية لا تُنسى!
      </div>
    </div>
  `;

  window.print();
}

// ==========================================================================
// 8. LIVE PERFUMES CRUD ("بدون غمض")
// ==========================================================================

function renderAdminProductsTable() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  if (APP_STATE.products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          لا يوجد أي عطر مسجل حالياً. اضغط "إضافة عطر جديد" لإضافة عطورك الفاخرة!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = APP_STATE.products.map(prod => `
    <tr data-prod-id="${prod.id}">
      <td>
        <img src="${prod.img || 'assets/logo.png'}" style="width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--border-gold);" alt="${prod.name}">
      </td>
      <td>
        <div style="font-weight: 700; color: var(--text-main);">${prod.name}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">${prod.volume || '100 مل'} • ${prod.concentration || 'Eau de Parfum'}</div>
      </td>
      <td>
        <span style="background: rgba(197, 160, 89, 0.1); color: var(--gold-light); padding: 3px 8px; border-radius: 4px; font-size: 0.78rem;">
          ${prod.categoryName || prod.category}
        </span>
      </td>
      <td>
        <div style="font-weight: 800; color: var(--gold-light);">${Number(prod.price).toLocaleString()} دج</div>
        ${prod.oldPrice ? `<div style="font-size: 0.75rem; text-decoration: line-through; color: var(--text-dim);">${Number(prod.oldPrice).toLocaleString()} دج</div>` : ''}
      </td>
      <td>
        <button class="status-badge ${prod.inStock ? 'completed' : 'cancelled'}" onclick="toggleProductStock(${prod.id})" style="border: none; cursor: pointer;">
          ${prod.inStock ? 'متوفر بالمخزون ✔️' : 'نفذت الكمية ❌'}
        </button>
      </td>
      <td>
        <div class="table-actions">
          <button class="action-icon-btn" onclick="openEditProductModal(${prod.id})" title="تعديل العطر">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-icon-btn delete" onclick="deleteProductLive(${prod.id})" title="حذف العطر">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function toggleProductStock(prodId) {
  const prod = APP_STATE.products.find(p => p.id === prodId);
  if (!prod) return;
  prod.inStock = !prod.inStock;
  saveProductsToStorage();
  renderAdminProductsTable();
  updateAdminStats();
  renderStorefront();
  showToast(`تم تحديث حالة المخزون لعطر "${prod.name}"`);
}

function deleteProductLive(prodId) {
  if (!confirm("هل تريد بالتأكيد إزالة هذا العطر من المتجر؟")) return;
  APP_STATE.products = APP_STATE.products.filter(p => p.id !== prodId);
  saveProductsToStorage();
  renderAdminProductsTable();
  updateAdminStats();
  renderStorefront();
  showToast("تم حذف العطر بنجاح!");
}

function openAddProductModal() {
  document.getElementById('productFormModalTitle').innerText = 'إضافة عطر جديد للكتالوج';
  document.getElementById('editProductId').value = '';
  document.getElementById('adminProductForm').reset();
  document.getElementById('productFormModal').classList.add('active');
}

function openEditProductModal(prodId) {
  const prod = APP_STATE.products.find(p => p.id === prodId);
  if (!prod) return;

  document.getElementById('productFormModalTitle').innerText = 'تعديل بيانات العطر';
  document.getElementById('editProductId').value = prod.id;
  document.getElementById('prodFormName').value = prod.name;
  document.getElementById('prodFormCategory').value = prod.category;
  document.getElementById('prodFormPrice').value = prod.price;
  document.getElementById('prodFormOldPrice').value = prod.oldPrice || '';
  document.getElementById('prodFormVolume').value = prod.volume || '100 مل';
  document.getElementById('prodFormConcentration').value = prod.concentration || 'Extrait de Parfum';
  document.getElementById('prodFormImg').value = prod.img || '';
  document.getElementById('prodFormBadge').value = prod.badge || '';
  document.getElementById('prodFormNotesTop').value = prod.notes?.top || '';
  document.getElementById('prodFormNotesHeart').value = prod.notes?.heart || '';
  document.getElementById('prodFormNotesBase').value = prod.notes?.base || '';
  document.getElementById('prodFormDesc').value = prod.description || '';

  document.getElementById('productFormModal').classList.add('active');
}

function closeProductFormModal() {
  const modal = document.getElementById('productFormModal');
  if (modal) modal.classList.remove('active');
}

function handleSaveProductSubmit(e) {
  e.preventDefault();
  const idVal = document.getElementById('editProductId').value;
  const name = document.getElementById('prodFormName').value.trim();
  const category = document.getElementById('prodFormCategory').value;
  const price = parseFloat(document.getElementById('prodFormPrice').value);
  const oldPriceVal = document.getElementById('prodFormOldPrice').value;
  const oldPrice = oldPriceVal ? parseFloat(oldPriceVal) : null;
  const volume = document.getElementById('prodFormVolume').value.trim() || '100 مل';
  const concentration = document.getElementById('prodFormConcentration').value.trim() || 'Eau de Parfum';
  const img = document.getElementById('prodFormImg').value.trim() || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80';
  const badge = document.getElementById('prodFormBadge').value.trim();
  const topNotes = document.getElementById('prodFormNotesTop').value.trim();
  const heartNotes = document.getElementById('prodFormNotesHeart').value.trim();
  const baseNotes = document.getElementById('prodFormNotesBase').value.trim();
  const description = document.getElementById('prodFormDesc').value.trim();

  // Category name mapping
  const catNames = {
    men: 'عطور رجالية',
    women: 'عطور نسائية',
    oriental: 'عطور النيش والشرقية',
    sets: 'مجموعات وهدايا'
  };

  if (idVal) {
    // Edit existing product
    const prod = APP_STATE.products.find(p => p.id === parseInt(idVal, 10));
    if (prod) {
      prod.name = name;
      prod.category = category;
      prod.categoryName = catNames[category] || 'عطور فاخرة';
      prod.price = price;
      prod.oldPrice = oldPrice;
      prod.volume = volume;
      prod.concentration = concentration;
      prod.img = img;
      prod.badge = badge;
      prod.description = description;
      prod.notes = { top: topNotes, heart: heartNotes, base: baseNotes };
    }
    showToast(`تم تحديث بيانات "${name}" فورياً ✨`);
  } else {
    // Add new product
    const newProd = {
      id: Date.now(),
      name,
      category,
      categoryName: catNames[category] || 'عطور فاخرة',
      price,
      oldPrice,
      volume,
      concentration,
      img,
      badge: badge || 'جديد 🌟',
      rating: 5.0,
      reviewsCount: 1,
      inStock: true,
      description,
      notes: { top: topNotes, heart: heartNotes, base: baseNotes }
    };
    APP_STATE.products.unshift(newProd);
    showToast(`تمت إضافة العطر الجديد "${name}" بنجاح 🧴`);
  }

  saveProductsToStorage();
  closeProductFormModal();
  renderAdminProductsTable();
  updateAdminStats();
  renderStorefront();
}

// ==========================================================================
// 9. SETTINGS & DATA BACKUP / RESTORE
// ==========================================================================

function switchAdminTab(tabName, btnElement) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));

  if (btnElement) btnElement.classList.add('active');
  const targetPane = document.getElementById(`adminTabPane_${tabName}`);
  if (targetPane) targetPane.classList.add('active');

  if (tabName === 'settings') {
    loadSettingsIntoForm();
  }
}

function loadSettingsIntoForm() {
  document.getElementById('settingsStorePhone').value = APP_STATE.settings.contactPhone || '0550000000';
  document.getElementById('settingsStoreWhatsapp').value = APP_STATE.settings.whatsappNumber || '213550000000';
  document.getElementById('settingsAdminPin').value = APP_STATE.settings.adminPin || '2999';
  document.getElementById('settingsSoundCheck').checked = APP_STATE.settings.soundEnabled !== false;
}

function handleSaveSettings(e) {
  e.preventDefault();
  APP_STATE.settings.contactPhone = document.getElementById('settingsStorePhone').value.trim();
  APP_STATE.settings.whatsappNumber = document.getElementById('settingsStoreWhatsapp').value.trim();
  APP_STATE.settings.adminPin = document.getElementById('settingsAdminPin').value.trim() || '2999';
  APP_STATE.settings.soundEnabled = document.getElementById('settingsSoundCheck').checked;

  saveSettingsToStorage();
  showToast("تم حفظ إعدادات المتجر بنجاح ✔️");
}

// Export JSON Backup
function exportDataBackup() {
  const data = {
    products: APP_STATE.products,
    orders: APP_STATE.orders,
    settings: APP_STATE.settings,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `younes-parfum-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("تم تحميل النسخة الاحتياطية بنجاح 💾");
}

// Import JSON Backup
function importDataBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.products && Array.isArray(data.products)) {
        APP_STATE.products = data.products;
        saveProductsToStorage();
      }
      if (data.orders && Array.isArray(data.orders)) {
        APP_STATE.orders = data.orders;
        saveOrdersToStorage();
      }
      if (data.settings) {
        APP_STATE.settings = { ...DEFAULT_SETTINGS, ...data.settings };
        saveSettingsToStorage();
      }
      renderStorefront();
      renderAdminDashboard();
      showToast("تمت استعادة البيانات بنجاح! 🚀");
    } catch (err) {
      alert("خطأ في قراءة ملف النسخة الاحتياطية!");
    }
  };
  reader.readAsText(file);
}

function resetToDefaultCatalog() {
  if (!confirm("هل تريد استعادة العطور والطلبات الافتراضية؟ سيتم الاحتفاظ بنسخة في الذاكرة.")) return;
  APP_STATE.products = DEFAULT_PRODUCTS;
  APP_STATE.orders = DEFAULT_ORDERS;
  APP_STATE.settings = DEFAULT_SETTINGS;
  saveProductsToStorage();
  saveOrdersToStorage();
  saveSettingsToStorage();
  renderStorefront();
  renderAdminDashboard();
  showToast("تمت استعادة الكتالوج الافتراضي بنجاح ✨");
}

function updateLiveClock() {
  const clockEl = document.getElementById('adminLiveClock');
  if (!clockEl) return;
  const now = new Date();
  clockEl.innerText = now.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateLiveClock, 1000);

// ==========================================================================
// 10. APP INITIALIZATION & EVENT LISTENERS
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initAppState();
  renderStorefront();
  updateCartBadge();

  // Search input live filtering
  const searchInput = document.getElementById('storeSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      APP_STATE.searchQuery = e.target.value;
      renderStorefront();
    });
  }

  // Admin order search live filtering
  const adminOrderSearch = document.getElementById('adminOrderSearch');
  if (adminOrderSearch) {
    adminOrderSearch.addEventListener('input', () => {
      renderAdminOrdersTable();
    });
  }

  // Category filter tabs
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP_STATE.currentFilter = btn.dataset.filter || 'all';
      renderStorefront();
    });
  });

  // Sort select
  const sortSelect = document.getElementById('catalogSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      APP_STATE.currentSort = e.target.value;
      renderStorefront();
    });
  }

  // Wilaya change update delivery calculation
  const wilayaSelect = document.getElementById('orderWilayaSelect');
  if (wilayaSelect) {
    wilayaSelect.addEventListener('change', updateModalPricing);
  }

  const orderQtyInput = document.getElementById('orderQtyInput');
  if (orderQtyInput) {
    orderQtyInput.addEventListener('input', updateModalPricing);
  }

  // PIN input: press Enter to submit
  const pinInput = document.getElementById('adminPinInput');
  if (pinInput) {
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        verifyAdminPin();
      }
    });
  }
});
