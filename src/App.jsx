
import React, { useState, useEffect, useRef } from 'react';

// Centralized routing, data, and configuration
const ROLES = {
  ADMIN: 'ADMIN',
  EXPORTER: 'EXPORTER',
  VIEWER: 'VIEWER',
};

const STATUS_COLORS = {
  'PENDING': 'var(--info-color)',
  'APPROVED': 'var(--success-color)',
  'SHIPPED': 'var(--primary-color)',
  'DELIVERED': 'var(--secondary-color)',
  'REJECTED': 'var(--danger-color)',
  'ON_HOLD': 'var(--warning-color)',
  'OVERDUE': 'var(--danger-color)',
  'ON_TRACK': 'var(--success-color)',
};

const STATUS_LABELS = {
  'PENDING': 'Pending Approval',
  'APPROVED': 'Approved',
  'SHIPPED': 'Shipped',
  'DELIVERED': 'Delivered',
  'REJECTED': 'Rejected',
  'ON_HOLD': 'On Hold',
  'OVERDUE': 'SLA Overdue',
  'ON_TRACK': 'SLA On Track',
};

const EXPORT_WORKFLOW_STAGES = [
  { id: 'DRAFT', label: 'Draft' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'SCHEDULED', label: 'Scheduled for Shipment' },
  { id: 'IN_TRANSIT', label: 'In Transit' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'ARCHIVED', label: 'Archived' },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

// Dummy Data
const DUMMY_DATA = {
  exports: [
    {
      id: generateId(), name: 'Shipment #C1001', customerId: 'CUST001', productId: 'PROD001',
      quantity: 5000, status: 'APPROVED', stage: 'SCHEDULED',
      slaStatus: 'ON_TRACK', eta: '2023-12-15',
      auditLogs: [
        { id: generateId(), timestamp: '2023-11-01 10:00', user: 'Admin User', action: 'Created Export', details: 'Initial draft' },
        { id: generateId(), timestamp: '2023-11-02 11:30', user: 'Approver A', action: 'Approved Export', details: 'Export approved by Approver A' },
      ],
      documents: ['invoice_C1001.pdf', 'packing_list_C1001.xlsx'],
      relatedRecords: [{ type: 'Customer', id: 'CUST001', name: 'Global Foods Inc.' }],
    },
    {
      id: generateId(), name: 'Shipment #C1002', customerId: 'CUST002', productId: 'PROD002',
      quantity: 3000, status: 'PENDING', stage: 'PENDING_APPROVAL',
      slaStatus: 'ON_TRACK', eta: '2023-12-20',
      auditLogs: [
        { id: generateId(), timestamp: '2023-11-03 09:00', user: 'Exporter User', action: 'Created Export', details: 'Draft for review' },
      ],
      documents: ['contract_C1002.pdf'],
      relatedRecords: [{ type: 'Customer', id: 'CUST002', name: 'Asia Imports Ltd.' }],
    },
    {
      id: generateId(), name: 'Shipment #C1003', customerId: 'CUST001', productId: 'PROD003',
      quantity: 7500, status: 'SHIPPED', stage: 'IN_TRANSIT',
      slaStatus: 'OVERDUE', eta: '2023-11-25',
      auditLogs: [
        { id: generateId(), timestamp: '2023-10-20 14:00', user: 'Admin User', action: 'Created Export', details: 'Initial draft' },
        { id: generateId(), timestamp: '2023-10-21 16:00', user: 'Approver B', action: 'Approved Export', details: 'Export approved by Approver B' },
        { id: generateId(), timestamp: '2023-10-25 09:00', user: 'Logistics', action: 'Marked Shipped', details: 'Cargo departed port' },
      ],
      documents: [],
      relatedRecords: [{ type: 'Customer', id: 'CUST001', name: 'Global Foods Inc.' }],
    },
    {
      id: generateId(), name: 'Shipment #C1004', customerId: 'CUST003', productId: 'PROD001',
      quantity: 10000, status: 'DELIVERED', stage: 'DELIVERED',
      slaStatus: 'ON_TRACK', eta: '2023-11-05',
      auditLogs: [
        { id: generateId(), timestamp: '2023-10-10 10:00', user: 'Admin User', action: 'Created Export', details: 'Initial draft' },
        { id: generateId(), timestamp: '2023-10-11 11:00', user: 'Approver A', action: 'Approved Export', details: 'Export approved' },
        { id: generateId(), timestamp: '2023-10-15 10:00', user: 'Logistics', action: 'Marked Shipped', details: 'Cargo departed' },
        { id: generateId(), timestamp: '2023-11-05 14:00', user: 'Logistics', action: 'Marked Delivered', details: 'Cargo delivered' },
      ],
      documents: ['delivery_receipt_C1004.pdf'],
      relatedRecords: [{ type: 'Customer', id: 'CUST003', name: 'Euro Traders' }],
    },
    {
      id: generateId(), name: 'Shipment #C1005', customerId: 'CUST002', productId: 'PROD002',
      quantity: 2000, status: 'REJECTED', stage: 'PENDING_APPROVAL',
      slaStatus: 'ON_TRACK', eta: '2023-11-30',
      auditLogs: [
        { id: generateId(), timestamp: '2023-11-05 10:00', user: 'Exporter User', action: 'Created Export', details: 'Draft for review' },
        { id: generateId(), timestamp: '2023-11-06 10:00', user: 'Approver B', action: 'Rejected Export', details: 'Rejected due to insufficient documentation' },
      ],
      documents: [],
      relatedRecords: [{ type: 'Customer', id: 'CUST002', name: 'Asia Imports Ltd.' }],
    },
  ],
  customers: [
    { id: 'CUST001', name: 'Global Foods Inc.', contactPerson: 'Alice Smith', email: 'alice@globalfoods.com', phone: '123-456-7890', status: 'ACTIVE' },
    { id: 'CUST002', name: 'Asia Imports Ltd.', contactPerson: 'Bob Johnson', email: 'bob@asiaimports.com', phone: '987-654-3210', status: 'ACTIVE' },
    { id: 'CUST003', name: 'Euro Traders', contactPerson: 'Catherine Lee', email: 'catherine@eurotraders.com', phone: '555-123-4567', status: 'ACTIVE' },
    { id: 'CUST004', name: 'Oceanic Distributors', contactPerson: 'David Chen', email: 'david@oceanic.com', phone: '111-222-3333', status: 'INACTIVE' },
  ],
  products: [
    { id: 'PROD001', name: 'Dried Coconut Flakes', type: 'Food', pricePerUnit: 1.5, stock: 100000, status: 'AVAILABLE' },
    { id: 'PROD002', name: 'Coconut Water (Canned)', type: 'Beverage', pricePerUnit: 2.0, stock: 50000, status: 'AVAILABLE' },
    { id: 'PROD003', name: 'Coconut Oil (Virgin)', type: 'Oil', pricePerUnit: 15.0, stock: 20000, status: 'AVAILABLE' },
    { id: 'PROD004', name: 'Coconut Milk Powder', type: 'Food', pricePerUnit: 5.0, stock: 30000, status: 'OUT_OF_STOCK' },
  ],
  users: [
    { id: 'USER001', name: 'Admin User', email: 'admin@example.com', role: ROLES.ADMIN, status: 'ACTIVE' },
    { id: 'USER002', name: 'Exporter John', email: 'john@example.com', role: ROLES.EXPORTER, status: 'ACTIVE' },
  ],
  activities: [
    { id: generateId(), timestamp: '2023-11-10 10:30', user: 'Admin User', action: 'Approved Shipment #C1001' },
    { id: generateId(), timestamp: '2023-11-10 09:45', user: 'Exporter John', action: 'Submitted Shipment #C1002 for Approval' },
    { id: generateId(), timestamp: '2023-11-09 16:15', user: 'Admin User', action: 'Updated Customer Global Foods Inc.' },
    { id: generateId(), timestamp: '2023-11-09 11:00', user: 'Logistics', action: 'Marked Shipment #C1003 as In Transit' },
    { id: generateId(), timestamp: '2023-11-08 14:00', user: 'Exporter John', action: 'Created New Product Coconut Milk Powder' },
  ]
};

// Global User Context (for RBAC)
const currentUser = {
  id: 'USER001',
  name: 'Admin User',
  role: ROLES.ADMIN,
};

// --- Reusable Components ---

const Icon = ({ name }) => <span className="icon">{name}</span>; // Placeholder for an actual icon library

const Button = ({ onClick, children, variant = 'primary', disabled, type = 'button', icon, className = '' }) => (
  <button
    onClick={onClick}
    className={`button button-${variant} ${className}`}
    disabled={disabled}
    type={type}
  >
    {icon && <Icon name={icon} />} {children}
  </button>
);

const Breadcrumbs = ({ path, navigate }) => {
  const breadcrumbItems = path.map((item, index) => (
    <React.Fragment key={item.name}>
      {index > 0 && <span>/</span>}
      {(item.onClick && index < path.length - 1) ? (
        <a href="#" onClick={() => item.onClick()} style={{ marginLeft: 'var(--spacing-xs)', marginRight: 'var(--spacing-xs)' }}>
          {item.name}
        </a>
      ) : (
        <span className="current-page" style={{ marginLeft: 'var(--spacing-xs)', marginRight: 'var(--spacing-xs)' }}>{item.name}</span>
      )}
    </React.Fragment>
  ));
  return <div className="breadcrumbs">{breadcrumbItems}</div>;
};

const Card = ({ title, status, children, onClick, hoverActions = [] }) => {
  return (
    <div className="card" onClick={onClick}>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {status && (
          <span
            className={`card-status card-status-${status}`}
            style={{ backgroundColor: STATUS_COLORS[status] || 'var(--secondary-color)' }}
          >
            {STATUS_LABELS[status] || status}
          </span>
        )}
      </div>
      <div className="card-body">{children}</div>
      {hoverActions.length > 0 && (
        <div className="card-hover-actions" onClick={(e) => e.stopPropagation()}>
          {hoverActions.map((action, index) => (
            <Button key={index} onClick={action.onClick} variant="primary" className="button-sm">
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

const FormField = ({ label, type = 'text', name, value, onChange, required, error, options, placeholder, isFile, onFileChange }) => {
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={error ? 'error' : ''}
            placeholder={placeholder}
          />
        );
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={error ? 'error' : ''}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        );
      case 'file':
        return (
          <div className="file-upload-container" onClick={() => document.getElementById(`file-input-${name}`)?.click()}>
            <input
              id={`file-input-${name}`}
              type="file"
              name={name}
              onChange={onFileChange}
              required={required}
              multiple={true}
              style={{ display: 'none' }}
            />
            <p>Drag 'n' drop some files here, or click to select files</p>
            {value && value.length > 0 && (
              <div className="uploaded-files">
                {value.map((file, index) => (
                  <span key={index} className="uploaded-file-item">
                    {typeof file === 'string' ? file.split('/').pop() : file?.name}
                    {/* In a real app, 'X' would remove from state */}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={error ? 'error' : ''}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label}
        {required && <span style={{ color: 'var(--danger-color)', marginLeft: 'var(--spacing-xs)' }}>*</span>}
      </label>
      {renderInput()}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

const WorkflowTracker = ({ currentStageId, workflowStages, slaStatus }) => {
  const currentStageIndex = workflowStages.findIndex(stage => stage.id === currentStageId);
  return (
    <div className="workflow-tracker">
      {workflowStages.map((stage, index) => (
        <div key={stage.id} className="workflow-stage">
          <div
            className={`workflow-stage-icon ${index < currentStageIndex ? 'completed' : ''} ${index === currentStageIndex ? 'current' : ''}`}
          >
            {index + 1}
          </div>
          <span
            className={`workflow-stage-label ${index < currentStageIndex ? 'completed' : ''} ${index === currentStageIndex ? 'current' : ''}`}
          >
            {stage.label}
          </span>
          {index === currentStageIndex && slaStatus && (
            <span
              className={`sla-status sla-status-${slaStatus}`}
              style={{ backgroundColor: STATUS_COLORS[slaStatus] }}
            >
              {STATUS_LABELS[slaStatus]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Screens ---

const GlobalSearch = ({ onSearch, navigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 2) {
      const allSearchable = [
        ...DUMMY_DATA.exports.map(exp => ({ type: 'Export', id: exp.id, name: exp.name, status: exp.status })),
        ...DUMMY_DATA.customers.map(cust => ({ type: 'Customer', id: cust.id, name: cust.name, status: cust.status })),
        ...DUMMY_DATA.products.map(prod => ({ type: 'Product', id: prod.id, name: prod.name, status: prod.status })),
      ];
      const filtered = allSearchable.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.id.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (item) => {
    setSearchTerm(item.name);
    setSuggestions([]);
    if (item.type === 'Export') navigate('EXPORT_DETAIL', { id: item.id });
    // Add navigation for other types if needed
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm); // Potentially navigate to a global search results page
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <form onSubmit={handleSearchSubmit} className="global-search" ref={searchRef}>
      <input
        type="text"
        placeholder="Global Search (e.g., shipment ID, customer name)"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {suggestions.length > 0 && (
        <div className="global-search-suggestions">
          <ul>
            {suggestions.map(item => (
              <li key={item.id} onClick={() => handleSuggestionClick(item)}>
                <strong>{item.type}:</strong> {item.name} ({item.id})
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};

const FiltersPanel = ({ filters, onFilterChange, onApplyFilters, onClearFilters, showPanel, togglePanel }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    if (window.innerWidth <= 768) togglePanel(); // Close panel on mobile
  };

  const handleClear = () => {
    onClearFilters();
    if (window.innerWidth <= 768) togglePanel(); // Close panel on mobile
  };

  return (
    <>
      <div className={`filters-panel-overlay ${showPanel ? 'active' : ''}`} onClick={togglePanel}></div>
      <div className={`filters-panel ${showPanel ? 'active' : ''}`}>
        <h3>Filters</h3>
        <FormField
          label="Status"
          type="select"
          name="status"
          value={localFilters.status || ''}
          onChange={handleChange}
          options={[{ value: '', label: 'All' }, ...Object.keys(STATUS_LABELS).map(key => ({ value: key, label: STATUS_LABELS[key] }))]}
        />
        <FormField
          label="Customer"
          type="select"
          name="customerId"
          value={localFilters.customerId || ''}
          onChange={handleChange}
          options={[{ value: '', label: 'All' }, ...DUMMY_DATA.customers.map(cust => ({ value: cust.id, label: cust.name }))]}
        />
        <FormField
          label="Product Type"
          type="select"
          name="productType"
          value={localFilters.productType || ''}
          onChange={handleChange}
          options={[{ value: '', label: 'All' }, { value: 'Food', label: 'Food' }, { value: 'Beverage', label: 'Beverage' }, { value: 'Oil', label: 'Oil' }]}
        />
        <div className="form-actions">
          <Button variant="outline-primary" onClick={handleClear}>Clear</Button>
          <Button variant="primary" onClick={handleApply}>Apply Filters</Button>
        </div>
      </div>
    </>
  );
};


const DashboardScreen = ({ navigate }) => {
  const [isLive, setIsLive] = useState(true);

  const breadcrumbs = [{ name: 'Dashboard' }];

  const handleChartClick = (chartName) => {
    console.log(`Clicked ${chartName} chart`);
    // In a real app, this might navigate to a detailed analytics page
  };

  const handleRecentActivityClick = (activity) => {
    console.log('Activity clicked:', activity);
    // Navigate to related detail screen
    if (activity.action.includes('Shipment')) {
      const shipmentIdMatch = activity.action.match(/#(C\d+)/);
      if (shipmentIdMatch?.[1]) navigate('EXPORT_DETAIL', { id: shipmentIdMatch[1] });
    }
    // Add logic for other entity types
  };

  return (
    <div className="main-content">
      <Breadcrumbs path={breadcrumbs} navigate={navigate} />
      <div className="screen-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          Dashboard <span className={`live-pulse`} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></span>
        </h2>
        <div className="screen-actions">
          <Button onClick={() => console.log('Export Dashboard PDF')} icon="download">Export PDF</Button>
          <Button onClick={() => console.log('Export Dashboard Excel')} icon="download">Export Excel</Button>
          <Button onClick={() => setIsLive(prev => !prev)} variant="outline-primary">{isLive ? 'Pause Live' : 'Resume Live'}</Button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-card" onClick={() => handleChartClick('Total Exports')}>
          <h3>Total Exports (Bar Chart)</h3>
          <p style={{ color: 'var(--text-color-light)' }}>Visualization of export volume over time.</p>
          <div style={{ height: '200px', backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color-light)' }}>
            Bar Chart Placeholder
          </div>
        </div>

        <div className="chart-card" onClick={() => handleChartClick('Exports by Status')}>
          <h3>Exports by Status (Donut Chart)</h3>
          <p style={{ color: 'var(--text-color-light)' }}>Breakdown of exports by their current status.</p>
          <div style={{ height: '200px', backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color-light)' }}>
            Donut Chart Placeholder
          </div>
        </div>

        <div className="chart-card" onClick={() => handleChartClick('SLA Performance')}>
          <h3>SLA Performance (Gauge Chart)</h3>
          <p style={{ color: 'var(--text-color-light)' }}>Percentage of exports meeting SLA targets.</p>
          <div style={{ height: '200px', backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color-light)' }}>
            Gauge Chart Placeholder
          </div>
        </div>

        <div className="chart-card" onClick={() => handleChartClick('Historical Export Value')} style={{ gridColumn: 'span 2' }}>
          <h3>Historical Export Value (Line Chart)</h3>
          <p style={{ color: 'var(--text-color-light)' }}>Trend of export value over the last 12 months.</p>
          <div style={{ height: '250px', backgroundColor: 'var(--background-color)', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color-light)' }}>
            Line Chart Placeholder
          </div>
        </div>

        <div className="recent-activities">
          <h3>Recent Activities</h3>
          <div className="activity-list" style={{ marginTop: 'var(--spacing-md)' }}>
            {DUMMY_DATA.activities.map(activity => (
              <div key={activity.id} className="activity-item" onClick={() => handleRecentActivityClick(activity)}>
                <p><strong>{activity.user}</strong> {activity.action}</p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>{activity.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportsListScreen = ({ navigate, addExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [activeSavedView, setActiveSavedView] = useState('all');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const allExports = DUMMY_DATA.exports.map(exp => ({
    ...exp,
    customerName: DUMMY_DATA.customers.find(c => c.id === exp.customerId)?.name || 'N/A',
    productName: DUMMY_DATA.products.find(p => p.id === exp.productId)?.name || 'N/A',
  }));

  const filteredExports = allExports.filter(exp => {
    const searchMatch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        exp.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        exp.productId.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = filters.status ? exp.status === filters.status : true;
    const customerMatch = filters.customerId ? exp.customerId === filters.customerId : true;
    const productTypeMatch = filters.productType ? (DUMMY_DATA.products.find(p => p.id === exp.productId)?.type === filters.productType) : true;

    return searchMatch && statusMatch && customerMatch && productTypeMatch;
  });

  const sortedExports = [...filteredExports].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSavedViewClick = (viewName, viewFilters) => {
    setActiveSavedView(viewName);
    setFilters(viewFilters);
  };

  const breadcrumbs = [{ name: 'Exports' }];

  const savedViews = [
    { name: 'All', icon: '🌍', filters: {} },
    { name: 'Pending Approval', icon: '⏳', filters: { status: 'PENDING' } },
    { name: 'SLA Overdue', icon: '🚨', filters: { slaStatus: 'OVERDUE' } },
    { name: 'My Exports', icon: '👤', filters: { /* user-specific filter */ } },
  ];

  const toggleFiltersPanel = () => setShowFiltersPanel(prev => !prev);

  // Function to simulate real-time update
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate a subtle pulse on a random card
      const cards = document.querySelectorAll('.card');
      if (cards.length > 0) {
        const randomIndex = Math.floor(Math.random() * cards.length);
        const card = cards[randomIndex];
        card.classList.add('live-pulse');
        setTimeout(() => {
          card.classList.remove('live-pulse');
        }, 1500);
      }
    }, 5000); // Pulse every 5 seconds

    return () => clearInterval(interval);
  }, [sortedExports]); // Re-run effect if exports change

  return (
    <div className="main-content" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-xl)' }}>
      <div style={{ gridColumn: '1 / 2' }}> {/* Main content column */}
        <Breadcrumbs path={breadcrumbs} navigate={navigate} />
        <div className="screen-header">
          <h2>Coconut Exports</h2>
          <div className="screen-actions">
            <Button onClick={() => navigate('EXPORT_FORM', { mode: 'create' })} variant="primary" icon="add">Add Export</Button>
            <Button onClick={() => console.log('Bulk Actions')} variant="secondary" icon="bulk">Bulk Actions</Button>
            <Button onClick={() => console.log('Export to Excel')} variant="outline-primary" icon="excel">Export Excel</Button>
            <Button onClick={toggleFiltersPanel} variant="outline-primary" icon="filter">Filter</Button>
          </div>
        </div>

        <div className="saved-views">
          {savedViews.map(view => (
            <div
              key={view.name}
              className={`saved-view-item ${activeSavedView === view.name ? 'active' : ''}`}
              onClick={() => handleSavedViewClick(view.name, view.filters)}
            >
              <Icon name={view.icon} /> {view.name}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <input
            type="text"
            placeholder="Search Exports (Name, Customer, Product ID)"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ width: '100%', padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>

        {/* Sort Controls */}
        <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
          <span>Sort by:</span>
          <Button onClick={() => requestSort('name')} variant="button-icon">Name {sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</Button>
          <Button onClick={() => requestSort('status')} variant="button-icon">Status {sortConfig.key === 'status' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</Button>
          <Button onClick={() => requestSort('eta')} variant="button-icon">ETA {sortConfig.key === 'eta' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</Button>
        </div>

        {sortedExports.length > 0 ? (
          <div className="card-list">
            {sortedExports.map(exp => (
              <Card
                key={exp.id}
                title={exp.name}
                status={exp.status}
                onClick={() => navigate('EXPORT_DETAIL', { id: exp.id })}
                hoverActions={[
                  { label: 'Edit', onClick: () => navigate('EXPORT_FORM', { mode: 'edit', id: exp.id }) },
                  { label: 'Approve', onClick: () => console.log(`Approve ${exp.id}`) },
                ]}
              >
                <p>Customer: <strong>{exp.customerName}</strong></p>
                <p>Product: <strong>{exp.productName}</strong> ({exp.quantity} units)</p>
                <p>ETA: {exp.eta}</p>
                <p>SLA: <span
                  className={`sla-status sla-status-${exp.slaStatus}`}
                  style={{ backgroundColor: STATUS_COLORS[exp.slaStatus] }}
                >{STATUS_LABELS[exp.slaStatus]}</span></p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="no-data-message">
            <h3>No Exports Found</h3>
            <p>It looks like there are no exports matching your current filters.</p>
            <Button onClick={() => navigate('EXPORT_FORM', { mode: 'create' })} variant="primary">Create New Export</Button>
          </div>
        )}
      </div>
      <div style={{ gridColumn: '2 / 3' }}> {/* Filters Panel Column */}
        <FiltersPanel
          filters={filters}
          onFilterChange={setFilters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          showPanel={showFiltersPanel}
          togglePanel={toggleFiltersPanel}
        />
      </div>
    </div>
  );
};

const ExportDetailScreen = ({ navigate, params, updateExport }) => {
  const exportId = params.id;
  const exportData = DUMMY_DATA.exports.find(exp => exp.id === exportId);

  if (!exportData) {
    return (
      <div className="main-content">
        <p>Export not found.</p>
        <Button onClick={() => navigate('EXPORTS_LIST')}>Back to Exports</Button>
      </div>
    );
  }

  const customer = DUMMY_DATA.customers.find(c => c.id === exportData?.customerId);
  const product = DUMMY_DATA.products.find(p => p.id === exportData?.productId);

  const breadcrumbs = [
    { name: 'Exports', onClick: () => navigate('EXPORTS_LIST') },
    { name: exportData?.name || 'Detail' },
  ];

  const handleAction = (action) => {
    console.log(`Action "${action}" for export ${exportId}`);
    // Simulate updating export status or performing an action
    if (action === 'Approve') {
      const updatedExports = DUMMY_DATA.exports.map(exp =>
        exp.id === exportId ? { ...exp, status: 'APPROVED', stage: 'APPROVED', slaStatus: 'ON_TRACK',
          auditLogs: [...exp.auditLogs, { id: generateId(), timestamp: new Date().toLocaleString(), user: currentUser.name, action: 'Approved Export', details: 'Export approved via quick action' }]
        } : exp
      );
      // In a real app, this would dispatch an action to update global state/API
      // For this dummy app, we'd directly mutate DUMMY_DATA or force a re-render
      // For strict immutability, this would require a full state update from App.jsx parent
      updateExport(updatedExports.find(exp => exp.id === exportId)); // Pass updated export back to parent
      alert(`Export ${exportId} approved! (Simulated)`);
    } else if (action === 'Reject') {
      const updatedExports = DUMMY_DATA.exports.map(exp =>
        exp.id === exportId ? { ...exp, status: 'REJECTED', slaStatus: 'ON_TRACK', // No SLA breach for rejected
          auditLogs: [...exp.auditLogs, { id: generateId(), timestamp: new Date().toLocaleString(), user: currentUser.name, action: 'Rejected Export', details: 'Export rejected via quick action' }]
        } : exp
      );
      updateExport(updatedExports.find(exp => exp.id === exportId));
      alert(`Export ${exportId} rejected! (Simulated)`);
    }
  };

  const hasPermission = (permission) => {
    // Simplified RBAC logic: Admin has all permissions for demo
    return currentUser.role === ROLES.ADMIN;
  };

  return (
    <div className="main-content">
      <Breadcrumbs path={breadcrumbs} navigate={navigate} />
      <div className="detail-page">
        <div className="detail-header">
          <h2>{exportData?.name}</h2>
          <div className="screen-actions">
            {hasPermission('export:edit') && (
              <Button onClick={() => navigate('EXPORT_FORM', { mode: 'edit', id: exportId })} variant="outline-primary" icon="edit">Edit</Button>
            )}
            {hasPermission('export:approve') && exportData?.status === 'PENDING' && (
              <Button onClick={() => handleAction('Approve')} variant="success" icon="check">Approve</Button>
            )}
            {hasPermission('export:reject') && exportData?.status === 'PENDING' && (
              <Button onClick={() => handleAction('Reject')} variant="danger" icon="close">Reject</Button>
            )}
            {hasPermission('export:export') && (
              <Button onClick={() => console.log('Export PDF')} icon="download">Export PDF</Button>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h3>Workflow Progress</h3>
          <WorkflowTracker
            currentStageId={exportData?.stage}
            workflowStages={EXPORT_WORKFLOW_STAGES}
            slaStatus={exportData?.slaStatus}
          />
        </div>

        <div className="detail-section">
          <h3>Export Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Status</label>
              <span
                className={`card-status card-status-${exportData?.status}`}
                style={{ backgroundColor: STATUS_COLORS[exportData?.status] }}
              >
                {STATUS_LABELS[exportData?.status]}
              </span>
            </div>
            <div className="detail-item"><label>Customer</label><span>{customer?.name || 'N/A'} ({exportData?.customerId})</span></div>
            <div className="detail-item"><label>Product</label><span>{product?.name || 'N/A'} ({exportData?.productId})</span></div>
            <div className="detail-item"><label>Quantity</label><span>{exportData?.quantity} units</span></div>
            <div className="detail-item"><label>ETA</label><span>{exportData?.eta}</span></div>
            <div className="detail-item"><label>Current Stage</label><span>{EXPORT_WORKFLOW_STAGES.find(s => s.id === exportData?.stage)?.label || exportData?.stage}</span></div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Related Records</h3>
          {exportData?.relatedRecords && exportData.relatedRecords.length > 0 ? (
            <div className="related-records-list">
              {exportData.relatedRecords.map(record => (
                <div key={record.id} className="related-record-item" onClick={() => console.log(`Navigate to ${record.type} ${record.id}`)}>
                  <span><strong>{record.type}:</strong> {record.name} ({record.id})</span>
                  <Button variant="button-icon" icon="arrow_forward">Details</Button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-color-light)' }}>No related records.</p>
          )}
        </div>

        <div className="detail-section">
          <h3>Documents</h3>
          {exportData?.documents && exportData.documents.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              {exportData.documents.map((doc, index) => (
                <div key={index} className="document-preview-container" style={{ width: '200px', height: '150px' }}>
                  <p>{doc}</p> {/* Placeholder for actual preview */}
                  <Button onClick={() => console.log(`Download ${doc}`)} variant="button-icon" icon="download" style={{ position: 'absolute', bottom: 'var(--spacing-sm)', right: 'var(--spacing-sm)' }}>Download</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="document-preview-container"><p>No documents attached.</p></div>
          )}
        </div>

        <div className="detail-section">
          <h3>Audit Log</h3>
          {exportData?.auditLogs && exportData.auditLogs.length > 0 ? (
            <div className="audit-log-list">
              {exportData.auditLogs.map((log, index) => (
                <div key={index} className="audit-log-item">
                  <span><strong>{log.timestamp}</strong> - {log.user} performed <strong>{log.action}</strong>: {log.details}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-color-light)' }}>No audit logs available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ExportFormScreen = ({ navigate, params, addExport, updateExport }) => {
  const mode = params.mode; // 'create' or 'edit'
  const exportId = params.id;
  const existingExport = DUMMY_DATA.exports.find(exp => exp.id === exportId);

  const [formData, setFormData] = useState({
    name: existingExport?.name || '',
    customerId: existingExport?.customerId || '',
    productId: existingExport?.productId || '',
    quantity: existingExport?.quantity || '',
    eta: existingExport?.eta || '',
    status: existingExport?.status || 'PENDING',
    stage: existingExport?.stage || 'DRAFT',
    documents: existingExport?.documents || [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && existingExport) {
      setFormData({
        name: existingExport.name,
        customerId: existingExport.customerId,
        productId: existingExport.productId,
        quantity: existingExport.quantity,
        eta: existingExport.eta,
        status: existingExport.status,
        stage: existingExport.stage,
        documents: existingExport.documents,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '', customerId: '', productId: '', quantity: '', eta: '',
        status: 'PENDING', stage: 'DRAFT', documents: [],
      });
    }
  }, [mode, existingExport]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Export Name is required.';
    if (!formData.customerId) newErrors.customerId = 'Customer is required.';
    if (!formData.productId) newErrors.productId = 'Product is required.';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Quantity must be a positive number.';
    if (!formData.eta) newErrors.eta = 'ETA is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined })); // Clear error on change
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files.map(f => f.name)], // In real app, store file objects or upload to S3 and store URLs
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === 'create') {
      const newExport = {
        id: generateId(),
        ...formData,
        auditLogs: [{ id: generateId(), timestamp: new Date().toLocaleString(), user: currentUser.name, action: 'Created Export', details: 'New export created' }],
        slaStatus: 'ON_TRACK', // Default for new exports
        relatedRecords: [{ type: 'Customer', id: formData.customerId, name: DUMMY_DATA.customers.find(c => c.id === formData.customerId)?.name || 'N/A' }],
      };
      addExport(newExport);
      alert('Export created successfully!');
    } else { // edit mode
      const updatedExport = {
        ...existingExport,
        ...formData,
        auditLogs: existingExport?.auditLogs ? [...existingExport.auditLogs, { id: generateId(), timestamp: new Date().toLocaleString(), user: currentUser.name, action: 'Updated Export', details: 'Export details updated' }] :
          [{ id: generateId(), timestamp: new Date().toLocaleString(), user: currentUser.name, action: 'Updated Export', details: 'Export details updated' }],
      };
      updateExport(updatedExport);
      alert('Export updated successfully!');
    }
    navigate('EXPORTS_LIST');
  };

  const breadcrumbs = [
    { name: 'Exports', onClick: () => navigate('EXPORTS_LIST') },
    { name: mode === 'create' ? 'Create New Export' : `Edit ${existingExport?.name || 'Export'}` },
  ];

  const customerOptions = [{ value: '', label: 'Select Customer' }, ...DUMMY_DATA.customers.map(c => ({ value: c.id, label: c.name }))];
  const productOptions = [{ value: '', label: 'Select Product' }, ...DUMMY_DATA.products.map(p => ({ value: p.id, label: p.name }))];

  return (
    <div className="main-content">
      <Breadcrumbs path={breadcrumbs} navigate={navigate} />
      <div className="form-container">
        <h2 style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>{mode === 'create' ? 'Create New Export' : `Edit Export: ${existingExport?.name}`}</h2>
        <form onSubmit={handleSubmit}>
          <FormField
            label="Export Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required={true}
            error={errors.name}
            placeholder="e.g., Shipment #C1006"
          />
          <FormField
            label="Customer"
            type="select"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            required={true}
            error={errors.customerId}
            options={customerOptions}
          />
          <FormField
            label="Product"
            type="select"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            required={true}
            error={errors.productId}
            options={productOptions}
          />
          <FormField
            label="Quantity"
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required={true}
            error={errors.quantity}
            placeholder="e.g., 5000"
          />
          <FormField
            label="Estimated Time of Arrival (ETA)"
            type="date"
            name="eta"
            value={formData.eta}
            onChange={handleChange}
            required={true}
            error={errors.eta}
          />
          <FormField
            label="Documents"
            type="file"
            name="documents"
            value={formData.documents}
            onFileChange={handleFileChange}
            required={false}
          />

          <div className="form-actions">
            <Button onClick={() => navigate('EXPORTS_LIST')} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">
              {mode === 'create' ? 'Create Export' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---
const App = () => {
  const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
  const [appData, setAppData] = useState(DUMMY_DATA); // Manage data in parent for immutability and updates

  const navigate = (screen, params = {}) => {
    setView({ screen, params });
    window.scrollTo(0, 0); // Scroll to top on navigation
  };

  const handleGlobalSearch = (term) => {
    console.log('Global search for:', term);
    // This would typically navigate to a global search results screen
  };

  const handleAddExport = (newExport) => {
    setAppData(prevData => ({
      ...prevData,
      exports: [...prevData.exports, newExport],
    }));
  };

  const handleUpdateExport = (updatedExport) => {
    setAppData(prevData => ({
      ...prevData,
      exports: prevData.exports.map(exp =>
        exp.id === updatedExport.id ? updatedExport : exp
      ),
    }));
  };

  // Simulate auto-populated field logic for form (e.g., if a customer is selected, pre-fill some product details)
  const getAutoPopulatedProduct = (customerId) => {
    // For demo, just return first product if a customer is selected
    if (customerId && appData.products.length > 0) {
      return appData.products[0];
    }
    return null;
  };

  const renderScreen = () => {
    switch (view.screen) {
      case 'DASHBOARD':
        return <DashboardScreen navigate={navigate} />;
      case 'EXPORTS_LIST':
        return <ExportsListScreen navigate={navigate} addExport={handleAddExport} />;
      case 'EXPORT_DETAIL':
        return <ExportDetailScreen navigate={navigate} params={view.params} updateExport={handleUpdateExport} />;
      case 'EXPORT_FORM':
        return <ExportFormScreen navigate={navigate} params={view.params} addExport={handleAddExport} updateExport={handleUpdateExport} />;
      // Add other screens like CustomersList, ProductsList, etc.
      default:
        return (
          <div className="main-content">
            <h2>404 - Screen Not Found</h2>
            <Button onClick={() => navigate('DASHBOARD')}>Go to Dashboard</Button>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-logo" onClick={() => navigate('DASHBOARD')} style={{ cursor: 'pointer' }}>Coconut Export</div>
        <GlobalSearch onSearch={handleGlobalSearch} navigate={navigate} />
        <nav className="header-nav">
          <div className={`header-nav-item ${view.screen === 'DASHBOARD' ? 'active' : ''}`} onClick={() => navigate('DASHBOARD')}>Dashboard</div>
          <div className={`header-nav-item ${view.screen === 'EXPORTS_LIST' || view.screen === 'EXPORT_DETAIL' || view.screen === 'EXPORT_FORM' ? 'active' : ''}`} onClick={() => navigate('EXPORTS_LIST')}>Exports</div>
          <div className="header-nav-item" onClick={() => console.log('Customers')}>Customers</div> {/* Placeholder */}
          <div className="header-nav-item" onClick={() => console.log('Products')}>Products</div> {/* Placeholder */}
          <div className="header-nav-item" onClick={() => console.log('Settings')}>Settings</div> {/* Placeholder */}
          <div className="header-nav-item" onClick={() => console.log('Logout')}>Logout ({currentUser.name})</div>
        </nav>
      </header>
      {renderScreen()}
    </div>
  );
};

export default App;