// customer-menu/script.js
import { db } from './firebase-config.js';
import { 
    collection, 
    onSnapshot, 
    addDoc,
    doc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

class CustomerMenu {
    constructor() {
        // Firebase references
        this.restaurantId = 'restaurant_1';
        this.menuRef = collection(db, `restaurants/${this.restaurantId}/menu_items`);
        this.categoriesRef = collection(db, `restaurants/${this.restaurantId}/categories`);
        this.ordersRef = collection(db, `restaurants/${this.restaurantId}/orders`);
        this.serviceRef = collection(db, `restaurants/${this.restaurantId}/service_requests`);

        // Session management - NOW WITH LOCALSTORAGE
        this.sessionId = this.getOrCreateSessionId();
        this.sessionStartTime = this.getOrCreateSessionStartTime();
        this.sessionActive = this.getSessionActive();
        this.sessionOrders = this.loadSessionOrders();

        // Table and menu data
        this.tableNumber = this.loadTableNumber();
        this.menuItems = {};
        this.customCategories = [];
        this.defaultCategories = ['starters', 'mains', 'desserts', 'beverages'];

        // Cart and UI state - NOW WITH LOCALSTORAGE PERSISTENCE
        this.cart = this.loadCart();
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.init();
    }

    // Add this inside your CustomerMenu class
saveSessionToStorage() {
    localStorage.setItem('customer_session_id', this.sessionId);
    localStorage.setItem('customer_session_start', this.sessionStartTime.toISOString());
    localStorage.setItem('customer_session_active', this.sessionActive.toString());
    localStorage.setItem('customer_session_orders', JSON.stringify(this.sessionOrders));
    if (this.tableNumber) {
        localStorage.setItem('customer_table_number', this.tableNumber);
    }
    localStorage.setItem('customer_cart', JSON.stringify(this.cart));
    console.log('💾 Session saved to localStorage');
}

    // Add this inside your CustomerMenu class
// Add this inside your CustomerMenu class
loadTableNumber() {
    const stored = localStorage.getItem('customer_table_number');
    if (stored) {
        console.log('📱 Restored table number:', stored);
        return stored;
    }
    return null;
}
    // Add this method to handle bill requests
async askForBill() {
    // Check if there are any orders placed in this session
    if (this.sessionOrders.length === 0) {
        alert('No orders placed in this session. Add some items first!');
        return;
    }

    // Confirm if user wants to end session and get bill
    if (confirm('Are you ready to end your dining session and receive your bill?')) {
        await this.endSession();
    }
}
async placeOrder() {
    if (this.cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    if (!this.tableNumber) {
        alert('Please select your table number first!');
        return;
    }

    const orderButton = document.getElementById('place-order-btn');
    const originalText = orderButton.textContent;
    orderButton.textContent = 'Sending to Kitchen...';
    orderButton.disabled = true;

    try {
        const order = {
            sessionId: this.sessionId,
            tableNumber: this.tableNumber,
            items: [...this.cart],
            status: 'pending',
            timestamp: new Date(),
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            orderNumber: this.sessionOrders.length + 1,
            restaurantId: this.restaurantId
        };

        console.log('📝 Placing order:', order);
        const docRef = await addDoc(this.ordersRef, order);
        console.log('✅ Order placed successfully');

        // Add to IN-MEMORY session orders only
        this.sessionOrders.push({ ...order, id: docRef.id });

        // Clear cart - fresh for next order
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();

        // UPDATE BUTTON VISIBILITY - This is the key line!
        this.updateSessionButtons();

        this.closeCart?.();
        this.showOrderConfirmation?.(order);
    } catch (error) {
        console.error('❌ Error placing order:', error);
        alert('Failed to place order. Please try again.');
    } finally {
        orderButton.textContent = originalText;
        orderButton.disabled = false;
    }
    this.saveSessionToStorage();
}



    init() {
    this.hideLoadingScreen();
    this.detectTableNumber();
    this.setupEventListeners();
    this.setupSessionTimer();
    this.loadCustomCategories();
    this.loadMenuItems();
    
    // Initialize button visibility
    this.updateSessionButtons();

    setTimeout(() => {
    this.checkSessionRestoration();
    // Update display with restored data
    this.updateCartDisplay();
    this.updateSessionStats?.();
}, 1000);
}

checkSessionRestoration() {
    const hasStoredSession = localStorage.getItem('customer_session_id');
    if (hasStoredSession && this.sessionOrders.length > 0) {
        console.log('📱 Session restored with', this.sessionOrders.length, 'previous orders');
        this.displayRestorationMessage();
    }
}

displayRestorationMessage() {
    // Show a brief toast that session was restored
    const toast = document.createElement('div');
    toast.className = 'session-restored-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="material-symbols-outlined">refresh</span>
            <span>Session restored • ${this.sessionOrders.length} orders found</span>
        </div>
    `;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--success);
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        z-index: 2000;
        animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}


    // Add this method to your CustomerMenu class
// Updated method to control button visibility properly
updateSessionButtons() {
    const viewCartBtn = document.getElementById('view-cart-btn');
    const askBillBtn = document.getElementById('ask-bill-btn');
    
    // "View Cart" button is ALWAYS visible (this is the key change)
    if (viewCartBtn) {
        viewCartBtn.style.display = 'inline-block';
    }
    
    // "Ask for Bill" button only visible if customer has placed at least one order
    if (askBillBtn) {
        if (this.sessionOrders.length > 0) {
            askBillBtn.style.display = 'inline-block';
        } else {
            askBillBtn.style.display = 'none';
        }
    }
    
    console.log(`🔄 Button visibility updated - View Cart: always visible, Ask for Bill: ${this.sessionOrders.length > 0 ? 'visible' : 'hidden'}`);
}



    setupSmoothScrolling() {
    // Add smooth scroll behavior to the main container
    const menuContainer = document.querySelector('.menu-container');
    if (menuContainer) {
        menuContainer.style.scrollBehavior = 'smooth';
    }
}

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }
    }

    // Session Management - REMOVED LOCALSTORAGE METHODS
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `session_${timestamp}_${random}`;
    }

    // Session ID management
getOrCreateSessionId() {
    const stored = localStorage.getItem('customer_session_id');
    if (stored) {
        console.log('📱 Restored session ID:', stored);
        return stored;
    }
    const newId = this.generateSessionId();
    localStorage.setItem('customer_session_id', newId);
    console.log('📱 Created new session ID:', newId);
    return newId;
}

getOrCreateSessionStartTime() {
    const stored = localStorage.getItem('customer_session_start');
    if (stored) {
        const startTime = new Date(stored);
        console.log('📱 Restored session start time:', startTime);
        return startTime;
    }
    const newStartTime = new Date();
    localStorage.setItem('customer_session_start', newStartTime.toISOString());
    console.log('📱 Created new session start time:', newStartTime);
    return newStartTime;
}

getSessionActive() {
    const stored = localStorage.getItem('customer_session_active');
    return stored ? stored === 'true' : true;
}

    setupSessionTimer() {
        setInterval(() => {
            if (this.sessionActive) {
                this.updateSessionTimer();
            }
        }, 1000);
    }

    updateSessionTimer() {
        const now = new Date();
        const elapsed = Math.floor((now - this.sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timerElement = document.getElementById('session-time');
        if (timerElement) {
            timerElement.textContent = `Session: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Table Number Management - SIMPLIFIED
    detectTableNumber() {
        const urlParams = new URLSearchParams(window.location.search);
        const tableFromURL = urlParams.get('table');
        
        if (tableFromURL && this.isValidTableNumber(tableFromURL)) {
            this.tableNumber = tableFromURL;
            this.displayTableInfo(tableFromURL);
        } else {
            this.showTableSelector();
        }
    }

    showTableSelector() {
        const overlay = document.getElementById('table-selector-overlay');
        const tableGrid = document.getElementById('table-grid');
        
        if (!overlay || !tableGrid) return;
        
        let buttonsHTML = '';
        for (let i = 1; i <= 30; i++) {
            buttonsHTML += `
                <button class="table-btn" onclick="customerMenu.selectTable(${i})">
                    Table ${i}
                </button>
            `;
        }
        tableGrid.innerHTML = buttonsHTML;
        overlay.classList.add('active');
    }

    isValidTableNumber(tableNumber) {
        const num = parseInt(tableNumber);
        return num > 0 && num <= 50;
    }

    selectTable(tableNumber) {
        this.tableNumber = tableNumber;
        this.displayTableInfo(tableNumber);
        this.saveSessionToStorage();
        
        const overlay = document.getElementById('table-selector-overlay');
        overlay.classList.remove('active');
        
        const newURL = new URL(window.location);
        newURL.searchParams.set('table', tableNumber);
        window.history.replaceState({}, '', newURL);
    }

    displayTableInfo(tableNumber) {
        const tableElement = document.getElementById('table-number');
        if (tableElement) {
            tableElement.textContent = tableNumber;
        }
    }

    // Cart Management - SIMPLIFIED WITHOUT PERSISTENCE
    addToCart(itemId) {
        const allItems = Object.values(this.menuItems).flat();
        const item = allItems.find(i => i.id === itemId);
        
        if (!item) {
            console.error('Item not found:', itemId);
            return;
        }
        
        const existingItem = this.cart.find(cartItem => cartItem.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                imageUrl: item.imageUrl,
                category: item.category,
                description: item.description, // Keep description for cart
                quantity: 1
            });
        }
        
        this.saveCart(); // Save to localStorage
        this.updateCartDisplay();
        this.displayMenuItems?.();
        console.log('✅ Added to cart:', item.name);
    }

    updateCartItem(itemId, newQuantity) {
    if (newQuantity <= 0) {
        this.cart = this.cart.filter(item => item.id !== itemId);
    } else {
        const cartItem = this.cart.find(item => item.id === itemId);
        if (cartItem) {
            cartItem.quantity = newQuantity;
        }
    }
    
    this.saveCart();
    this.updateCartDisplay();
    this.updateCartSummary();
    this.displayMenuItems?.();
    this.saveSessionToStorage();

    // Re-render cart modal for dynamic update
    this.viewCart();
}
updateCartSummary() {
    // Update cart subtotal and total in the cart modal
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update subtotal display
    const subtotalElement = document.querySelector('.cart-summary .summary-row span:last-child');
    if (subtotalElement) {
        subtotalElement.textContent = `₹${subtotal}`;
    }
    
    // Update total display
    const totalElement = document.querySelector('.total-row span:last-child');
    if (totalElement) {
        totalElement.textContent = `₹${subtotal}`;
    }
    
    // Update cart items count
    const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartItemsHeader = document.querySelector('.cart-header h3');
    if (cartItemsHeader) {
        cartItemsHeader.textContent = `Cart Items (${itemCount})`;
    }
}

    // NEW: Scroll to top of menu
scrollToTop() {
    const menuContent = document.querySelector('.menu-content');
    if (menuContent) {
        menuContent.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// NEW: Scroll to specific category section
scrollToCategory(category) {
    // Ensure menu is rendered before scrolling
    setTimeout(() => {
        const categorySection = document.getElementById(`category-${category}`);
        if (categorySection) {
            // Calculate offset for sticky headers
            const headerHeight = document.querySelector('.menu-header')?.offsetHeight || 0;
            const categoryNavHeight = document.querySelector('.category-nav')?.offsetHeight || 0;
            const offset = headerHeight + categoryNavHeight + 20; // 20px extra padding

            const elementPosition = categorySection.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }, 100);
}
// NEW: Render category section with ID for scrolling
renderCategorySection(category, items) {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    
    let sectionHTML = `
        <div class="menu-section" id="category-${category}">
            <div class="section-header">
                <h2 class="section-title">${categoryName}</h2>
                <span class="section-count">${items.length} items</span>
            </div>
            <div class="items-list">
    `;

    items.forEach(item => {
        sectionHTML += this.renderMenuItem(item);
    });

    sectionHTML += `
            </div>
        </div>
    `;

    return sectionHTML;
}


    updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartFloat = document.getElementById('cart-float');
    const continueBtn = document.getElementById('continue-btn');
    const placeOrderBtn = document.getElementById('place-order-btn'); // Add this line
    
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = totalAmount;
    
    if (cartFloat) {
        cartFloat.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    if (continueBtn) {
        continueBtn.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }

    // ADD THIS BLOCK - Disable place order button when cart is empty
    if (placeOrderBtn) {
        placeOrderBtn.disabled = totalItems === 0;
        if (totalItems === 0) {
            placeOrderBtn.style.opacity = '0.5';
            placeOrderBtn.style.cursor = 'not-allowed';
        } else {
            placeOrderBtn.style.opacity = '1';
            placeOrderBtn.style.cursor = 'pointer';
        }
    }

    this.updateSessionStats?.();
}


    updateSessionStats() {
        const sessionItemsEl = document.getElementById('session-items');
        const sessionTotalEl = document.getElementById('session-total');
        
        const sessionOrdersTotal = this.sessionOrders.reduce((sum, order) => sum + order.total, 0);
        const sessionOrdersItems = this.sessionOrders.reduce((sum, order) => 
            sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );
        
        const cartTotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cartItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const totalSessionItems = sessionOrdersItems + cartItems;
        const totalSessionAmount = sessionOrdersTotal + cartTotal;
        
        if (sessionItemsEl) {
            sessionItemsEl.textContent = `${totalSessionItems} items ordered`;
        }
        
        if (sessionTotalEl) {
            sessionTotalEl.textContent = `Session Total: ₹${totalSessionAmount}`;
        }
    }

    // Order Placement - CLEAN SESSION TRACKING
    async placeOrder() {
        // ADD THIS CHECK - Extra safety to prevent order placement with empty cart
        if (this.cart.length === 0) {
            console.log('Cannot place order: Cart is empty');
            return;
        }

        if (!this.tableNumber) {
            alert('Please select your table number first!');
            return;
        }

        const orderButton = document.getElementById('place-order-btn');
        const originalText = orderButton.textContent;
        orderButton.textContent = 'Sending to Kitchen...';
        orderButton.disabled = true;

        try {
            const order = {
                sessionId: this.sessionId,
                tableNumber: this.tableNumber,
                items: [...this.cart],
                status: 'pending',
                timestamp: new Date(),
                total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                orderNumber: this.sessionOrders.length + 1,
                restaurantId: this.restaurantId
            };

            console.log('📝 Placing order:', order);
            const docRef = await addDoc(this.ordersRef, order);
            console.log('✅ Order placed successfully');

            // Add to IN-MEMORY session orders only
            this.sessionOrders.push({ ...order, id: docRef.id });

            // Clear cart - fresh for next order
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();

            // Update button visibility after first order
            this.updateSessionButtons();

            this.closeCart?.();
            this.showOrderConfirmation?.(order);

        } catch (error) {
            console.error('❌ Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            orderButton.textContent = originalText;
            orderButton.disabled = false;
        }
    }

    // Session End - CLEAN WITHOUT PERSISTENCE
    confirmEndSession() {
        if (this.cart.length > 0) {
            alert('Please place your current cart order before ending the session.');
            return;
        }
        
        if (this.sessionOrders.length === 0) {
            alert('No orders placed in this session. Add some items first!');
            return;
        }
        
        if (confirm('Are you ready to end your dining session and receive your bill?')) {
            this.endSession();
        }
    }

    async endSession() {
        this.sessionActive = false;
        this.clearSessionData();
        
        // Generate and display the bill
        this.generateBill();
        
        // Optional: Clear all session data (if you want to prevent going back)
        setTimeout(() => {
            // Clear session storage if you're using any
            sessionStorage.clear();
            localStorage.clear();
            console.log('🧹 Session ended and storage cleared');
        }, 1000);
    }

    // Bill Generation - CLEAN SESSION DATA
    calculateBill() {
        // Only use current session orders (no localStorage pollution)
        const subtotal = this.sessionOrders.reduce((sum, order) => sum + order.total, 0);
        const serviceCharge = Math.round(subtotal * 0.10);
        const gst = Math.round((subtotal + serviceCharge) * 0.05);
        const total = subtotal + serviceCharge + gst;

        return {
            sessionId: this.sessionId,
            tableNumber: this.tableNumber,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            orders: this.sessionOrders, // Clean session data only
            subtotal: subtotal,
            serviceCharge: serviceCharge,
            gst: gst,
            total: total,
            itemCount: this.sessionOrders.reduce((sum, order) => 
                sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
            )
        };
    }

    startNewSession() {
        // Clear localStorage before reload
        localStorage.removeItem('customer_session_id');
        localStorage.removeItem('session_start_time');
        localStorage.removeItem('session_cart');
        localStorage.removeItem('session_orders');
        this.clearSessionData();
        console.log('🧹 Cleared session data for new session');
        // Simple page reload for fresh session
        window.location.reload();
    }

    // Menu Data Loading - FIXED VERSION
    async loadCustomCategories() {
        try {
            // Simple listener without complex queries
            onSnapshot(this.categoriesRef, (snapshot) => {
                this.customCategories = [];
                snapshot.forEach((doc) => {
                    this.customCategories.push({ id: doc.id, ...doc.data() });
                });
                console.log('📂 Loaded custom categories:', this.customCategories.length);
                this.displayCategories();
            }, (error) => {
                console.log('Categories not found, using defaults:', error.message);
            });
        } catch (error) {
            console.error('❌ Error loading categories:', error);
        }
    }

    loadMenuItems() {
        console.log('👀 Loading menu items...');
        
        // FIXED: Simple query without complex ordering to avoid index issues
        onSnapshot(this.menuRef, (snapshot) => {
            console.log('🔄 Menu snapshot received, size:', snapshot.size);
            
            this.menuItems = {};
            const recommendedItems = [];
            
            snapshot.forEach((doc) => {
                const item = { id: doc.id, ...doc.data() };
                console.log('📄 Processing item:', item.name, 'Available:', item.available);
                
                // Only show available items
                if (item.available) {
                    // Group by category
                    if (!this.menuItems[item.category]) {
                        this.menuItems[item.category] = [];
                    }
                    this.menuItems[item.category].push(item);
                    
                    // Collect recommended items
                    if (item.isRecommended || item.isBestseller || item.isNew) {
                        recommendedItems.push(item);
                    }
                }
            });
            
            // Sort items within categories by priority (client-side)
            Object.keys(this.menuItems).forEach(category => {
                this.menuItems[category].sort((a, b) => {
                    return (b.displayPriority || 5) - (a.displayPriority || 5);
                });
            });
            
            console.log('✅ Menu items organized:', Object.keys(this.menuItems));
            console.log('📊 Items by category:', Object.keys(this.menuItems).map(cat => 
                `${cat}: ${this.menuItems[cat].length}`
            ));
            
            this.displayRecommendations(recommendedItems);
            this.displayMenuItems();
            this.displayCategories();
            this.hideMenuLoading();
            
        }, (error) => {
            console.error('❌ Error loading menu:', error);
            this.showErrorMessage('Failed to load menu items. Please refresh the page.');
        });
    }

    hideMenuLoading() {
        const loadingElement = document.getElementById('menu-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showErrorMessage(message) {
        const menuContainer = document.getElementById('menu-items');
        if (menuContainer) {
            menuContainer.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <h3>❌ ${message}</h3>
                    <button onclick="location.reload()" style="margin-top: 16px; padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    // Categories Display
    displayCategories() {
        const categoryScroll = document.getElementById('category-scroll');
        if (!categoryScroll) return;
        
        const allCategories = [...this.defaultCategories, ...this.customCategories.map(c => c.name)];
        
        let categoriesHTML = `
            <button class="category-btn ${this.currentCategory === 'all' ? 'active' : ''}" 
                    onclick="customerMenu.filterByCategory('all')">
                All Items
            </button>
        `;
        
        allCategories.forEach(category => {
            if (this.menuItems[category] && this.menuItems[category].length > 0) {
                const isActive = this.currentCategory === category ? 'active' : '';
                const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                categoriesHTML += `
                    <button class="category-btn ${isActive}" onclick="customerMenu.filterByCategory('${category}')">
                        ${categoryName} (${this.menuItems[category].length})
                    </button>
                `;
            }
        });
        
        categoryScroll.innerHTML = categoriesHTML;
    }

    // UPDATED: Filter by Category with Smooth Scrolling
    filterByCategory(category) {
        this.currentCategory = category;
        this.searchTerm = '';

        // Clear search input
        const searchInput = document.getElementById('menu-search');
        if (searchInput) {
            searchInput.value = '';
        }

        // Update category buttons
        this.displayCategories();

        if (category === 'all') {
            // For "All Items", scroll to the top of menu content
            this.scrollToTop();
        } else {
            // For specific categories, scroll to that category section
            this.scrollToCategory(category);
        }

        console.log('📂 Filtered by category:', category);
    }

    scrollToTop() {
        const menuContainer = document.querySelector('.menu-container');
        if (menuContainer) {
            menuContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    scrollToCategory(category) {
        // Ensure menu is rendered before scrolling
        setTimeout(() => {
            const categorySection = document.getElementById(`category-${category}`);
            if (categorySection) {
                // Calculate offset for sticky headers
                const headerHeight = document.querySelector('.menu-header')?.offsetHeight || 0;
                const categoryNavHeight = document.querySelector('.category-nav')?.offsetHeight || 0;
                const offset = headerHeight + categoryNavHeight + 20; // 20px extra padding

                const elementPosition = categorySection.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }

    // Recommendations Display
    // UPDATED: Remove banner display - recommendations will show in regular list with badges
displayRecommendations(recommendedItems) {
    // Hide the banner completely
    const banner = document.getElementById('recommendations-banner');
    if (banner) {
        banner.style.display = 'none';
    }
    
    // No need to create separate recommendation display
    // They will be shown in regular menu list with badges
    console.log('📌 Recommended items will show with badges in regular menu');
}


    // Menu Items Display
    displayMenuItems() {
        const menuContainer = document.getElementById('menu-items');
        if (!menuContainer) return;
        
        let filteredItems = this.getFilteredItems();
        let menuHTML = '';
        
        console.log('🎯 Displaying items for category:', this.currentCategory);
        console.log('📋 Filtered items:', Object.keys(filteredItems));
        
        if (Object.keys(filteredItems).length === 0) {
            menuHTML = this.getEmptyStateHTML();
        } else {
            if (this.currentCategory === 'all') {
                // Show all categories
                Object.keys(filteredItems).sort().forEach(category => {
                    menuHTML += this.createCategorySection(category, filteredItems[category]);
                });
            } else {
                // Show specific category
                if (filteredItems[this.currentCategory]) {
                    menuHTML = this.createCategorySection(this.currentCategory, filteredItems[this.currentCategory]);
                }
            }
        }
        
        menuContainer.innerHTML = menuHTML;
        this.hideMenuLoading();
    }

    getFilteredItems() {
        let items = { ...this.menuItems };
        
        // Apply category filter
        if (this.currentCategory !== 'all') {
            items = this.menuItems[this.currentCategory] ? 
                { [this.currentCategory]: this.menuItems[this.currentCategory] } : {};
        }
        
        // Apply search filter
        if (this.searchTerm) {
            const filtered = {};
            Object.keys(items).forEach(category => {
                const categoryItems = items[category].filter(item => {
                    const searchLower = this.searchTerm.toLowerCase();
                    return item.name.toLowerCase().includes(searchLower) ||
                           (item.description && item.description.toLowerCase().includes(searchLower));
                });
                
                if (categoryItems.length > 0) {
                    filtered[category] = categoryItems;
                }
            });
            return filtered;
        }
        
        return items;
    }

    getEmptyStateHTML() {
        if (this.searchTerm) {
            return `
                <div class="empty-search" style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3>No items found</h3>
                    <p>Try searching for something else</p>
                    <button onclick="customerMenu.clearSearch()" style="margin-top: 16px; padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Clear Search
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="empty-category" style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📂</div>
                    <h3>No items in this category</h3>
                    <p>Check out our other delicious offerings</p>
                </div>
            `;
        }
    }

    // --- START: UPDATED HTML GENERATION FUNCTIONS ---

    createCategorySection(category, items) {
        if (!items || items.length === 0) return '';
        
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        // UPDATED to use <ul> and a different class
        let sectionHTML = `
            <div class="menu-section" id="category-${category}">
                <div class="section-header">
                    <h2 class="section-title">${categoryName}</h2>
                    <span class="section-count">${items.length} items</span>
                </div>
                <ul class="items-list">
        `;
        
        items.forEach(item => {
            sectionHTML += this.createMenuItemCard(item); // This function is now different
        });
        
        sectionHTML += '</ul></div>';
        return sectionHTML;
    }

    createMenuItemCard(item) {
        const cartItem = this.cart.find(cartItem => cartItem.id === item.id);
        const quantity = cartItem ? cartItem.quantity : 0;

        // UPDATED: Add badge for recommended items
        let badgeHTML = '';
        if (item.isRecommended || item.isBestseller || item.isNew) {
            let badgeText = '';
            let badgeClass = '';
            
            if (item.isRecommended) {
                badgeText = "Chef's Pick";
                badgeClass = 'recommended';
            } else if (item.isBestseller) {
                badgeText = 'Bestseller';
                badgeClass = 'bestseller';
            } else if (item.isNew) {
                badgeText = 'New';
                badgeClass = 'new';
            }
            
            badgeHTML = `<div class="item-badge ${badgeClass}">${badgeText}</div>`;
        }

        // Update the image container to include badge
        const imageHTML = item.imageUrl 
            ? `<div class="item-image-container-list">
                    <img src="${item.imageUrl}" alt="${item.name}" class="item-image-list" loading="lazy">
                    ${badgeHTML}
               </div>`
            : `<div class="item-image-container-list">
                    <div class="no-image-list">🍽️</div>
                    ${badgeHTML}
               </div>`;

        // Use imageHTML in the returned HTML
        return `
            <li class="menu-item-list-entry" onclick="customerMenu.showItemDetails('${item.id}')">
                ${imageHTML}
                <div class="item-content-list">
                    <div class="item-header-list">
                        <h3 class="item-name-list">${item.name}</h3>
                        <span class="item-price-list">₹${item.price}</span>
                    </div>
                    <p class="item-description-list">${item.description || ''}</p>
                    <div class="item-actions-list" onclick="event.stopPropagation();">
                        ${quantity > 0 ? 
                            this.getQuantityControls(item.id, quantity) :
                            this.getAddToCartButton(item)
                        }
                    </div>
                </div>
            </li>
        `;
    }

    // --- END: UPDATED HTML GENERATION FUNCTIONS ---


    getItemBadges(item) {
        const badges = [];
        if (item.isRecommended) badges.push('<span class="badge recommended">⭐ Chef\'s Special</span>');
        if (item.isBestseller) badges.push('<span class="badge bestseller">🔥 Best Seller</span>');
        if (item.isNew) badges.push('<span class="badge new">✨ New</span>');
        if (item.isSpicy) badges.push('<span class="badge spicy">🌶️</span>');
        if (item.isVegetarian) badges.push('<span class="badge vegetarian">🥬</span>');
        return badges;
    }

    getItemFeatures(item) {
        const features = [];
        if (item.isSpicy) features.push('<span class="feature-tag">🌶️ Spicy</span>');
        if (item.isVegetarian) features.push('<span class="feature-tag">🥬 Vegetarian</span>');
        
        return features.length > 0 ? 
            `<div class="item-features">${features.join('')}</div>` : '';
    }

    getQuantityControls(itemId, quantity) {
        return `
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="customerMenu.updateCartItem('${itemId}', ${quantity - 1})">
                    −
                </button>
                <span class="quantity-display">${quantity}</span>
                <button class="quantity-btn" onclick="customerMenu.updateCartItem('${itemId}', ${quantity + 1})">
                    +
                </button>
            </div>
        `;
    }

    getAddToCartButton(item) {
        // UPDATED to be a simpler button for the list view
        return `
            <button class="add-to-cart-btn" onclick="customerMenu.addToCart('${item.id}')">
                Add
            </button>
        `;
    }

    estimatePrepTime(category) {
        const times = {
            starters: '8-12 min',
            mains: '15-25 min',
            desserts: '5-10 min',
            beverages: '2-5 min'
        };
        return times[category] || '10-15 min';
    }

    // Search Functionality
    searchMenu(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchTerm = searchTerm;
            this.displayMenuItems();
            
            if (searchTerm.length >= 2) {
                this.showSearchSuggestions(searchTerm);
            } else {
                this.hideSearchSuggestions();
            }
        }, 300);
    }

    showSearchSuggestions(searchTerm) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;
        
        const allItems = Object.values(this.menuItems).flat();
        const matches = allItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        ).slice(0, 5);
        
        if (matches.length > 0) {
            let suggestionsHTML = '';
            matches.forEach(item => {
                suggestionsHTML += `
                    <div class="suggestion-item" onclick="customerMenu.selectSuggestion('${item.id}')">
                        <span class="suggestion-name">${item.name} - ₹${item.price}</span>
                        <small class="suggestion-category">${item.category}</small>
                    </div>
                `;
            });
            suggestionsContainer.innerHTML = suggestionsHTML;
            suggestionsContainer.style.display = 'block';
        } else {
            this.hideSearchSuggestions();
        }
    }

    selectSuggestion(itemId) {
        this.hideSearchSuggestions();
        this.showItemDetails(itemId);
    }

    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('menu-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.searchTerm = '';
        this.hideSearchSuggestions();
        this.displayMenuItems();
    }

    // Cart Modal
    viewCart() {
        const modal = document.getElementById('cart-modal');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartSummary = document.getElementById('cart-summary');
        
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon"><span class="material-symbols-outlined">
shopping_cart_checkout
</span></div>
                    <p>Your cart is empty</p>
                    <span>Add some delicious items to get started!</span>
                </div>
            `;
            if(cartSummary) cartSummary.style.display = 'none';
        } else {
            let cartHTML = '';
            this.cart.forEach(item => {
                // UPDATED cart item HTML for consistency
                cartHTML += `
                    <div class="cart-item" data-item-id="${item.id}">
                        <div class="cart-item-image">
                            ${item.imageUrl ? 
                                `<img src="${item.imageUrl}" alt="${item.name}">` : 
                                `<div class="no-image">🍽️</div>`
                            }
                        </div>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">₹${item.price} each</div>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="customerMenu.decreaseCartItem('${item.id}')">-</button>
                                <span class="quantity-display">${item.quantity}</span>
                                <button class="quantity-btn" onclick="customerMenu.increaseCartItem('${item.id}')">+</button>
                            </div>
                        </div>
                        <div class="cart-item-total">₹${item.price * item.quantity}</div>
                    </div>
                `;
            });
            
            cartItemsContainer.innerHTML = cartHTML;
            this.updateCartSummary();
            if(cartSummary) cartSummary.style.display = 'block';
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        document.getElementById('subtotal').textContent = subtotal;
        document.getElementById('item-count').textContent = itemCount;
        document.getElementById('modal-total').textContent = subtotal;
    }

    closeCart() {
        const modal = document.getElementById('cart-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Order Placement
    async placeOrder() {
        // ADD THIS CHECK - Extra safety to prevent order placement with empty cart
        if (this.cart.length === 0) {
            console.log('Cannot place order: Cart is empty');
            return;
        }

        if (!this.tableNumber) {
            alert('Please select your table number first!');
            return;
        }

        const orderButton = document.getElementById('place-order-btn');
        const originalText = orderButton.textContent;
        orderButton.textContent = 'Sending to Kitchen...';
        orderButton.disabled = true;

        try {
            const order = {
                sessionId: this.sessionId,
                tableNumber: this.tableNumber,
                items: [...this.cart],
                status: 'pending',
                timestamp: new Date(),
                total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                orderNumber: this.sessionOrders.length + 1,
                restaurantId: this.restaurantId
            };

            console.log('📝 Placing order:', order);
            const docRef = await addDoc(this.ordersRef, order);
            console.log('✅ Order placed successfully');

            // Add to IN-MEMORY session orders only
            this.sessionOrders.push({ ...order, id: docRef.id });

            // Clear cart - fresh for next order
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();

            // Update button visibility after first order
            this.updateSessionButtons();

            this.closeCart?.();
            this.showOrderConfirmation?.(order);

        } catch (error) {
            console.error('❌ Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            orderButton.textContent = originalText;
            orderButton.disabled = false;
        }
    }

    showOrderConfirmation(order) {
        const modal = document.getElementById('confirmation-modal');
        const title = document.getElementById('confirmation-title');
        const message = document.getElementById('confirmation-message');
        const details = document.getElementById('confirmation-order-details');
        
        if (title) title.textContent = `Order #${order.orderNumber} Sent to Kitchen!`;
        if (message) message.textContent = 'Your order has been successfully sent to our kitchen.';
        
        if (details) {
            let detailsHTML = `
                <div class="order-summary-card">
                    <div class="order-meta">
                        <span>Order #${order.orderNumber}</span>
                        <span>${order.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div class="order-total">Total: ₹${order.total}</div>
                </div>
            `;
            details.innerHTML = detailsHTML;
        }
        
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                this.closeConfirmationModal();
            }, 3000);
        }
    }

    closeConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Item Details Modal
    // showItemDetails(itemId) {
    //     const allItems = Object.values(this.menuItems).flat();
    //     const item = allItems.find(i => i.id === itemId);
        
    //     if (!item) return;
        
    //     const modal = document.getElementById('item-modal');
    //     const modalBody = document.getElementById('item-modal-body');
        
    //     if (!modalBody) return;
        
    //     const badges = this.getItemBadges(item);
    //     const cartItem = this.cart.find(cartItem => cartItem.id === item.id);
    //     const quantity = cartItem ? cartItem.quantity : 0;
        
    //     modalBody.innerHTML = `
    //         <div class="item-modal-image-container">
    //             <img src="${item.imageUrl}" alt="${item.name}">
    //         </div>
    //         <div class="item-modal-details">
    //             <h2>${item.name}</h2>
    //             <p>${item.description}</p>
    //             <div class="item-modal-price">₹${item.price}</div>
    //             <!-- Add more details as needed -->
    //         </div>
    //     `;
        
    //     modal.classList.add('active');
    //     document.body.style.overflow = 'hidden';
    // }

    updateItemModal(itemId) {
        const cartItem = this.cart.find(item => item.id === itemId);
        const quantityDisplay = document.getElementById(`modal-quantity-${itemId}`);
        
        if (quantityDisplay) {
            const newQuantity = cartItem ? cartItem.quantity : 0;
            quantityDisplay.textContent = newQuantity;
            
            if (newQuantity === 0) {
                this.showItemDetails(itemId);
            }
        }
    }

    // closeItemModal() {
    //     const modal = document.getElementById('item-modal');
    //     if (modal) {
    //         modal.classList.remove('active');
    //         document.body.style.overflow = '';
    //     }
    // }

    // Service Requests
    async requestService(type) {
        if (!this.tableNumber) {
            alert('Please select your table number first');
            return;
        }

        const serviceMessages = {
            water: 'Water requested for table',
            napkin: 'Napkins requested for table', 
            waiter: 'Waiter assistance requested for table'
        };

        try {
            const serviceRequest = {
                tableNumber: this.tableNumber,
                type: type,
                message: `${serviceMessages[type]} ${this.tableNumber}`,
                timestamp: new Date(),
                status: 'pending',
                sessionId: this.sessionId
            };

            await addDoc(this.serviceRef, serviceRequest);
            
            // Show confirmation
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '✓ Requested';
            button.style.background = 'rgba(46, 204, 113, 0.3)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 3000);

        } catch (error) {
            console.error('❌ Error requesting service:', error);
            alert('Failed to request service. Please try again.');
        }
    }

    // Session End
    confirmEndSession() {
        if (this.cart.length > 0) {
            alert('Please place your current cart order before ending the session.');
            return;
        }
        
        if (this.sessionOrders.length === 0) {
            alert('No orders placed in this session. Add some items first!');
            return;
        }
        
        if (confirm('Are you ready to end your dining session and receive your bill?')) {
            this.endSession();
        }
    }

    async endSession() {
        this.sessionActive = false;
        
        // Generate and display the bill
        this.generateBill();
        
        // Optional: Clear all session data (if you want to prevent going back)
        setTimeout(() => {
            // Clear session storage if you're using any
            sessionStorage.clear();
            localStorage.clear();
            console.log('🧹 Session ended and storage cleared');
        }, 1000);
    }

    generateBill() {
        const bill = this.calculateBill();
        this.displayBill(bill);
    }

    calculateBill() {
        // Only use current session orders (no localStorage pollution)
        const subtotal = this.sessionOrders.reduce((sum, order) => sum + order.total, 0);
        const serviceCharge = Math.round(subtotal * 0.10);
        const gst = Math.round((subtotal + serviceCharge) * 0.05);
        const total = subtotal + serviceCharge + gst;

        return {
            sessionId: this.sessionId,
            tableNumber: this.tableNumber,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            orders: this.sessionOrders, // Clean session data only
            subtotal: subtotal,
            serviceCharge: serviceCharge,
            gst: gst,
            total: total,
            itemCount: this.sessionOrders.reduce((sum, order) => 
                sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
            )
        };
    }

    displayBill(bill) {
        const billHTML = `
            <div class="bill-container premium-fade-in">
                <div class="bill-header">
                    <div class="bill-restaurant-name">SahuJi's - Dosa Cafe</div>
                    <div class="bill-details">
                        Excellence in Every Bite<br>
                        Subhash Nagar, Korba, Chhattisgarh 495677<br>
                        Phone: +91 7089999180<br>
                        GSTIN: 22XXXXX1234X1ZX
                    </div>
                </div>
                
                <div class="bill-content">
                    <div class="bill-meta">
                        <div class="bill-info">
                            <div><strong>Table:</strong> ${bill.tableNumber}</div>
                            <div><strong>Date:</strong> ${bill.date}</div>
                            <div><strong>Time:</strong> ${bill.time}</div>
                            <div><strong>Session:</strong> ${bill.sessionDuration}</div>
                        </div>
                        <div class="bill-session">
                            <div class="session-id">Session ID:</div>
                            <div class="session-code">${bill.sessionId.substr(-8).toUpperCase()}</div>
                        </div>
                    </div>
                    
                    <div class="bill-items">
                        <h3>Order Details (${this.sessionOrders.length} orders placed)</h3>
                        ${this.generateBillItems(bill.orders)}
                    </div>
                    
                    <div class="bill-summary">
                        <div class="bill-row">
                            <span>Subtotal (${bill.itemCount} items):</span>
                            <span>₹${bill.subtotal}</span>
                        </div>
                        <div class="bill-row">
                            <span>Service Charge (10%):</span>
                            <span>₹${bill.serviceCharge}</span>
                        </div>
                        <div class="bill-row">
                            <span>GST (5%):</span>
                            <span>₹${bill.gst}</span>
                        </div>
                        <div class="bill-total">
                            <span>Total Amount:</span>
                            <span>₹${bill.total}</span>
                        </div>
                    </div>
                    
                    <div class="bill-quote">
                        "Thank you for choosing us for your dining experience! Your satisfaction is our greatest achievement. 
                        We hope every bite brought you joy and we look forward to serving you again soon. 
                        Have a wonderful day ahead! 🙏✨"
                    </div>
                    
                    <div class="bill-actions">
                        <button class="btn-share-bill" onclick="customerMenu.shareBill()">
                            Share Bill Details
                        </button>
                        <button class="btn-new-session" onclick="customerMenu.startNewSession()">
                            Dine Again
                        </button>
                    </div>
                    
                    <div class="bill-footer" style="margin-top:2rem;">
                        <center><p><small>Powered by SpoonFeed WebKitchens</small></p>
                        <p><small>Revolutionising Dining Experiences</small></p></center>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('menu-container').innerHTML = billHTML;
        
        const sessionControls = document.getElementById('session-controls');
        if (sessionControls) {
            sessionControls.style.display = 'none';
        }
        
        this.clearSessionData();
    }

    generateBillItems(orders) {
        let itemsHTML = '';
        
        orders.forEach((order, index) => {
            itemsHTML += `
                <div class="bill-order-section">
                    <div class="bill-order-header">
                        <strong>Order #${order.orderNumber}</strong>
                        <span>${order.timestamp.toLocaleTimeString('en-IN')}</span>
                    </div>
                    <div class="bill-order-items">
            `;
            
            order.items.forEach(item => {
                itemsHTML += `
                    <div class="bill-item">
                        <div class="bill-item-details">
                            <div class="bill-item-name">${item.name}</div>
                            <div class="bill-item-qty">₹${item.price} × ${item.quantity}</div>
                        </div>
                        <div class="bill-item-price">₹${item.price * item.quantity}</div>
                    </div>
                `;
            });
            
            itemsHTML += `
                    </div>
                    <div class="bill-order-total">Order Total: ₹${order.total}</div>
                </div>
            `;
        });
        
        return itemsHTML;
    }

    clearSessionData() {
        localStorage.removeItem(`cart_${this.restaurantId}_${this.tableNumber}`);
        localStorage.removeItem(`session_orders_${this.restaurantId}`);
        this.cart = [];
        this.sessionOrders = [];
    }

    // Bill Sharing
    async shareBill() {
        const billText = this.generateShareText();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '🍽️ Restaurant Bill',
                    text: billText,
                    url: window.location.origin
                });
            } catch (error) {
                this.fallbackShare(billText);
            }
        } else {
            this.fallbackShare(billText);
        }
    }

    fallbackShare(billText) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(billText).then(() => {
                alert('Bill details copied to clipboard!');
            }).catch(() => {
                alert('Bill details:\n\n' + billText);
            });
        } else {
            alert('Bill details:\n\n' + billText);
        }
    }

    generateShareText() {
        const bill = this.calculateBill();
        return `
🍽️ Premium Restaurant Bill
━━━━━━━━━━━━━━━━━━━━━━━
📅 ${bill.date}
🕐 ${bill.time}
🪑 Table ${bill.tableNumber}
⏱️ Session: ${bill.sessionDuration}

📋 Orders Placed: ${this.sessionOrders.length}
🍴 Total Items: ${bill.itemCount}
💰 Total Amount: ₹${bill.total}

Thank you for dining with us! 🙏
        `.trim();
    }

    startNewSession() {
        // Clear localStorage before reload
        localStorage.removeItem('customer_session_id');
        localStorage.removeItem('session_start_time');
        localStorage.removeItem('session_cart');
        localStorage.removeItem('session_orders');
        
        // Simple page reload for fresh session
        window.location.reload();
    }

    // Session orders persistence
loadSessionOrders() {
    const stored = localStorage.getItem('customer_session_orders');
    if (stored) {
        try {
            const orders = JSON.parse(stored);
            console.log('📱 Restored session orders:', orders.length);
            return orders;
        } catch (e) {
            console.error('❌ Error parsing session orders:', e);
        }
    }
    return [];
}

saveSessionOrders() {
    localStorage.setItem('customer_session_orders', JSON.stringify(this.sessionOrders));
}

// Cart persistence
loadCart() {
    const stored = localStorage.getItem('session_cart');
    if (stored) {
        try {
            const cart = JSON.parse(stored);
            console.log('📱 Restored cart:', cart.length, 'items');
            return cart;
        } catch (e) {
            console.error('❌ Error parsing cart:', e);
        }
    }
    return [];
}

saveCart() {
    localStorage.setItem('session_cart', JSON.stringify(this.cart));
}

// Add these new methods to your CustomerMenu class

increaseCartItem(itemId) {
    const cartItem = this.cart.find(item => item.id === itemId);
    if (cartItem) {
        const newQuantity = cartItem.quantity + 1;
        this.updateCartItem(itemId, newQuantity);
    }
}

decreaseCartItem(itemId) {
    const cartItem = this.cart.find(item => item.id === itemId);
    if (cartItem) {
        const newQuantity = cartItem.quantity - 1;
        this.updateCartItem(itemId, newQuantity);
    }
}

    // Event Listeners
    setupEventListeners() {
    // View Cart button - always available
    const viewCartBtn = document.getElementById('view-cart-btn');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', () => this.viewCart());
    }

    // Ask for Bill button - only available after first order
    const askBillBtn = document.getElementById('ask-bill-btn');
    if (askBillBtn) {
        askBillBtn.addEventListener('click', () => this.askForBill());
    }

    // Service request buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('service-btn')) {
            const serviceType = e.target.textContent.trim();
            this.requestService(serviceType);
        }
    });

    // Menu search
    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.displayMenuItems();
        });
    }

    // Cart float button
    const cartFloat = document.getElementById('cart-float');
    if (cartFloat) {
        cartFloat.addEventListener('click', () => this.viewCart());
    }

    // Modal close buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-btn') || e.target.closest('.close-btn')) {
            this.closeModals();
        }
    });

    // Table selector
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('table-btn')) {
            const tableNumber = e.target.textContent.trim();
            this.selectTable(tableNumber);
        }
    });
}

}

// Initialize the customer menu
const customerMenu = new CustomerMenu();
window.customerMenu = customerMenu;

console.log('🚀 Customer menu loaded with clean session management!');
