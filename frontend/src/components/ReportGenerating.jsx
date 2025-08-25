import React, { useState } from 'react';

const ReportGenerating = ({ deliveries, onClose }) => {
  const [reportFilters, setReportFilters] = useState({
    reportType: 'summary',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    assignedTo: 'all',
  });

  // Generate filtered deliveries based on filters
  const generateReport = () => {
    let filteredDeliveries = [...deliveries];

    if (reportFilters.dateFrom) {
      filteredDeliveries = filteredDeliveries.filter((d) =>
        new Date(d.orderDate) >= new Date(reportFilters.dateFrom)
      );
    }
    if (reportFilters.dateTo) {
      filteredDeliveries = filteredDeliveries.filter((d) =>
        new Date(d.orderDate) <= new Date(reportFilters.dateTo)
      );
    }
    if (reportFilters.status !== 'all') {
      filteredDeliveries = filteredDeliveries.filter(
        (d) => d.status === reportFilters.status
      );
    }
    if (reportFilters.assignedTo !== 'all') {
      filteredDeliveries = filteredDeliveries.filter(
        (d) => d.driver?.name === reportFilters.assignedTo
      );
    }

    return filteredDeliveries;
  };

  // Get report summary statistics
  const getReportSummary = () => {
    const filteredDeliveries = generateReport();
    const total = filteredDeliveries.length;
    const pending = filteredDeliveries.filter((d) => d.status === 'Pending').length;
    const inProgress = filteredDeliveries.filter((d) => d.status === 'In Progress').length;
    const delivered = filteredDeliveries.filter((d) => d.status === 'Delivered').length;
    const cancelled = filteredDeliveries.filter((d) => d.status === 'Cancelled').length;

    return { total, pending, inProgress, delivered, cancelled };
  };

  // Get delivery person performance statistics
  const getDeliveryPersonStats = () => {
    const filteredDeliveries = generateReport();
    const stats = {};

    filteredDeliveries.forEach((delivery) => {
      const assignee = delivery.driver?.name || 'Unassigned';
      if (!stats[assignee]) {
        stats[assignee] = {
          total: 0,
          pending: 0,
          inProgress: 0,
          delivered: 0,
          cancelled: 0,
        };
      }
      stats[assignee].total++;

      const statusKey = delivery.status.toLowerCase().replace(' ', '');
      if (statusKey === 'inprogress') {
        stats[assignee].inProgress++;
      } else {
        stats[assignee][statusKey] = (stats[assignee][statusKey] || 0) + 1;
      }
    });

    return stats;
  };

  // Export to CSV function
  const exportToCSV = () => {
    const filteredDeliveries = generateReport();
    const headers = [
      'Delivery ID',
      'Order ID',
      'Customer Name',
      'Address',
      'Assigned To',
      'Order Date',
      'Status',
    ];

    const csvContent = [
      headers.join(','),
      ...filteredDeliveries.map((delivery) => [
        delivery.deliveryId || '',
        delivery.orderId || '',
        `"${delivery.customerName}"`,
        `"${delivery.address}"`,
        delivery.driver?.name || '',
        new Date(delivery.orderDate).toLocaleDateString(),
        delivery.status,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Print report function
  const printReport = () => {
    const filteredDeliveries = generateReport();
    const summary = getReportSummary();

    const printContent = `
      <html>
        <head>
          <title>Delivery Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
            .summary-card { background: white; padding: 10px; border-radius: 5px; border-left: 4px solid #007bff; }
            .header { text-align: center; margin-bottom: 30px; }
            .date-range { font-style: italic; color: #666; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Delivery Management Report</h1>
            <p class="date-range">Generated on: ${new Date().toLocaleString()}</p>
            ${reportFilters.dateFrom || reportFilters.dateTo
              ? `<p class="date-range">Report Period: ${reportFilters.dateFrom || 'Start'} to ${reportFilters.dateTo || 'End'}</p>`
              : ''}
          </div>
          
          <div class="summary">
            <h2>Executive Summary</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <strong>Total Deliveries:</strong> ${summary.total}
              </div>
              <div class="summary-card">
                <strong>Pending:</strong> ${summary.pending}
              </div>
              <div class="summary-card">
                <strong>In Progress:</strong> ${summary.inProgress}
              </div>
              <div class="summary-card">
                <strong>Delivered:</strong> ${summary.delivered}
              </div>
              <div class="summary-card">
                <strong>Cancelled:</strong> ${summary.cancelled}
              </div>
              <div class="summary-card">
                <strong>Success Rate:</strong> ${summary.total > 0
                  ? Math.round((summary.delivered / summary.total) * 100)
                  : 0}%
              </div>
            </div>
          </div>

          <h2>Delivery Details</h2>
          <table>
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Address</th>
                <th>Assigned To</th>
                <th>Order Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDeliveries
                .map(
                  (delivery) => `
                <tr>
                  <td>${delivery.deliveryId || ''}</td>
                  <td>${delivery.orderId || ''}</td>
                  <td>${delivery.customerName}</td>
                  <td>${delivery.address}</td>
                  <td>${delivery.driver?.name || ''}</td>
                  <td>${new Date(delivery.orderDate).toLocaleDateString()}</td>
                  <td>${delivery.status}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Get unique assignees for filter dropdown
  const getUniqueAssignees = () => {
    return [...new Set(deliveries.map((d) => d.driver?.name || 'Unassigned'))];
  };

  // Table styles
  const tableHeader = {
    textAlign: 'left',
    padding: '16px',
    color: '#4a5568',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e2e8f0',
  };

  const tableCell = {
    padding: '16px',
    color: '#2d3748',
    fontSize: '14px',
  };

  return (
    <div
      style={{
        backgroundColor: '#f7fafc',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '32px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#2d3748',
            margin: 0,
          }}
        >
          Generate Reports
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#718096',
            padding: '4px',
            borderRadius: '4px',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#e2e8f0')}
          onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          ×
        </button>
      </div>

      {/* Report Filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <select
          value={reportFilters.reportType}
          onChange={(e) =>
            setReportFilters({ ...reportFilters, reportType: e.target.value })
          }
          style={{ padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
        >
          <option value="summary">Summary Report</option>
          <option value="detailed">Detailed Report</option>
          <option value="performance">Performance Report</option>
        </select>

        <input
          type="date"
          placeholder="From Date"
          value={reportFilters.dateFrom}
          onChange={(e) =>
            setReportFilters({ ...reportFilters, dateFrom: e.target.value })
          }
          style={{ padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
        />

        <input
          type="date"
          placeholder="To Date"
          value={reportFilters.dateTo}
          onChange={(e) =>
            setReportFilters({ ...reportFilters, dateTo: e.target.value })
          }
          style={{ padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
        />

        <select
          value={reportFilters.status}
          onChange={(e) =>
            setReportFilters({ ...reportFilters, status: e.target.value })
          }
          style={{ padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={reportFilters.assignedTo}
          onChange={(e) =>
            setReportFilters({ ...reportFilters, assignedTo: e.target.value })
          }
          style={{ padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
        >
          <option value="all">All Assignees</option>
          {getUniqueAssignees().map((assignee) => (
            <option key={assignee} value={assignee}>
              {assignee}
            </option>
          ))}
        </select>
      </div>

      {/* Report Summary Cards */}
      {(() => {
        const summary = getReportSummary();
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                background: '#e6fffa',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #81e6d9',
              }}
            >
              <div
                style={{ fontSize: '24px', fontWeight: '700', color: '#234e52' }}
              >
                {summary.total}
              </div>
              <div style={{ color: '#2c7a7b', fontSize: '14px' }}>
                Total Deliveries
              </div>
            </div>
            <div
              style={{
                background: '#fffaf0',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #fbd38d',
              }}
            >
              <div
                style={{ fontSize: '24px', fontWeight: '700', color: '#744210' }}
              >
                {summary.pending}
              </div>
              <div style={{ color: '#975a16', fontSize: '14px' }}>Pending</div>
            </div>
            <div
              style={{
                background: '#fffff0',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #f6e05e',
              }}
            >
              <div
                style={{ fontSize: '24px', fontWeight: '700', color: '#744210' }}
              >
                {summary.inProgress}
              </div>
              <div style={{ color: '#975a16', fontSize: '14px' }}>
                In Progress
              </div>
            </div>
            <div
              style={{
                background: '#f0fff4',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #9ae6b4',
              }}
            >
              <div
                style={{ fontSize: '24px', fontWeight: '700', color: '#22543d' }}
              >
                {summary.delivered}
              </div>
              <div style={{ color: '#2f855a', fontSize: '14px' }}>Delivered</div>
            </div>
            <div
              style={{
                background: '#fff5f5',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #feb2b2',
              }}
            >
              <div
                style={{ fontSize: '24px', fontWeight: '700', color: '#742a2a' }}
              >
                {summary.cancelled}
              </div>
              <div style={{ color: '#c53030', fontSize: '14px' }}>Cancelled</div>
            </div>
          </div>
        );
      })()}

      {/* Performance Stats */}
      {reportFilters.reportType === 'performance' && (
        <div style={{ marginBottom: '20px' }}>
          <h4
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#2d3748',
            }}
          >
            Delivery Person Performance
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: '8px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#edf2f7' }}>
                  <th style={tableHeader}>Assignee</th>
                  <th style={tableHeader}>Total</th>
                  <th style={tableHeader}>Delivered</th>
                  <th style={tableHeader}>Pending</th>
                  <th style={tableHeader}>In Progress</th>
                  <th style={tableHeader}>Cancelled</th>
                  <th style={tableHeader}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(getDeliveryPersonStats()).map(
                  ([person, stats]) => (
                    <tr
                      key={person}
                      style={{ borderBottom: '1px solid #e2e8f0' }}
                    >
                      <td style={tableCell}>{person}</td>
                      <td style={tableCell}>{stats.total}</td>
                      <td style={tableCell}>{stats.delivered}</td>
                      <td style={tableCell}>{stats.pending}</td>
                      <td style={tableCell}>{stats.inProgress}</td>
                      <td style={tableCell}>{stats.cancelled}</td>
                      <td style={tableCell}>
                        <span
                          style={{
                            backgroundColor:
                              stats.total > 0 &&
                              (stats.delivered / stats.total) >= 0.8
                                ? '#c6f6d5'
                                : '#fef5e7',
                            color:
                              stats.total > 0 &&
                              (stats.delivered / stats.total) >= 0.8
                                ? '#2f855a'
                                : '#975a16',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          {stats.total > 0
                            ? `${Math.round(
                                (stats.delivered / stats.total) * 100
                              )}%`
                            : '0%'}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={exportToCSV}
          style={{
            backgroundColor: '#2b6cb0',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          <svg
            style={{ width: '16px', height: '16px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </button>

        <button
          onClick={printReport}
          style={{
            backgroundColor: '#4a5568',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          <svg
            style={{ width: '16px', height: '16px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print Report
        </button>

        <button
          onClick={() => {
            setReportFilters({
              reportType: 'summary',
              dateFrom: '',
              dateTo: '',
              status: 'all',
              assignedTo: 'all',
            });
          }}
          style={{
            backgroundColor: '#edf2f7',
            color: '#4a5568',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default ReportGenerating;