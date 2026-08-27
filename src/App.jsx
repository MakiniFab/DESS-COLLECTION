// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Quote, Sparkles, Copy, Heart, RefreshCw, Bookmark, Check, 
  Calendar as CalendarIcon, CheckSquare, Plus, Trash2, Edit3 
} from 'lucide-react';
import quotesData from './data/quotes.json';

export default function App() {
  const quotesList = useMemo(() => {
    if (!quotesData) return [];
    if (Array.isArray(quotesData)) return quotesData;
    if (Array.isArray(quotesData.quotes)) {
      if (quotesData.quotes[0]?.category_name) {
        return quotesData.quotes.flatMap((cat) =>
          (cat.quotes || []).map((q) => ({ ...q, category: cat.category_name }))
        );
      }
      return quotesData.quotes;
    }
    if (Array.isArray(quotesData.categories)) {
      return quotesData.categories.flatMap((cat) =>
        (cat.quotes || []).map((q) => ({ ...q, category: cat.category_name }))
      );
    }
    return [];
  }, []);

  const categories = useMemo(() => {
    return ['All', ...new Set(quotesList.map((q) => q.category).filter(Boolean))];
  }, [quotesList]);

  const quoteOfTheDay = quotesList[0] || null;

  // App State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentQuote, setCurrentQuote] = useState(() => quotesList[0] || null);
  const [favorites, setFavorites] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  // Interactive Widgets State
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [markedDays, setMarkedDays] = useState({});
  const [journalNote, setJournalNote] = useState('');

  // Sync state on load
  useEffect(() => {
    if (!currentQuote && quotesList.length > 0) {
      setCurrentQuote(quotesList[0]);
    }
  }, [quotesList, currentQuote]);

  useEffect(() => {
    const storedFavs = localStorage.getItem('quote_favorites');
    const storedTodos = localStorage.getItem('aura_todos');
    const storedDays = localStorage.getItem('aura_marked_days');
    const storedNote = localStorage.getItem('aura_journal_note');

    if (storedFavs) try { setFavorites(JSON.parse(storedFavs)); } catch (e) {}
    if (storedTodos) try { setTodos(JSON.parse(storedTodos)); } catch (e) {}
    if (storedDays) try { setMarkedDays(JSON.parse(storedDays)); } catch (e) {}
    if (storedNote) setJournalNote(storedNote);
  }, []);

  // Persistence Helpers
  const saveTodos = (updated) => {
    setTodos(updated);
    localStorage.setItem('aura_todos', JSON.stringify(updated));
  };

  const saveMarkedDays = (updated) => {
    setMarkedDays(updated);
    localStorage.setItem('aura_marked_days', JSON.stringify(updated));
  };

  // Handlers
  const toggleFavorite = (quoteItem) => {
    const exists = favorites.some((f) => f.id === quoteItem.id);
    const updated = exists 
      ? favorites.filter((f) => f.id !== quoteItem.id)
      : [...favorites, quoteItem];
    setFavorites(updated);
    localStorage.setItem('quote_favorites', JSON.stringify(updated));
  };

  const fetchQuote = (cat = selectedCategory) => {
    setIsLoading(true);
    setTimeout(() => {
      const filtered = cat === 'All' 
        ? quotesList 
        : quotesList.filter((q) => q.category === cat);
      if (filtered.length > 0) {
        const random = filtered[Math.floor(Math.random() * filtered.length)];
        setCurrentQuote(random);
      } else {
        setCurrentQuote(null);
      }
      setIsLoading(false);
    }, 150);
  };

  const handleCopy = (text, author) => {
    navigator.clipboard.writeText(`"${text}" — ${author}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const item = { id: Date.now(), text: newTodo.trim(), completed: false };
    saveTodos([...todos, item]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(updated);
  };

  const deleteTodo = (id) => {
    saveTodos(todos.filter(t => t.id !== id));
  };

  const toggleCalendarDay = (dayNum) => {
    const updated = { ...markedDays, [dayNum]: !markedDays[dayNum] };
    saveMarkedDays(updated);
  };

  const handleJournalChange = (e) => {
    setJournalNote(e.target.value);
    localStorage.setItem('aura_journal_note', e.target.value);
  };

  const isCurrentFav = currentQuote && favorites.some((f) => f.id === currentQuote.id);
  const daysArray = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div style={styles.appContainer}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.brand}>
            <Quote size={24} color="#ec4899" />
            <h1 style={styles.brandTitle}>AuraQuotes</h1>
            <span style={styles.brandBadge}>
              v{quotesData?.version || '2.0'}
            </span>
          </div>

          <nav style={styles.tabNav}>
            <button
              onClick={() => setActiveTab('browse')}
              style={{ 
                ...styles.tabBtn, 
                backgroundColor: activeTab === 'browse' ? '#fce7f3' : 'transparent',
                color: activeTab === 'browse' ? '#be185d' : '#9d4edd'
              }}
            >
              <Sparkles size={15} /> Explore
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              style={{ 
                ...styles.tabBtn, 
                backgroundColor: activeTab === 'favorites' ? '#fce7f3' : 'transparent',
                color: activeTab === 'favorites' ? '#be185d' : '#9d4edd'
              }}
            >
              <Bookmark size={15} /> Saved ({favorites.length})
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={styles.main}>
        {activeTab === 'browse' ? (
          <>
            {/* Quote of the Day Banner */}
            {quoteOfTheDay && (
              <section style={styles.qodBanner}>
                <div style={styles.qodHeader}>
                  <Sparkles size={16} color="#db2777" />
                  <span style={styles.qodLabel}>Quote of the Day</span>
                </div>
                <blockquote style={styles.qodText}>"{quoteOfTheDay.quote}"</blockquote>
                <cite style={styles.qodAuthor}>— {quoteOfTheDay.author}</cite>
              </section>
            )}

            {/* Category Filter Pills */}
            <div style={styles.categorySection}>
              <span style={styles.categoryLabel}>Filter Category:</span>
              <div style={styles.pillContainer}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); fetchQuote(cat); }}
                    style={{
                      ...styles.pill,
                      backgroundColor: selectedCategory === cat ? '#ec4899' : '#ffffff',
                      color: selectedCategory === cat ? '#ffffff' : '#831843',
                      borderColor: selectedCategory === cat ? '#ec4899' : '#fbcfe8',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Quote Card */}
            <div style={styles.displayCard}>
              {isLoading ? (
                <div style={styles.skeletonContainer}>
                  <div style={styles.skeletonLine} />
                  <div style={{ ...styles.skeletonLine, width: '60%' }} />
                </div>
              ) : currentQuote ? (
                <>
                  <div style={styles.cardHeader}>
                    <span style={styles.categoryTag}>{currentQuote.category || 'General'}</span>
                    <div style={styles.tagGroup}>
                      {currentQuote.tags?.map((t) => (
                        <span key={t} style={styles.tag}>#{t}</span>
                      ))}
                    </div>
                  </div>

                  <blockquote style={styles.quoteBody}>"{currentQuote.quote}"</blockquote>
                  <cite style={styles.quoteAuthor}>— {currentQuote.author}</cite>

                  <div style={styles.actionRow}>
                    <div style={styles.actionLeft}>
                      <button
                        style={{ ...styles.iconBtn, borderColor: isCurrentFav ? '#f43f5e' : '#fbcfe8' }}
                        onClick={() => toggleFavorite(currentQuote)}
                        title="Save to Favorites"
                      >
                        <Heart size={18} fill={isCurrentFav ? '#f43f5e' : 'none'} color={isCurrentFav ? '#f43f5e' : '#9d174d'} />
                      </button>

                      <button
                        style={styles.iconBtn}
                        onClick={() => handleCopy(currentQuote.quote, currentQuote.author)}
                        title="Copy Quote"
                      >
                        {isCopied ? <Check size={18} color="#16a34a" /> : <Copy size={18} color="#9d174d" />}
                      </button>
                    </div>

                    <button style={styles.primaryBtn} onClick={() => fetchQuote()}>
                      <RefreshCw size={16} /> Next Quote
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ textAlign: 'center', color: '#9d174d' }}>No quotes found.</p>
              )}
            </div>

            {/* DASHBOARD WIDGETS SECTION */}
            <div style={styles.widgetsGrid}>
              
              {/* Daily Goals / To-Do List */}
              <div style={styles.widgetCard}>
                <div style={styles.widgetHeader}>
                  <CheckSquare size={18} color="#ec4899" />
                  <h3 style={styles.widgetTitle}>Daily Focus & To-Do List</h3>
                </div>
                
                <form onSubmit={addTodo} style={styles.todoForm}>
                  <input
                    type="text"
                    placeholder="Add a goal or task..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    style={styles.todoInput}
                  />
                  <button type="submit" style={styles.addBtn}>
                    <Plus size={16} />
                  </button>
                </form>

                <ul style={styles.todoList}>
                  {todos.length === 0 ? (
                    <li style={styles.emptyTodo}>No goals set for today yet!</li>
                  ) : (
                    todos.map((todo) => (
                      <li key={todo.id} style={styles.todoItem}>
                        <label style={styles.todoLabel}>
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id)}
                            style={{ marginRight: '8px', accentColor: '#ec4899' }}
                          />
                          <span style={{ 
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? '#9ca3af' : '#831843' 
                          }}>
                            {todo.text}
                          </span>
                        </label>
                        <button onClick={() => deleteTodo(todo.id)} style={styles.deleteBtn}>
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Monthly Consistency Tracker */}
              <div style={styles.widgetCard}>
                <div style={styles.widgetHeader}>
                  <CalendarIcon size={18} color="#db2777" />
                  <h3 style={styles.widgetTitle}>Monthly Consistency</h3>
                </div>
                <p style={styles.widgetSubtitle}>Tap days to track reading consistency:</p>
                
                <div style={styles.calendarGrid}>
                  {daysArray.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleCalendarDay(day)}
                      style={{
                        ...styles.dayCell,
                        backgroundColor: markedDays[day] ? '#ec4899' : '#fff1f2',
                        color: markedDays[day] ? '#ffffff' : '#9d174d',
                        borderColor: markedDays[day] ? '#ec4899' : '#fbcfe8'
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection Note */}
              <div style={styles.widgetCardFull}>
                <div style={styles.widgetHeader}>
                  <Edit3 size={18} color="#be185d" />
                  <h3 style={styles.widgetTitle}>Daily Reflection Journal</h3>
                </div>
                <textarea
                  placeholder="Jot down a quick thought, takeaway, or note for today..."
                  value={journalNote}
                  onChange={handleJournalChange}
                  style={styles.journalInput}
                  rows={3}
                />
              </div>

            </div>
          </>
        ) : (
          /* Favorites Tab */
          <div style={styles.favoritesSection}>
            <h2 style={styles.sectionTitle}>Your Saved Quotes</h2>
            {favorites.length === 0 ? (
              <div style={styles.emptyState}>
                <Bookmark size={40} color="#f472b6" />
                <p style={{ margin: 0 }}>No saved quotes yet. Tap the heart icon on any quote to save it!</p>
              </div>
            ) : (
              <div style={styles.favGrid}>
                {favorites.map((q) => (
                  <div key={q.id} style={styles.favCard}>
                    <p style={styles.favText}>"{q.quote}"</p>
                    <span style={styles.favAuthor}>— {q.author}</span>
                    <div style={styles.favCardFooter}>
                      <span style={styles.categoryTag}>{q.category || 'General'}</span>
                      <button style={styles.removeBtn} onClick={() => toggleFavorite(q)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Designed by <span style={styles.brandAccent}>FAB Software Solutions</span> &copy; {new Date().getFullYear()} All Rights Reserved.
        </p>
      </footer>

      {/* Toast Notification */}
      {isCopied && (
        <div style={styles.toast}>
          <Check size={16} /> Copied to clipboard!
        </div>
      )}
    </div>
  );
}

// WHITE & PINKISH STYLES
const styles = {
  appContainer: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#fff5f7',
    color: '#831843',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  header: {
    width: '100%',
    borderBottom: '1px solid #fbcfe8',
    backgroundColor: '#ffffff',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  headerContent: {
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '12px 16px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    boxSizing: 'border-box'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  brandTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    margin: 0,
    color: '#831843',
    whiteSpace: 'nowrap'
  },
  brandBadge: {
    fontSize: '0.65rem',
    color: '#be185d',
    backgroundColor: '#fce7f3',
    padding: '2px 6px',
    borderRadius: '10px',
    fontWeight: 600
  },
  tabNav: {
    display: 'flex',
    gap: '6px'
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem'
  },
  main: {
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '16px',
    flex: 1,
    boxSizing: 'border-box'
  },
  qodBanner: {
    backgroundColor: '#fce7f3',
    border: '1px solid #fbcfe8',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
    width: '100%',
    boxSizing: 'border-box'
  },
  qodHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px'
  },
  qodLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    color: '#be185d'
  },
  qodText: {
    fontSize: '0.95rem',
    fontStyle: 'italic',
    margin: '0 0 8px 0',
    color: '#831843',
    lineHeight: 1.4
  },
  qodAuthor: {
    fontSize: '0.85rem',
    color: '#db2777',
    fontWeight: 600,
    display: 'block',
    textAlign: 'right'
  },
  categorySection: {
    marginBottom: '20px',
    width: '100%'
  },
  categoryLabel: {
    fontSize: '0.8rem',
    color: '#9d174d',
    marginBottom: '8px',
    display: 'block',
    fontWeight: 500
  },
  pillContainer: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '6px',
    width: '100%',
    WebkitOverflowScrolling: 'touch'
  },
  pill: {
    padding: '6px 12px',
    borderRadius: '20px',
    borderStyle: 'solid',
    borderWidth: '1px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  displayCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #fbcfe8',
    borderRadius: '16px',
    padding: '20px',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '24px',
    boxShadow: '0 4px 15px rgba(244, 114, 182, 0.08)'
  },
  cardHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  categoryTag: {
    backgroundColor: '#fce7f3',
    color: '#be185d',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: '6px'
  },
  tagGroup: {
    display: 'flex',
    gap: '6px'
  },
  tag: {
    fontSize: '0.7rem',
    color: '#9d174d'
  },
  quoteBody: {
    fontSize: '1.15rem',
    fontWeight: 500,
    margin: '0 0 12px 0',
    lineHeight: 1.4,
    color: '#831843'
  },
  quoteAuthor: {
    fontSize: '0.9rem',
    color: '#be185d',
    fontStyle: 'normal',
    marginBottom: '20px',
    display: 'block',
    fontWeight: 600
  },
  actionRow: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: 'auto'
  },
  actionLeft: {
    display: 'flex',
    gap: '8px'
  },
  iconBtn: {
    backgroundColor: '#fff1f2',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justify: 'center'
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ec4899',
    color: '#ffffff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    flexGrow: 1,
    justify: 'center'
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    padding: '16px 0'
  },
  skeletonLine: {
    height: '18px',
    backgroundColor: '#fce7f3',
    borderRadius: '4px',
    width: '100%'
  },
  
  // Dashboard Widgets
  widgetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    width: '100%'
  },
  widgetCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #fbcfe8',
    borderRadius: '12px',
    padding: '16px',
    boxSizing: 'border-box',
    width: '100%',
    boxShadow: '0 2px 10px rgba(244, 114, 182, 0.05)'
  },
  widgetCardFull: {
    backgroundColor: '#ffffff',
    border: '1px solid #fbcfe8',
    borderRadius: '12px',
    padding: '16px',
    boxSizing: 'border-box',
    gridColumn: '1 / -1',
    width: '100%',
    boxShadow: '0 2px 10px rgba(244, 114, 182, 0.05)'
  },
  widgetHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px'
  },
  widgetTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    margin: 0,
    color: '#831843'
  },
  widgetSubtitle: {
    fontSize: '0.75rem',
    color: '#be185d',
    marginBottom: '10px'
  },
  todoForm: {
    display: 'flex',
    gap: '6px',
    marginBottom: '10px',
    width: '100%'
  },
  todoInput: {
    flex: 1,
    backgroundColor: '#fff1f2',
    border: '1px solid #fbcfe8',
    borderRadius: '6px',
    padding: '8px 10px',
    color: '#831843',
    fontSize: '0.8rem',
    minWidth: '0',
    outline: 'none'
  },
  addBtn: {
    backgroundColor: '#ec4899',
    border: 'none',
    color: '#ffffff',
    borderRadius: '6px',
    padding: '0 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  todoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    maxHeight: '150px',
    overflowY: 'auto'
  },
  todoItem: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #fce7f3',
    fontSize: '0.8rem'
  },
  todoLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    overflow: 'hidden'
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f43f5e',
    cursor: 'pointer',
    padding: '4px'
  },
  emptyTodo: {
    fontSize: '0.75rem',
    color: '#9d174d',
    textAlign: 'center',
    padding: '8px 0'
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '4px',
    width: '100%'
  },
  dayCell: {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '4px',
    padding: '6px 0',
    fontSize: '0.7rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center'
  },
  journalInput: {
    width: '100%',
    backgroundColor: '#fff1f2',
    border: '1px solid #fbcfe8',
    borderRadius: '6px',
    padding: '8px 10px',
    color: '#831843',
    fontSize: '0.8rem',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },

  // Favorites
  favoritesSection: {
    width: '100%'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    marginBottom: '16px',
    color: '#831843'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 16px',
    color: '#be185d',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  favGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
    width: '100%'
  },
  favCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #fbcfe8',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    boxShadow: '0 2px 8px rgba(244, 114, 182, 0.05)'
  },
  favText: {
    fontSize: '0.9rem',
    margin: '0 0 8px 0',
    color: '#831843'
  },
  favAuthor: {
    fontSize: '0.8rem',
    color: '#be185d',
    marginBottom: '12px',
    display: 'block'
  },
  favCardFooter: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center'
  },
  removeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f43f5e',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: 600
  },
  toast: {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    left: '16px',
    maxWidth: '300px',
    margin: '0 auto',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '10px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    gap: '6px',
    fontWeight: 600,
    fontSize: '0.85rem',
    zIndex: 100
  },
  
  // Footer
  footer: {
    borderTop: '1px solid #fbcfe8',
    padding: '16px',
    textAlign: 'center',
    marginTop: 'auto',
    backgroundColor: '#ffffff',
    width: '100%',
    boxSizing: 'border-box'
  },
  footerText: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#9d174d'
  },
  brandAccent: {
    color: '#be185d',
    fontWeight: 700
  }
};