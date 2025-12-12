import React, { useState,useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import PropTypes from 'prop-types';
import Papa from 'papaparse';
import DataTable from './DataTable.js';

const ConfigPanel = forwardRef(({ setRawData, setLabels, setFile, onCompress,isCompressing, setCompressedData, setCompressedLabels, onUploadComplete  }, ref) => {
    // Parameter validation ranges
    const VALIDATION_RANGES = {
        compressionDeviationLimit: { min: 0, max: 200, unit: '', step: 0.1 },
        exceptionFilterDeviationLimit: { min: 0, max: 100, unit: '', step: 0.1 },
        minResampleLimit: { min: 0, max: 3600, unit: 'seconds', step: 1 },
        maxResampleLimit: { min: 0, max: 86400, unit: 'seconds', step: 1 }
    };

    // Default parameter values
    const DEFAULT_VALUES = {
        compressionDeviationLimit: 2,
        compressionDeviationType: 'percentage',
        exceptionFilterDeviationLimit: 1,
        exceptionFilterDeviationType: 'absolute',
        minResampleLimit: 0,
        maxResampleLimit: 5
    };

    // State variables
    const [compressionDeviationLimit, setCompressionDeviationLimit] = useState('');
    const [compressionDeviationType, setCompressionDeviationType] = useState('');
    const [exceptionFilterDeviationLimit, setExceptionFilterDeviationLimit] = useState('');
    const [exceptionFilterDeviationType, setExceptionFilterDeviationType] = useState('');
    const [minResampleLimit, setMinResampleLimit] = useState('');
    const [maxResampleLimit, setMaxResampleLimit] = useState('');
    const [file, setFileState] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [allTimes, setAllTimes] = useState([]);
    const [fullData, setFullData] = useState([]);
    const [fullLabels, setFullLabels] = useState([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showCloudModal, setShowCloudModal] = useState(false);
    const [showDataSourcesModal, setShowDataSourcesModal] = useState(false);
    const [chartVisible, setChartVisible] = useState(false);
    const [availableSources, setAvailableSources] = useState([]);
    const [allRawRows, setAllRawRows] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null);
    const [waitingUpload, setWaitingUpload] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem('lastOptimizedParams');
        if (saved) {
            const params = JSON.parse(saved);
            if (params.compressionDeviationLimit !== undefined)
                setCompressionDeviationLimit(params.compressionDeviationLimit);
            if (params.compressionDeviationType !== undefined)
                setCompressionDeviationType(params.compressionDeviationType);
            if (params.exceptionFilterDeviationLimit !== undefined)
                setExceptionFilterDeviationLimit(params.exceptionFilterDeviationLimit);
            if (params.exceptionFilterDeviationType !== undefined)
                setExceptionFilterDeviationType(params.exceptionFilterDeviationType);
            if (params.minResampleLimit !== undefined)
                setMinResampleLimit(params.minResampleLimit);
            if (params.maxResampleLimit !== undefined)
                setMaxResampleLimit(params.maxResampleLimit);
        }
    }, []);

    useEffect(() => {
        fetch(process.env.PUBLIC_URL + '/data_points.csv')
            .then((res) => res.text())
            .then(csv => {
                const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });

                setAllRawRows(data);

                const uniqueSources = Array.from(new Set(data.map(row => row.DataSource)))
                    .map(qn => ({ qualifiedName: qn }));

                setAvailableSources(uniqueSources);
            })
            .catch(err => {
                console.error("Failed to parse data_points.csv", err);
            });
    }, []);

    useEffect(() => {
        if (waitingUpload && fullData.length && fullLabels.length) {
            const generatedConfig = {
                rawData: fullData,
                labels: fullLabels,
                name: file?.name || 'uploaded.csv',
                parameters: ref?.current?.getParams?.()
            };
            if (typeof onUploadComplete === 'function') {
                onUploadComplete(generatedConfig);
            }
            setWaitingUpload(false);
        }
    }, [waitingUpload, fullData, fullLabels, onUploadComplete, file, ref]);

    // Parameter validation function
    const validateParameter = (value, paramName) => {
        if (value === '') return true;
        const numValue = Number(value);
        if (isNaN(numValue)) return false;
        const range = VALIDATION_RANGES[paramName];
        return numValue >= range.min && numValue <= range.max;
    };

    // Get validation error message
    const getValidationMessage = (paramName) => {
        const range = VALIDATION_RANGES[paramName];
        return `${paramName} must be between ${range.min} and ${range.max}`;
    };

    // Parameter change handlers with validation
    const handleCompressionDeviationLimitChange = (e) => {
        const value = e.target.value;
        if (validateParameter(value, 'compressionDeviationLimit') || value === '') {
            setCompressionDeviationLimit(value);
            setError('');
        } else {
            setError(getValidationMessage('compressionDeviationLimit'));
        }
    };

    const handleExceptionFilterDeviationLimitChange = (e) => {
        const value = e.target.value;
        if (validateParameter(value, 'exceptionFilterDeviationLimit') || value === '') {
            setExceptionFilterDeviationLimit(value);
            setError('');
        } else {
            setError(getValidationMessage('exceptionFilterDeviationLimit'));
        }
    };

    const handleMinResampleLimitChange = (e) => {
        const value = e.target.value;
        if (validateParameter(value, 'minResampleLimit') || value === '') {
            setMinResampleLimit(value);
            setError('');
        } else {
            setError(getValidationMessage('minResampleLimit'));
        }
    };

    const handleMaxResampleLimitChange = (e) => {
        const value = e.target.value;
        setMaxResampleLimit(value);
        setError('');
    };

    const validateMaxResampleOnBlur = () => {
        const min = Number(minResampleLimit) || DEFAULT_VALUES.minResampleLimit;
        const max = Number(maxResampleLimit);

        if (isNaN(max) || max < min) {
            setError(`Max resample limit must be ≥ min interval ${min}`);
        } else {
            setError('');
        }
    };

    const handleCompressionDeviationTypeChange = (e) => {
        setCompressionDeviationType(e.target.value);
    };

    const handleExceptionFilterDeviationTypeChange = (e) => {
        setExceptionFilterDeviationType(e.target.value);
    };

    // Format time for display in time range selector
    const formatTime = (timeString) => {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return timeString;
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Parse CSV file
    const parseCSV = useCallback((file) => {
        setError('');
        setMessage('Processing file...');
        Papa.parse(file, {
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length > 1) {
                    const dataRows = results.data.slice(1);
                    const xValues = dataRows.map(row => row[0]);
                    const yValues = dataRows.map(row => parseFloat(row[1]));
                    if (xValues.length > 0 && yValues.length > 0) {
                        setFullLabels(xValues);
                        setFullData(yValues);
                        setAllTimes(xValues.map(formatTime));
                        setLabels(xValues);
                        setRawData(yValues);
                        setStartTime(xValues[0]);
                        setEndTime(xValues[xValues.length - 1]);
                        setMessage(`Loaded ${xValues.length} data points from ${file.name}`);
                    } else {
                        setError('CSV file format error: valid data not found');
                    }
                } else {
                    setError('CSV file is empty or formatted incorrectly');
                }
            },
            error: (err) => {
                setError(`Error parsing CSV: ${err.message}`);
            }
        });
    }, [setLabels, setRawData]);

    // Handle file selection
    const handleFileSelect = useCallback((selectedFile) => {
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('Please upload a CSV file');
                return;
            }

            setFileState(selectedFile);
            setFile(selectedFile);

            if (typeof setCompressedData === 'function') setCompressedData([]);
            if (typeof setCompressedLabels === 'function') setCompressedLabels([]);

            parseCSV(selectedFile);

            setWaitingUpload(true);
        }
    }, [
        parseCSV,
        setFile,
        setCompressedData,
        setCompressedLabels,
        setFileState,
        fullData,
        fullLabels,
        ref,
        onUploadComplete
    ]);



    // Handle file input change
    const handleFileInputChange = (e) => {
        handleFileSelect(e.target.files[0]);
    };

    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (typeof json === 'object' && json !== null) {
                    setMessage(`Loaded parameter config from ${file.name}`);
                    if (ref?.current?.setParams) {
                        ref.current.setParams(json);
                    }
                } else {
                    setError('Invalid JSON parameter format');
                }
            } catch (err) {
                setError('Failed to read JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Apply time range selection
    const applyTimeRange = () => {
        if (!file) {
            setError('No data file loaded');
            return;
        }
        if (!startTime || !endTime) {
            setError('Please select both start and end times');
            return;
        }
        const startIndex = fullLabels.indexOf(startTime);
        const endIndex = fullLabels.indexOf(endTime);
        if (startIndex === -1 || endIndex === -1) {
            setError('Selected times not found in dataset');
            return;
        }
        if (startIndex > endIndex) {
            setError('Start time must be before end time');
            return;
        }
        const filteredLabels = fullLabels.slice(startIndex, endIndex + 1);
        const filteredData = fullData.slice(startIndex, endIndex + 1);
        setLabels(filteredLabels);
        setRawData(filteredData);
        setMessage(`Showing ${filteredLabels.length} points from ${formatTime(startTime)} to ${formatTime(endTime)} (${file.name})`);
        setShowTimeRangeModal(false);
    };

    // Reset to full time range
    const resetTimeRange = () => {
        setLabels(fullLabels);
        setRawData(fullData);
        setStartTime(fullLabels[0] || '');
        setEndTime(fullLabels[fullLabels.length - 1] || '');
        setMessage(`Showing full dataset (${file.name})`);
        setShowTimeRangeModal(false);
    };

    // Handle compression with proper error checking
    const handleCompress = () => {
        if (!fullLabels.length || !fullData.length) {
            setError('Please upload a file first');
            return;
        }
        if (
            (compressionDeviationLimit && !validateParameter(compressionDeviationLimit, 'compressionDeviationLimit')) ||
            (exceptionFilterDeviationLimit && !validateParameter(exceptionFilterDeviationLimit, 'exceptionFilterDeviationLimit')) ||
            (minResampleLimit && !validateParameter(minResampleLimit, 'minResampleLimit')) ||
            (maxResampleLimit && !validateParameter(maxResampleLimit, 'maxResampleLimit'))
        ) {
            setError('Please correct invalid parameters before compressing');
            return;
        }
        setError('');
        onCompress();
    };

    // Handle parameter optimization
    const handleOptimize = () => {
        if (!fullLabels.length || !fullData.length) {
            setError('Please upload a file first');
            return;
        }
        setIsOptimizing(true);
        setError('');
        setMessage(`Optimisation complete${file?.name ? ' for ' + file.name : ''}! Parameters updated.`);
        setTimeout(() => {
            setCompressionDeviationLimit('1.5');
            setCompressionDeviationType('percentage');
            setExceptionFilterDeviationLimit('0.8');
            setExceptionFilterDeviationType('absolute');
            setMinResampleLimit('1');
            setMaxResampleLimit('8');
            setIsOptimizing(false);
            setMessage(`Optimisation complete${file?.name ? ` for ${file.name}` : ''}! Parameters updated.`);

            const optimizedParams = {
                compressionDeviationLimit: '1.5',
                compressionDeviationType: 'percentage',
                exceptionFilterDeviationLimit: '0.8',
                exceptionFilterDeviationType: 'absolute',
                minResampleLimit: '1',
                maxResampleLimit: '8'
            };
            sessionStorage.setItem('lastOptimizedParams', JSON.stringify(optimizedParams));
        }, 2000);
    };

    // Time range modal component
    const TimeRangeModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Select Time Range ({file?.name})</h3>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px' }}>Start Time:</label>
                    <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                    >
                        {allTimes.map((time, index) => (
                            <option key={`start-${index}`} value={fullLabels[index]}>{time}</option>
                        ))}
                    </select>
                    <label style={{ display: 'block', marginBottom: '10px' }}>End Time:</label>
                    <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    >
                        {allTimes.map((time, index) => (
                            <option
                                key={`end-${index}`}
                                value={fullLabels[index]}
                                disabled={startTime && fullLabels.indexOf(fullLabels[index]) < fullLabels.indexOf(startTime)}
                            >
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={resetTimeRange} style={{ padding: '10px', flex: 1, marginRight: '10px' }}>
                        Reset
                    </button>
                    <button onClick={applyTimeRange} style={{ padding: '10px', flex: 1, backgroundColor: '#4CAF50', color: 'white' }}>
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );

    // Expose methods to parent via useImperativeHandle
    useImperativeHandle(ref, () => ({
        reset: () => {
            setFileState(null);
            setFile(null);
            setCompressionDeviationLimit('');
            setCompressionDeviationType('');
            setExceptionFilterDeviationLimit('');
            setExceptionFilterDeviationType('');
            setMinResampleLimit('');
            setMaxResampleLimit('');
            setError('');
            setMessage('');
            setRawData([]);
            setLabels([]);
            setShowTimeRangeModal(false);
            setStartTime('');
            setEndTime('');
            setAllTimes([]);
            setFullData([]);
            setFullLabels([]);
            setIsOptimizing(false);
        },
        getParams: () => ({
            compressionDeviationLimit:
                compressionDeviationLimit !== '' && !isNaN(compressionDeviationLimit)
                    ? parseFloat(compressionDeviationLimit)
                    : DEFAULT_VALUES.compressionDeviationLimit,

            compressionDeviationType:
                compressionDeviationType !== '' ? compressionDeviationType : DEFAULT_VALUES.compressionDeviationType,

            exceptionFilterDeviationLimit:
                exceptionFilterDeviationLimit !== '' && !isNaN(exceptionFilterDeviationLimit)
                    ? parseFloat(exceptionFilterDeviationLimit)
                    : DEFAULT_VALUES.exceptionFilterDeviationLimit,

            exceptionFilterDeviationType:
                exceptionFilterDeviationType !== '' ? exceptionFilterDeviationType : DEFAULT_VALUES.exceptionFilterDeviationType,

            minResampleLimit:
                minResampleLimit !== '' && !isNaN(minResampleLimit)
                    ? parseFloat(minResampleLimit)
                    : DEFAULT_VALUES.minResampleLimit,

            maxResampleLimit:
                maxResampleLimit !== '' && !isNaN(maxResampleLimit)
                    ? parseFloat(maxResampleLimit)
                    : DEFAULT_VALUES.maxResampleLimit
        }),

        setParams: (params) => {
            if (params.compressionDeviationLimit !== undefined)
                setCompressionDeviationLimit(String(params.compressionDeviationLimit));
            if (params.compressionDeviationType !== undefined)
                setCompressionDeviationType(params.compressionDeviationType);
            if (params.exceptionFilterDeviationLimit !== undefined)
                setExceptionFilterDeviationLimit(String(params.exceptionFilterDeviationLimit));
            if (params.exceptionFilterDeviationType !== undefined)
                setExceptionFilterDeviationType(params.exceptionFilterDeviationType);
            if (params.minResampleLimit !== undefined)
                setMinResampleLimit(String(params.minResampleLimit));
            if (params.maxResampleLimit !== undefined)
                setMaxResampleLimit(String(params.maxResampleLimit));
        },
        loadFile: (file) => {
            setFileState(file);
            setFile(file);
            parseCSV(file);
        },
        loadFromCloud: (labels, data, name = 'cloud.csv', compressedData = [], compressedLabels = []) => {
            setFullLabels(labels);
            setFullData(data);
            setLabels(labels);
            setRawData(data);

            if (typeof setCompressedData === 'function') setCompressedData(compressedData);
            if (typeof setCompressedLabels === 'function') setCompressedLabels(compressedLabels);

            setStartTime(labels[0] || '');
            setEndTime(labels[labels.length - 1] || '');
            setAllTimes(labels.map(formatTime));

            const fakeFile = new File([""], name, { type: "text/csv" });
            setFileState(fakeFile);
            setFile(fakeFile);
        },
    }));

    // Style definitions
    const cardStyle = {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
    };

    const sectionTitle = {
        color: '#333',
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    };

    const rowStyle = {
        display: 'flex',
        gap: '30px',
        marginBottom: '20px'
    };

    const columnStyle = {
        flex: 1
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#555',
        fontSize: '14px'
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
        transition: 'border-color 0.3s',
        fontWeight: 530,
    };

    const selectStyle = {
        ...inputStyle,
        backgroundColor: 'white'
    };

    const hintStyle = {
        display: 'block',
        fontSize: '12px',
        color: '#666',
        marginTop: '4px',
    };

    const descStyle = {
        display: 'block',
        fontSize: '13px',
        color: '#666',
        marginTop: '8px',
    };

    const fileInfoStyle = {
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #dee2e6',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const handleDownloadConfig = () => {
        const config = {
            compressionDeviationLimit,
            compressionDeviationType,
            exceptionFilterDeviationLimit,
            exceptionFilterDeviationType,
            minResampleLimit,
            maxResampleLimit,
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'parameters.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };


    // Render UI
    return (
        <div style={{
            padding: '30px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #ccc',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '80px',
            width: '95%',
            maxWidth: '100%',
        }}>
            {/* Data Source Section */}
            <div style={{
                width: '100%',
                maxWidth: '600px',
                padding: '0 16px',
                margin: '0 auto 30px auto',
                boxSizing: 'border-box'
            }}>

            <h2 style={{
                    color: '#333',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #eee',
                    paddingLeft: '12px'
                }}>
                    Data Source
                </h2>

                {/* Upload area with drag and drop support */}
                <div
                    style={{
                        width: '88%',
                        backgroundColor: isDragging ? '#f0faff' : '#e9f5ff',
                        border: `2px dashed ${isDragging ? '#4CAF50' : '#66a6ff'}`,
                        borderRadius: '20px',
                        padding: '30px 20px',
                        maxWidth: '285px',
                        textAlign: 'center',
                        fontFamily: 'Arial, sans-serif',
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                    }}
                    onClick={() => document.getElementById("csv-upload").click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div style={{
                        fontSize: '42px',
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        margin: '0 auto 16px'
                    }}>
                        +
                    </div>
                    <p style={{ fontSize: '16px', color: '#333', margin: 0 }}>
                        {isDragging ? 'Drop your CSV file here' : 'Upload or drag & drop your CSV file'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#777', marginTop: '6px' }}>
                        Only CSV files are supported
                    </p>

                    {/* Hidden file input */}
                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />

                    {/* File info display */}
                    {file && (
                        <div style={fileInfoStyle}>
                            <span>Loaded file: <strong>{file.name}</strong></span>
                        </div>
                    )}

                    {/* Time range selection button */}
                    <div style={{ marginTop: '20px' }}>
                        <button
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#42A5F5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '15px',
                                letterSpacing: '0.3px',
                                fontFamily: 'Segoe UI, sans-serif',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease-in-out',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}

                            onClick={(e) => {
                                e.stopPropagation();
                                if (!file) {
                                    setError('Please upload a CSV file first');
                                    return;
                                }
                                if (allTimes.length === 0) {
                                    setError('No valid time data available');
                                    return;
                                }
                                setShowTimeRangeModal(true);
                            }}
                        >
                            Select Time Range
                        </button>
                    </div>

                </div>
                {/* cloud upload */}
                <div style={{
                    marginTop: '-24px',
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'center',
                    position: 'relative',
                    marginLeft:'15px',
                    zIndex: 10
                }}>
                    <button
                        title="View Cloud Data Table"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDataSourcesModal(true);
                        }}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: '#2196F3',
                            border: '3px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span style={{ fontSize: '40px', color: 'white' }}>☁️</span>
                    </button>
                </div>

            </div>

            <div style={{
                width: '90%', marginBottom: '20px', padding: '0 20px'
            }}>

            {/* Parameter configuration section */}
            <div style={{ width: '100%', marginBottom: '20px', padding: '0 0px' }}>
                <div style={{ padding: '0px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #eee',
                        paddingLeft: '12px',
                        paddingRight: '12px'
                    }}>
                        <h2 style={{
                            color: '#333',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            margin: 0
                        }}>
                            Compression Parameters
                        </h2>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => document.getElementById('json-param-upload').click()}
                                style={{
                                    padding: '6px 14px',
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    border: '1px solid #90caf9',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#bbdefb';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                                }}
                            >
                                🗂️ Import Config
                            </button>
                            <button
                                onClick={handleDownloadConfig}
                                style={{
                                    padding: '6px 14px',
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    border: '1px solid #90caf9',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
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

                            <input
                                id="json-param-upload"
                                type="file"
                                accept=".json"
                                onChange={handleJsonUpload}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Compression Parameters */}
                    <div style={cardStyle}>
                        <h3 style={sectionTitle}>Compression Data</h3>
                        <div style={rowStyle}>
                            <div style={columnStyle}>
                                <label style={labelStyle}>Compression Deviation Limit:</label>
                                <input
                                    type="number"
                                    min={VALIDATION_RANGES.compressionDeviationLimit.min}
                                    max={VALIDATION_RANGES.compressionDeviationLimit.max}
                                    step={VALIDATION_RANGES.compressionDeviationLimit.step}
                                    value={compressionDeviationLimit}
                                    onChange={handleCompressionDeviationLimitChange}
                                    placeholder={DEFAULT_VALUES.compressionDeviationLimit.toString()}
                                    style={{ ...inputStyle, borderColor: error.includes('compressionDeviationLimit') ? 'red' : '#ccc' }}
                                />
                                <span style={hintStyle}>
                                    Range: {VALIDATION_RANGES.compressionDeviationLimit.min}-{VALIDATION_RANGES.compressionDeviationLimit.max}
                                </span>
                                <span style={descStyle}>Maximum allowed deviation (default: 2)</span>
                            </div>
                            <div style={columnStyle}>
                                <label style={labelStyle}>Deviation Type:</label>
                                <select
                                    value={compressionDeviationType}
                                    onChange={handleCompressionDeviationTypeChange}
                                    style={selectStyle}
                                >
                                    <option value="">Select type</option>
                                    <option value="percentage">Percentage</option>
                                    <option value="absolute">Absolute</option>
                                </select>
                                <span style={descStyle}>Type of deviation (default: percentage)</span>
                            </div>
                        </div>
                    </div>

                    {/* Exception Filter */}
                    <div style={cardStyle}>
                        <h3 style={sectionTitle}>Exception Filter</h3>
                        <div style={rowStyle}>
                            <div style={columnStyle}>
                                <label style={labelStyle}>Exception Filter Limit:</label>
                                <input
                                    type="number"
                                    min={VALIDATION_RANGES.exceptionFilterDeviationLimit.min}
                                    max={VALIDATION_RANGES.exceptionFilterDeviationLimit.max}
                                    step={VALIDATION_RANGES.exceptionFilterDeviationLimit.step}
                                    value={exceptionFilterDeviationLimit}
                                    onChange={handleExceptionFilterDeviationLimitChange}
                                    placeholder={DEFAULT_VALUES.exceptionFilterDeviationLimit.toString()}
                                    style={{ ...inputStyle, borderColor: error.includes('exceptionFilterDeviationLimit') ? 'red' : '#ccc' }}
                                />
                                <span style={hintStyle}>
                                    Range: {VALIDATION_RANGES.exceptionFilterDeviationLimit.min}-{VALIDATION_RANGES.exceptionFilterDeviationLimit.max}
                                </span>
                                <span style={descStyle}>Threshold for anomaly filtering (default: 1)</span>
                            </div>
                            <div style={columnStyle}>
                                <label style={labelStyle}>Deviation Type:</label>
                                <select
                                    value={exceptionFilterDeviationType}
                                    onChange={handleExceptionFilterDeviationTypeChange}
                                    style={selectStyle}
                                >
                                    <option value="">Select type</option>
                                    <option value="percentage">Percentage</option>
                                    <option value="absolute">Absolute</option>
                                </select>
                                <span style={descStyle}>Type of deviation (default: absolute)</span>
                            </div>
                        </div>
                    </div>

                    {/* Resampling Parameters */}
                    <div style={cardStyle}>
                        <h3 style={sectionTitle}>Resampling Parameters</h3>
                        <div style={rowStyle}>
                            <div style={columnStyle}>
                                <label style={labelStyle}>Min Resample Interval (s):</label>
                                <input
                                    type="number"
                                    min={VALIDATION_RANGES.minResampleLimit.min}
                                    max={VALIDATION_RANGES.minResampleLimit.max}
                                    step={VALIDATION_RANGES.minResampleLimit.step}
                                    value={minResampleLimit}
                                    onChange={handleMinResampleLimitChange}
                                    placeholder={DEFAULT_VALUES.minResampleLimit.toString()}
                                    style={{ ...inputStyle, borderColor: error.includes('minResampleLimit') ? 'red' : '#ccc' }}
                                />
                                <span style={hintStyle}>
                                    Range: {VALIDATION_RANGES.minResampleLimit.min}-{VALIDATION_RANGES.minResampleLimit.max} {VALIDATION_RANGES.minResampleLimit.unit}
                                </span>
                                <span style={descStyle}>Minimum time between samples (default: 0)</span>
                            </div>
                            <div style={columnStyle}>
                                <label style={labelStyle}>Max Resample Interval (s):</label>
                                <input
                                    type="number"
                                    min={minResampleLimit || DEFAULT_VALUES.minResampleLimit}
                                    max={VALIDATION_RANGES.maxResampleLimit.max}
                                    step={VALIDATION_RANGES.maxResampleLimit.step}
                                    value={maxResampleLimit}
                                    onChange={handleMaxResampleLimitChange}
                                    placeholder={DEFAULT_VALUES.maxResampleLimit.toString()}
                                    style={{ ...inputStyle, borderColor: error.includes('maxResampleLimit') ? 'red' : '#ccc' }}
                                />
                                <span style={hintStyle}>
                                    Range: {VALIDATION_RANGES.maxResampleLimit.min}-{VALIDATION_RANGES.maxResampleLimit.max} {VALIDATION_RANGES.maxResampleLimit.unit}
                                </span>
                                <span style={descStyle}>Maximum time between samples (default: 5)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

                {/* Status messages */}
                {(error || message) && (
                    <div style={{
                        width: '100%',
                        marginTop: '-15px',
                        marginBottom: '0px',
                        textAlign: 'center'
                    }}>
                        {error && (
                            <div style={{
                                padding: '10px',
                                borderRadius: '6px',
                                backgroundColor: '#ffebee',
                                color: '#d32f2f',
                                border: '1px solid #ef9a9a',
                                fontSize: '14px',
                                marginBottom: '0px'
                            }}>
                                {error}
                            </div>
                        )}
                        {message && (
                            <div style={{
                                padding: '15px',
                                borderRadius: '6px',
                                backgroundColor: '#e8f5e9',
                                color: '#2e7d32',
                                border: '1px solid #a5d6a7',
                                fontSize: '14px'
                            }}>
                                {message}
                            </div>
                        )}
                    </div>
                )}


            {/* Action buttons */}
            <div style={{
                width: '95%',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                marginTop: '10px',
                marginBottom: '20px'
            }}>
                <button
                    style={{
                        padding: '14px 28px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '17px',
                        fontWeight: '600',
                        cursor: isOptimizing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: isOptimizing ? 0.7 : 1
                    }}
                    onClick={handleCompress}
                    disabled={isOptimizing}
                >
                    Compress
                </button>

                <button
                    style={{
                        padding: '14px 28px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '17px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        opacity: isOptimizing ? 0.7 : 1
                    }}
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                >
                    {isOptimizing ? 'Optimising...' : 'Optimise'}
                </button>
            </div>

            {/* Time range selection modal */}
            {showTimeRangeModal && <TimeRangeModal />}
            {showCloudModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '24px',
                        borderRadius: '10px',
                        width: '90%',
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}> Cloud Data Table</h3>
                            <button
                                onClick={() => setShowCloudModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    color: '#999'
                                }}
                            >
                                ✖
                            </button>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <DataTable selectedSource={selectedSource} />
                        </div>
                    </div>
                </div>
            )}

                {showDataSourcesModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 2000
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '24px',
                            borderRadius: '10px',
                            width: '90%',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}> Select Data from Cloud </h3>
                                <button
                                    onClick={() => setShowDataSourcesModal(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        color: '#999'
                                    }}
                                >
                                    ✖
                                </button>
                            </div>

                            <div>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
                                    <tbody>
                                    {availableSources.map((s, i) => {
                                        const shortName = s.qualifiedName.split(".").slice(-1)[0];
                                        return (
                                            <tr key={i}>
                                                <td
                                                    onClick={() => {
                                                        const filtered = allRawRows.filter(row => row.DataSource === s.qualifiedName);
                                                        const labels = filtered.map(row => row.UtcSampleTime);
                                                        const raw = filtered.map(row => parseFloat(row.NumericValue));

                                                        setLabels(labels);
                                                        setRawData(raw);
                                                        setFullLabels(labels);
                                                        setFullData(raw);
                                                        setAllTimes(labels.map(formatTime));
                                                        setStartTime(labels[0]);
                                                        setEndTime(labels[labels.length - 1]);

                                                        if (typeof setCompressedData === 'function') setCompressedData([]);
                                                        if (typeof setCompressedLabels === 'function') setCompressedLabels([]);

                                                        const fakeFile = new File([""], "cloud.csv", { type: "text/csv" });
                                                        setFileState(fakeFile);
                                                        setFile(fakeFile);
                                                        setError('');

                                                        const shortName = s.qualifiedName.split('.').slice(-1)[0];
                                                        setMessage(`Loaded from ${shortName}`);

                                                        setChartVisible(true);
                                                        setSelectedSource(s.qualifiedName);
                                                        setShowCloudModal(true);
                                                        setShowDataSourcesModal(false);
                                                    }}

                                                    style={{
                                                        padding: "14px 18px",
                                                        borderTop: "1px solid #eee",
                                                        borderBottom: "1px solid #eee",
                                                        cursor: "pointer",
                                                        color: "#0d47a1",
                                                        fontWeight: 500,
                                                        fontSize: "18px",
                                                        transition: "all 0.2s ease",
                                                        backgroundColor: "transparent"
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f0f8ff"}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                                                >
                                                    {shortName}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>


                            </div>


                </div>
            </div>
            )}
            </div>
        </div>
    );
});

ConfigPanel.propTypes = {
    setRawData: PropTypes.func.isRequired,
    setLabels: PropTypes.func.isRequired,
    setFile: PropTypes.func.isRequired,
    onCompress: PropTypes.func.isRequired
};

export default ConfigPanel;