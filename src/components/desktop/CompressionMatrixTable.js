import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MetricsTable = ({ rawData, compressedData, onSave }) => {
    const [isSaveModalOpen, setSaveModalOpen] = useState(false);
    const [includeCSV, setIncludeCSV] = useState(false);

    const calculateMetrics = (rawData, compressedData) => {
        const rawDataPoints = rawData.length;
        const compressedDataPoints = compressedData.length;
        const compressionRatio = compressedDataPoints === 0
            ? 'Infinity'
            : (rawDataPoints / compressedDataPoints).toFixed(2);
        const storageSizeRaw = (rawDataPoints * 4 / 1024).toFixed(2); // Changed from MB to KB
        const storageSizeCompressed = (compressedDataPoints * 4 / 1024).toFixed(2); // Changed from MB to KB
        let errorRate = 'N/A';
        if (rawData.length > 0 && compressedData.length > 0) {
            const rawSum = rawData.reduce((sum, val) => sum + val, 0);
            const compressedSum = compressedData.reduce((sum, val) => sum + val, 0);
            errorRate = rawSum === 0
                ? '0.00'
                : ((1 - compressedSum / rawSum) * 100).toFixed(2);
        }

        return [
            { name: 'Number of Data Points (Raw)', value: rawDataPoints.toString(), testId: 'metric-value-raw-points' },
            { name: 'Number of Data Points (Compressed)', value: compressedDataPoints.toString(), testId: 'metric-value-compressed-points' },
            { name: 'Compression Ratio', value: compressionRatio, testId: 'metric-value-ratio' },
            { name: 'Storage Size (Raw) (KB)', value: storageSizeRaw },
            { name: 'Storage Size (Compressed) (KB)', value: storageSizeCompressed },
            { name: 'Error Rate (%)', value: errorRate, testId: 'metric-value-error-rate' },
        ];
    };

    const metrics = calculateMetrics(rawData, compressedData);

    const handleSave = () => setSaveModalOpen(true);
    const handleConfirmSave = () => {
        const config = {
            name: `Configuration ${new Date().toLocaleString()}`,
            date: new Date().toISOString(),
            parameters: metrics.reduce((acc, metric) => {
                acc[metric.name] = metric.value;
                return acc;
            }, {}),
            includeCSV,
        };
        onSave(config);
        setSaveModalOpen(false);
    };
    const handleCancelSave = () => setSaveModalOpen(false);
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            setSaveModalOpen(false);
        }
    };
    const handleDownloadConfig = () => {
        const metricsData = metrics.reduce((acc, metric) => {
            acc[metric.name] = metric.value;
            return acc;
        }, {});
        const blob = new Blob([JSON.stringify(metricsData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'metrics.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };


    return (
        <div
            data-testid="scroll-container"
            style={{
                fontFamily: 'Arial, sans-serif',
                borderRadius: '8px',
                padding: '0px',
                margin: '0',
                width: '100%',
                boxSizing: 'border-box',
                maxWidth: '95vw'
            }}
        >
            {metrics.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table
                        role="table"
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginBottom: '20px',
                            tableLayout: 'fixed'
                        }}
                    >
                        <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '120px' }}>Metric</th>
                            <th style={{ ...thStyle, width: '20px' }}>Value</th>
                        </tr>
                        </thead>
                        <tbody>
                        {metrics.map((item, index) => (
                            <tr key={index}>
                                <td style={tdStyle}>{item.name}</td>
                                <td style={tdStyle} data-testid={item.testId || null}>
                                    {item.value}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p style={{ color: 'gray', fontStyle: 'italic', textAlign: 'center', marginBottom: '20px' }}>
                    No data available
                </p>
            )}

            <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            marginTop: '0px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#45a049';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#4CAF50';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        data-testid="save-button"
                    >
                        Save Configuration
                    </button>

                    <button
                        onClick={handleDownloadConfig}
                        title="Download Matrices"
                        style={{
                            padding: '6px 14px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            border: '1px solid #90caf9',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#bbdefb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#e3f2fd';
                        }}
                    >
                        ⬇️
                    </button>
                </div>
            </div>

            {isSaveModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                    onClick={handleBackdropClick}
                    data-testid="modal-backdrop"
                >
                    <div
                        style={{
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '400px',
                            boxShadow: '0px 0px 10px rgba(0,0,0,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0 }}>Save Configuration</h3>
                        <div style={{ marginBottom: '10px' }}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={includeCSV}
                                    onChange={(e) => setIncludeCSV(e.target.checked)}
                                    data-testid="csv-checkbox"
                                />
                                Include CSV File
                            </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleConfirmSave}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    marginRight: '10px',
                                    cursor: 'pointer'
                                }}
                                data-testid="confirm-button"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={handleCancelSave}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                data-testid="cancel-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const thStyle = {
    padding: '16px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: '15px',
    fontWeight: 600,
    borderBottom: '2px solid #dee2e6',
    borderTop: '1px solid #dee2e6',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    fontFamily: 'Arial, sans-serif'
};

const tdStyle = {
    border: '1px solid #ddd',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 540,
    wordBreak: 'break-word',
    fontFamily: 'Arial, sans-serif'
};

MetricsTable.propTypes = {
    rawData: PropTypes.arrayOf(PropTypes.number).isRequired,
    compressedData: PropTypes.arrayOf(PropTypes.number).isRequired,
    onSave: PropTypes.func.isRequired,
};

export default MetricsTable;
