import React, { useState } from 'react';

export default function CategoriesEditor({ categories = [], onAddCategory, onRemoveCategory }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [color, setColor] = useState('#6366f1');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    onAddCategory({
      name,
      icon: icon.trim() || '📦',
      color
    });
    setName('');
    setIcon('🏷️');
    setColor('#6366f1');
  };

  const defaultIds = ['assets', 'software', 'hardware', 'services', 'marketing', 'team', 'other'];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>🎨 Project Expense Categories</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Manage your budget categorization taxonomy. Custom categories will automatically become selectable when scheduling expenses.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* CREATE CATEGORY PANEL */}
        <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ➕ Create Custom Category
          </h4>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Travel & Lodging"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Icon Emoji</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength="2"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  style={{ textAlign: 'center' }}
                  required
                />
              </div>

              <div className="form-group" style={{ width: '80px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      width: '100%',
                      height: '32px',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '12px', marginTop: '4px' }}>
              🎨 Create Category
            </button>
          </form>
        </div>

        {/* LIST OF CATEGORIES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Taxonomy ({categories.length} Categories)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {categories.map(cat => {
              const isCustom = !defaultIds.includes(cat.id);
              return (
                <div 
                  key={cat.id} 
                  className="category-edit-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'rgba(18, 25, 41, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px', minWidth: '28px', textAlign: 'center' }}>{cat.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{cat.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span 
                          style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: cat.color,
                            display: 'inline-block'
                          }} 
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {cat.color.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isCustom && (
                    <button
                      type="button"
                      className="btn-icon delete"
                      onClick={() => onRemoveCategory(cat.id)}
                      style={{
                        width: '20px',
                        height: '20px',
                        fontSize: '10px',
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'var(--color-danger)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '4px'
                      }}
                      title="Delete custom category"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
