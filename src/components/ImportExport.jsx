import React, { useRef } from 'react';

export default function ImportExport({
  project,
  currencies,
  updateProjectMeta,
  clearProjectData,
  loadProjectData,
  loadDemoData
}) {
  const fileInputRef = useRef(null);

  // Download project as JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    // Create clean file name based on project name
    const safeName = project.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadAnchor.setAttribute("download", `${safeName}_budget_plan.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Upload and parse JSON
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && parsed.projectName) {
          loadProjectData(parsed);
          alert('🎉 Project budget plan successfully imported!');
        } else {
          alert('❌ Invalid file format: Could not find project data.');
        }
      } catch (err) {
        alert('❌ Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (window.confirm('⚠️ Are you sure you want to clear all budget entries? All unsaved data will be permanently deleted.')) {
      clearProjectData();
    }
  };

  return (
    <div className="glass-panel detail-panel">
      <div className="panel-header">
        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Project Settings & Tools</h2>
      </div>

      <div className="settings-section">
        {/* Left Card: Metadata Settings */}
        <div className="settings-card">
          <h3>Project Configuration</h3>
          
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              className="form-input"
              value={project.projectName}
              onChange={(e) => updateProjectMeta({ projectName: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Start Month</label>
              <input
                type="month"
                className="form-input"
                value={project.startDate}
                onChange={(e) => updateProjectMeta({ startDate: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>Timeline (Months)</label>
              <input
                type="number"
                min="12"
                max="240"
                className="form-input"
                value={project.durationMonths}
                onChange={(e) => updateProjectMeta({ durationMonths: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Base Default Funding</label>
              <input
                type="number"
                className="form-input"
                value={project.defaultMonthlyAllocation}
                onChange={(e) => updateProjectMeta({ defaultMonthlyAllocation: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Project Currency</label>
              <select
                className="form-input"
                value={project.currency}
                onChange={(e) => updateProjectMeta({ currency: e.target.value })}
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Card: Backup & Maintenance */}
        <div className="settings-card" style={{ justifyContent: 'space-between' }}>
          <div>
            <h3>Data Operations & Backups</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Calculon saves data automatically to your local browser storage. Use these tools to back up your budget plan to a file or seed a simulation.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleExport}
              style={{ width: '100%' }}
            >
              📥 Export Budget Plan (JSON)
            </button>

            <div className="file-input-wrapper" style={{ width: '100%' }}>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                📤 Import Budget Plan File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".json" 
                onChange={handleImport} 
              />
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={loadDemoData}
              style={{ width: '100%', border: '1px dashed var(--color-primary)' }}
            >
              🚀 Load Demo Sandbox Project
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <button 
              className="btn btn-danger-outline" 
              onClick={handleReset}
              style={{ width: '100%' }}
            >
              🗑️ Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
