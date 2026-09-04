import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, Search, MessageSquare, PhoneCall, 
  ShoppingCart, Plus, Minus, Trash2, X, Check, Heart, 
  ChevronLeft, ChevronRight, Phone, Mail, ArrowUp, Copy
} from 'lucide-react';
import inventoryData from './data/quotes.json';
import './App.css';

const PRIMARY_WHATSAPP = '254743940502';
const CONTACT_NUMBERS = [
  { label: 'Primary Contact', raw: '254743940502', formatted: '0743 940 502' },
  { label: 'Alternative Line', raw: '254759198196', formatted: '0759 198 196' }
];

const getAssetUrl = (imageName) => {
  try {
    return new URL(`./assets/${imageName}`, import.meta.url).href;
  } catch (err) {
    return 'https://via.placeholder.com/500x600?text=Image+Not+Found';
  }
};

// Helper function: Durstenfeld / Fisher-Yates Shuffle algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // LocalStorage-backed state initialization for Cart
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('dess_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [addedItemToast, setAddedItemToast] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // LocalStorage-backed state initialization for Likes
  const [likedItems, setLikedItems] = useState(() => {
    try {
      const savedLikes = localStorage.getItem('dess_liked_items');
      return savedLikes ? JSON.parse(savedLikes) : {};
    } catch (e) {
      console.error('Failed to parse likes from localStorage:', e);
      return {};
    }
  });

  const [likesCounts, setLikesCounts] = useState(() => {
    try {
      const savedCounts = localStorage.getItem('dess_likes_counts');
      return savedCounts ? JSON.parse(savedCounts) : {};
    } catch (e) {
      console.error('Failed to parse likes counts from localStorage:', e);
      return {};
    }
  });

  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('dess_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync Liked Items to LocalStorage
  useEffect(() => {
    localStorage.setItem('dess_liked_items', JSON.stringify(likedItems));
  }, [likedItems]);

  // Sync Likes Counts to LocalStorage
  useEffect(() => {
    localStorage.setItem('dess_likes_counts', JSON.stringify(likesCounts));
  }, [likesCounts]);

  // Track scroll position to show/hide "Back to Top" button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Copy number to clipboard
  const handleCopyNumber = (number) => {
    navigator.clipboard.writeText(number);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Extract all products into a flat array and randomly shuffle them once on mount
  const allProducts = useMemo(() => {
    if (!inventoryData || !inventoryData.categories) return [];
    const extracted = inventoryData.categories.flatMap((cat) =>
      (cat.items || []).map((item) => ({ ...item, category: cat.category_name }))
    );
    return shuffleArray(extracted);
  }, []);

  const categories = useMemo(() => {
    if (!inventoryData || !inventoryData.categories) return ['All'];
    const originalCategories = inventoryData.categories.map((cat) => cat.category_name).filter(Boolean);
    return ['All', ...new Set(originalCategories)];
  }, []);

  // Filter items (Category & Search filtering)
  const filteredProducts = useMemo(() => {
    return allProducts.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
      
      return matchesCategory && matchesSearch;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  // Toggle Likes
  const toggleLike = (productId, initialLikes, e) => {
    if (e) e.stopPropagation();
    
    setLikedItems((prev) => {
      const isLiked = !prev[productId];
      const currentCount = likesCounts[productId] ?? initialLikes;
      
      setLikesCounts((prevCounts) => ({
        ...prevCounts,
        [productId]: isLiked ? currentCount + 1 : currentCount - 1,
      }));
      
      return { ...prev, [productId]: isLiked };
    });
  };

  // Cart Management
  const addToCart = (product, e) => {
    if (e) e.stopPropagation();
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });

    setAddedItemToast(product.name);
    setTimeout(() => setAddedItemToast(null), 2000);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const totalCartItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const activePrice = item.discount_price || item.price;
      return sum + activePrice * item.quantity;
    }, 0);
  }, [cart]);

  // Contact Seller on WhatsApp
  const handleContactSeller = (product = null) => {
    let message = '';
    if (product) {
      const activePrice = product.discount_price || product.price;
      message = `Hello! I want to inquire about *${product.name}* (ID: #${product.id}) priced at Ksh ${activePrice.toFixed(2)}.`;
    } else if (cart.length > 0) {
      message = `Hello! I would like to place an order from DESS COLLECTION:\n\n`;
      cart.forEach((item, index) => {
        const price = item.discount_price || item.price;
        message += `${index + 1}. *${item.name}* (Qty: ${item.quantity}) - Ksh ${(price * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*Total Amount:* Ksh ${cartSubtotal.toFixed(2)}`;
    } else {
      message = `Hello! I would like to inquire about items in DESS COLLECTION.`;
    }

    const whatsappUrl = `https://wa.me/${PRIMARY_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Open Product Modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
  };

  return (
    <div className="store-container">
      {/* HEADER */}
      <header className="store-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-icon-wrapper">
              <ShoppingBag size={22} className="brand-icon" />
            </div>
            <h1 className="brand-title">
              <span>DESS COLLECTION</span>
              <span className="brand-subtitle">PREMIUM OUTFITS & ACCESSORIES</span>
            </h1>
          </div>

          <div className="header-actions">
            <button
              className="direct-contact"
              onClick={() => setIsContactOpen(true)}
              title="Contact Dealer"
            >
              <PhoneCall size={16} />
              <span className="contact-label">Contacts</span>
            </button>

            <button
              className="cart-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label="View Cart"
            >
              <ShoppingCart size={20} />
              {totalCartItems > 0 && (
                <span className="cart-badge">{totalCartItems}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="store-main">
        {/* DEALER CATEGORY DESCRIPTION BANNER */}
        <section className="dealer-banner">
          <p className="dealer-description">
            <strong>Dealers in:</strong> Mens wear, Women wear, Kids outfit, Bags, Accessories & All kinds of caps.
          </p>
        </section>

        {/* SEARCH BAR */}
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search clothes, bags, caps, accessories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* CATEGORY PILLS */}
        <div className="category-row">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state">No items found matching your search.</div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((item) => {
              const hasDiscount = item.discount_price && item.discount_price < item.price;
              const discountPercentage = hasDiscount
                ? Math.round(((item.price - item.discount_price) / item.price) * 100)
                : null;
              const isLiked = !!likedItems[item.id];
              const likesCount = likesCounts[item.id] ?? (item.likes || 0);

              return (
                <div 
                  key={item.id} 
                  className="product-card"
                  onClick={() => openProductModal(item)}
                >
                  <div className="image-wrapper">
                    <img
                      src={getAssetUrl(item.image)}
                      alt={item.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x500?text=Image+Not+Found';
                      }}
                    />
                    <span className="category-badge">{item.category}</span>
                    {hasDiscount && (
                      <span className="discount-badge">-{discountPercentage}% OFF</span>
                    )}

                    {/* LIKE BUTTON OVERLAY */}
                    <button
                      className={`like-btn ${isLiked ? 'liked' : ''}`}
                      onClick={(e) => toggleLike(item.id, item.likes || 0, e)}
                    >
                      <Heart size={16} fill={isLiked ? '#e11d48' : 'none'} color={isLiked ? '#e11d48' : '#374151'} />
                      <span className="like-count">{likesCount}</span>
                    </button>
                  </div>

                  <div className="card-body">
                    <h3 className="product-name">{item.name}</h3>

                    <div className="price-row">
                      {hasDiscount ? (
                        <>
                          <span className="discount-price">Ksh {item.discount_price.toFixed(2)}</span>
                          <span className="original-price">Ksh {item.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="regular-price">Ksh {item.price.toFixed(2)}</span>
                      )}
                    </div>

                    <p className="product-desc-short">{item.description}</p>

                    {item.tags && item.tags.length > 0 && (
                      <div className="tag-list">
                        {item.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="tag-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(tag);
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="card-actions">
                      <button
                        onClick={(e) => addToCart(item, e)}
                        className="add-cart-btn"
                      >
                        <ShoppingCart size={16} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CONTACT DIRECTORY MODAL */}
      {isContactOpen && (
        <div className="modal-overlay" onClick={() => setIsContactOpen(false)}>
          <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsContactOpen(false)}>
              <X size={20} />
            </button>

            <div className="contact-modal-header">
              <PhoneCall size={28} className="contact-modal-icon" />
              <h3>Contact Dealer</h3>
              <p>Call directly or chat with us on WhatsApp</p>
            </div>

            <div className="contact-numbers-list">
              {CONTACT_NUMBERS.map((num) => (
                <div key={num.raw} className="contact-number-card">
                  <div className="number-info">
                    <span className="number-label">{num.label}</span>
                    <span className="plain-number">{num.raw}</span>
                    <span className="formatted-number">{num.formatted}</span>
                  </div>
                  <div className="number-actions">
                    <a 
                      href={`tel:+${num.raw}`} 
                      className="contact-action-btn call-btn"
                      title="Call Phone Number"
                    >
                      <Phone size={16} /> Call
                    </a>
                    <button 
                      onClick={() => handleCopyNumber(num.raw)} 
                      className="contact-action-btn copy-btn"
                      title="Copy Number"
                    >
                      <Copy size={16} /> Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="whatsapp-modal-btn"
              onClick={() => {
                setIsContactOpen(false);
                handleContactSeller(null);
              }}
            >
              <MessageSquare size={18} /> Direct WhatsApp Chat
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedProduct(null)}>
              <X size={20} />
            </button>

            {/* MULTI-IMAGE CAROUSEL */}
            <div className="modal-gallery">
              <div className="modal-image-view">
                {(() => {
                  const galleryList = selectedProduct.gallery && selectedProduct.gallery.length > 0 
                    ? selectedProduct.gallery 
                    : [selectedProduct.image];
                  
                  return (
                    <>
                      <img
                        src={getAssetUrl(galleryList[currentImageIndex])}
                        alt={selectedProduct.name}
                        className="modal-active-img"
                      />

                      {galleryList.length > 1 && (
                        <>
                          <button
                            className="carousel-btn prev"
                            onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? galleryList.length - 1 : prev - 1))}
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            className="carousel-btn next"
                            onClick={() => setCurrentImageIndex((prev) => (prev === galleryList.length - 1 ? 0 : prev + 1))}
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* GALLERY THUMBNAILS */}
              {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
                <div className="thumbnail-row">
                  {selectedProduct.gallery.map((img, idx) => (
                    <img
                      key={idx}
                      src={getAssetUrl(img)}
                      alt="thumbnail"
                      className={`thumb-img ${currentImageIndex === idx ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* PRODUCT DETAILS IN MODAL */}
            <div className="modal-info">
              <span className="category-badge-inline">{selectedProduct.category}</span>
              <h2 className="modal-title">{selectedProduct.name}</h2>

              <div className="price-row margin-v">
                {selectedProduct.discount_price ? (
                  <>
                    <span className="discount-price">Ksh {selectedProduct.discount_price.toFixed(2)}</span>
                    <span className="original-price">Ksh {selectedProduct.price.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="regular-price">Ksh {selectedProduct.price.toFixed(2)}</span>
                )}
              </div>

              <p className="modal-desc">{selectedProduct.description}</p>

              {selectedProduct.tags && (
                <div className="tag-list margin-v">
                  {selectedProduct.tags.map((tag) => (
                    <span key={tag} className="tag-item">#{tag}</span>
                  ))}
                </div>
              )}

              {/* MODAL ACTION BUTTONS */}
              <div className="modal-actions-row">
                <button
                  className="add-cart-btn primary-btn"
                  onClick={() => addToCart(selectedProduct)}
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                <button
                  className="contact-seller-btn"
                  onClick={() => handleContactSeller(selectedProduct)}
                >
                  <MessageSquare size={18} /> Order on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER OVERLAY */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <div className="cart-header-title">
                <ShoppingCart size={20} color="#e11d48" />
                <h2>Shopping Cart ({totalCartItems})</h2>
              </div>
              <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-body">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingBag size={48} color="#d1d5db" />
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cart.map((item) => {
                    const price = item.discount_price || item.price;
                    return (
                      <div key={item.id} className="cart-item">
                        <img
                          src={getAssetUrl(item.image)}
                          alt={item.name}
                          className="cart-item-img"
                        />
                        <div className="cart-item-details">
                          <h4 className="cart-item-name">{item.name}</h4>
                          <span className="cart-item-price">Ksh {price.toFixed(2)}</span>
                          <div className="quantity-controls">
                            <button onClick={() => updateQuantity(item.id, -1)}>
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)}>
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <button
                          className="remove-item-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-subtotal-row">
                  <span>Subtotal:</span>
                  <span className="subtotal-amount">Ksh {cartSubtotal.toFixed(2)}</span>
                </div>
                <button
                  className="whatsapp-checkout-btn"
                  onClick={() => handleContactSeller(null)}
                >
                  <MessageSquare size={18} /> Order Cart via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BACK TO TOP BUTTON */}
      {showBackToTop && (
        <button 
          className="back-to-top-btn" 
          onClick={scrollToTop}
          aria-label="Back to Top"
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* TOAST CONFIRMATION */}
      {addedItemToast && (
        <div className="toast-notification">
          <Check size={16} /> Added "{addedItemToast}" to cart!
        </div>
      )}

      {copiedToast && (
        <div className="toast-notification">
          <Check size={16} /> Number copied to clipboard!
        </div>
      )}

      {/* STORE FOOTER */}
      <footer className="store-footer">
        <div className="footer-contacts">
          <p><strong>DESS COLLECTION</strong></p>
          <p>Phone Lines: <a href="tel:+254743940502">254743940502</a> | <a href="tel:+254759198196">254759198196</a></p>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} DESS COLLECTION. All rights reserved.</p>
          <p className="developer-credit">
            Designed by <strong>FAB Software Solutions</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}