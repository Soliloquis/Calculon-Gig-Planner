import React, { useState } from 'react';

export default function RecurringExpenses({
  recurringExpenses = [],
  categories = [],
  currencySymbol = '$',
  onAdd,
  onRemove,
  onUpdate
}) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'other');
  const [plannedAmount, setPlannedAmount] = useState('');
  const [day, setDay] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setDescription(item.description);
    setCategory(item.category);
    setPlannedAmount(item.plannedAmount);
    setDay(item.day);
    setEndsAt(item.endsAt || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setCategory(categories[0]?.id || 'other');
    setPlannedAmount('');
    setDay('');
    setEndsAt('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !plannedAmount) return;
    
    const payload = {
      description,
      category,
      plannedAmount: Number(plannedAmount) || 0,
      day: Number(day) || 1,
      endsAt: endsAt || ''
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
    }
    
    handleCancelEdit();
  };

  const getCategoryColor = (catId) => {
    return categories.find(c => c.id === catId)?.color || '#6b7280';
  };

  const formatEndMonth = (endsAtStr) => {
    if (!endsAtStr) return '';
    const [y, m] = endsAtStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return 'ends: ' + date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🔄 Recurring Monthly Expenses
        </h3>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
          {editingId ? '⚠️ Editing recurring item details' : 'Projected automatically on every month card'}
        </span>
      </div>

      {/* Form Row */}
      <form onSubmit={handleSubmit} className="quick-add-form" style={{ gridTemplateColumns: '1fr 140px 100px 70px 140px 110px', gap: '8px', padding: '0', background: 'transparent', border: 'none' }}>
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. AWS VPS Retainer"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Planned Cost</label>
          <div className="input-wrapper">
            <span className="input-prefix" style={{ color: 'var(--text-dim)', fontSize: '13px', left: '10px' }}>{currencySymbol}</span>
            <input
              type="number"
              className="form-input has-prefix"
              placeholder="0"
              value={plannedAmount}
              onChange={(e) => setPlannedAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Day</label>
          <input
            type="number"
            className="form-input"
            placeholder="15"
            min="1"
            max="31"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>End Month (Optional)</label>
          <input
            type="month"
            className="form-input"
            style={{ padding: '4px 6px' }}
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px', width: '100%', alignItems: 'end' }}>
          <button type="submit" className="btn btn-primary" style={{ height: '31px', flex: 1, padding: '0 4px', fontSize: '11px' }}>
            {editingId ? '💾 Save' : '➕ Add'}
          </button>
          {editingId && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCancelEdit} 
              style={{ height: '31px', padding: '0 8px', fontSize: '11px', border: '1px dashed var(--color-danger)' }}
              title="Cancel edits"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Active Items Row */}
      {recurringExpenses.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {recurringExpenses.map(item => {
            const isEditing = item.id === editingId;
            return (
              <div
                key={item.id}
                className={`badge-card ${isEditing ? 'pulse-animation' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: isEditing ? 'rgba(99, 102, 241, 0.2)' : 'rgba(30, 41, 67, 0.4)',
                  border: isEditing ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  boxShadow: isEditing ? '0 0 8px rgba(99, 102, 241, 0.25)' : 'none'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getCategoryColor(item.category)
                  }}
                />
                <span style={{ fontWeight: '600' }}>{item.description}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  ({currencySymbol}{item.plannedAmount}/mo, Day {item.day}{item.endsAt ? `, ${formatEndMonth(item.endsAt)}` : ''})
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleStartEdit(item)}
                    style={{ width: '18px', height: '18px', fontSize: '11px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)' }}
                    title="Edit recurring item"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn-icon delete"
                    onClick={() => onRemove(item.id)}
                    style={{ width: '18px', height: '18px', fontSize: '11px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
                    title="Remove recurring item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', padding: '6px 0' }}>
          No recurring expenses defined. Project-wide monthly costs will start empty.
        </div>
      )}
    </div>
  );
}
