import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { format, isToday, isYesterday, isValid } from "date-fns";
import { TableClient, AzureSASCredential } from "@azure/data-tables";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const accountName = "team6ipstorageaccount";
const sasToken = "?sv=2017-07-29&ss=t&srt=so&sp=rwdlacu&se=2026-01-01T00:00:00Z&st=2025-01-01T00:00:00Z&spr=https&sig=wK7MJiU907XljD3qFOQ0H4KJOL9pYYL8CteWYq5Rhfc%3D";
const tableClient = new TableClient(
    `https://${accountName}.table.core.windows.net`,
    "ipconfigurations",
    new AzureSASCredential(sasToken)
);

const groupByDate = (configs) => {
  return configs.reduce((acc, config) => {
    const date = new Date(config.date);
    if (!isValid(date)) {
      console.warn(`Invalid date for config: ${config.name}`, config.date);
      return acc;
    }
    let label = format(date, "yyyy-MM-dd");
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";
    acc[label] = acc[label] || [];
    acc[label].push(config);
    return acc;
  }, {});
};

const CompressionSidebarPanel = ({
                                   configurations = [],
                                   setConfigurations,
                                   onNewConfig,
                                   isOpen,
                                   toggleSidebar,
                                   onLoadConfig,
                                   compressedData,
                                 }) => {
  const [searchInput, setSearchInput] = useState("");
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [editedConfig, setEditedConfig] = useState(null);
  const [selectedParameters, setSelectedParameters] = useState({});
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const menuRef = useRef(null);
  const [forceMenuUp, setForceMenuUp] = useState(false);

  const startResizing = useCallback((e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = startWidthRef.current + e.clientX - startXRef.current;
      setSidebarWidth(Math.max(150, Math.min(newWidth, 500)));
    }
  }, [isResizing]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const getDisplayName = (key) => {
    const mapping = {
      compressionDeviationLimit: "Compression Deviation Threshold",
      compressionDeviationType: "Compression Deviation Type",
      exceptionFilterDeviationLimit: "Outlier Detection Threshold",
      exceptionFilterDeviationType: "Outlier Deviation Type",
      minResampleLimit: "Minimum Resample Length",
      maxResampleLimit: "Maximum Resample Length",
    };
    return mapping[key] || key;
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const filteredConfigurations = useMemo(() =>
          groupByDate(
              configurations.filter((config) =>
                  config.name.toLowerCase().includes(searchInput.toLowerCase())
              )
          ),
      [configurations, searchInput]
  );

  const handleDelete = useCallback(async (configId) => {
    try {
      await tableClient.deleteEntity("configurations", configId);
      setConfigurations((prevConfigs) =>
          prevConfigs.filter((config) => config.id !== configId)
      );
      alert("Configuration deleted successfully!");
    } catch (error) {
      console.error("Error deleting configuration:", error);
      alert(`Failed to delete configuration: ${error.message}`);
    }
  }, [setConfigurations]);

  const handleDownload = (config) => {
    setSelectedConfig(config);
    setDownloadModalOpen(true);
  };

  const handleParameterSelection = (paramName, isChecked) => {
    setSelectedParameters((prev) => ({
      ...prev,
      [paramName]: isChecked,
    }));
  };

  const handleConfirmDownload = async () => {
    if (!selectedConfig) return;

    try {
      const fullEntity = await tableClient.getEntity("configurations", selectedConfig.id);

      const zip = new JSZip();

      const compressedValues = (fullEntity.compressedData || "").split("\n");
      let compressedLabels = [];

      try {
        compressedLabels = JSON.parse(fullEntity.compressedLabels || "[]");
      } catch (e) {
        console.warn("Invalid compressedLabels JSON", e);
      }

      const csvLines = ["Timestamp,Value"];
      for (let i = 0; i < compressedValues.length; i++) {
        const label = compressedLabels[i] ?? "";
        const value = compressedValues[i];
        csvLines.push(`${label},${value}`);
      }

      const csvBlob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8" });
      zip.file("compressed-data.csv", csvBlob);


      const selectedParamKeys = Object.keys(selectedParameters).filter(
          (key) => selectedParameters[key]
      );

      const paramsToDownload = {};
      selectedParamKeys.forEach((key) => {
        paramsToDownload[key] = selectedConfig.parameters[key];
      });

      const paramsBlob = new Blob(
          [JSON.stringify(paramsToDownload, null, 2)],
          { type: "application/json" }
      );
      zip.file("parameters.json", paramsBlob);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${selectedConfig.name}-download.zip`);
      setDownloadModalOpen(false);
      alert("Download started!");

    } catch (err) {
      console.error("Failed to download config:", err);
      alert("Failed to fetch original compressed data from Azure.");
    }
  };

  const handleCancelDownload = () => {
    setDownloadModalOpen(false);
  };

  const handleEdit = (config) => {
    let p = {};
    try {
      p = typeof config.parameters === 'string' ? JSON.parse(config.parameters) : config.parameters;
    } catch (e) {
      console.error("Failed to parse config.parameters", e);
      p = {};
    }

    setSelectedConfig(config);
    setEditedConfig({
      ...config,
      parameters: {
        compressionDeviationLimit: parseFloat(p.compressionDeviationLimit ?? 2),
        compressionDeviationType: p.compressionDeviationType ?? "percentage",
        exceptionFilterDeviationLimit: parseFloat(p.exceptionFilterDeviationLimit ?? 1),
        exceptionFilterDeviationType: p.exceptionFilterDeviationType ?? "absolute",
        minResampleLimit: parseFloat(p.minResampleLimit ?? 0),
        maxResampleLimit: parseFloat(p.maxResampleLimit ?? 5),
      },
    });
    setModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const newRowKey = `${Date.now()}`;
      const entity = {
        partitionKey: "configurations",
        rowKey: newRowKey,
        name: String(editedConfig.name || `Configuration ${newRowKey}`),
        date: new Date().toISOString(),
        parameters: JSON.stringify(editedConfig.parameters || {}),
        rawData: selectedConfig.rawData?.join("\n") || "",
        labels: JSON.stringify(selectedConfig.labels || []),
        compressedData: selectedConfig.compressedData?.join("\n") || "",
        compressedLabels: JSON.stringify(selectedConfig.compressedLabels || []),
      };

      await tableClient.createEntity(entity);

      const newConfig = {
        id: newRowKey,
        name: entity.name,
        date: entity.date,
        parameters: editedConfig.parameters,
        rawData: selectedConfig.rawData || [],
        labels: selectedConfig.labels || [],
        compressedData: selectedConfig.compressedData || [],
        compressedLabels: selectedConfig.compressedLabels || [],
      };

      await tableClient.deleteEntity("configurations", selectedConfig.id);

      setConfigurations((prev) =>
          [...prev.filter(cfg => cfg.id !== selectedConfig.id), newConfig]
      );

      setModalOpen(false);
      alert("Configuration renamed and saved!");
    } catch (error) {
      console.error("Failed to save configuration:", error);
      alert("Failed to save as new configuration.");
    }
  };

  const handleCancelEdit = () => {
    setModalOpen(false);
  };

  const handleNameChange = (e) => {
    setEditedConfig((prevConfig) => ({
      ...prevConfig,
      name: e.target.value,
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isMenuButton = event.target.closest('button[data-action]');
      const isMenu = event.target.closest('.menu');

      if (!isMenu && !isMenuButton) {
        setActiveMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
      <div>
        {/* Sidebar toggle button */}
        {!isOpen && (
            <button
                onClick={toggleSidebar}
                title="Open Sidebar"
                style={{
                  position: "fixed",
                  top: "20px",
                  left: "20px",
                  zIndex: 1000,
                  background: "transparent",
                  border: "none",
                  fontSize: "26px",
                  cursor: "pointer",
                  color: "#ccc"
                }}
            >
              ☰
            </button>
        )}

        {/* Sidebar content */}
        <div
            ref={sidebarRef}
            className={`sidebar ${isOpen ? "expanded" : "collapsed"}`}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              height: "100vh",
              width: isOpen ? `${sidebarWidth}px` : "0",
              transition: isResizing ? "none" : "width 0.3s",
              overflowY: "auto",
              overflowX: "hidden",
              background: "#1f1f1f",
              padding: isOpen ? "10px" : "0",
              zIndex: 999,
              color: "#f0f0f0",
              boxShadow: "2px 0 5px rgba(0, 0, 0, 0.5)",
            }}
        >

          {isOpen && (
              <>
                <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "8px",
                      cursor: "col-resize",
                      backgroundColor: isResizing ? "rgba(0, 123, 255, 0.5)" : "transparent",
                      zIndex: 1000,
                    }}
                    onMouseDown={startResizing}
                />

                {/* Close button */}
                <button
                    onClick={toggleSidebar}
                    title="Close Sidebar"
                    style={{
                      position: "absolute",
                      right: 16,
                      top: 5,
                      background: "transparent",
                      border: "none",
                      fontSize: "28px",
                      cursor: "pointer",
                      color: "#ccc"
                    }}
                >
                  ☰
                </button>

                {/* Search bar */}
                <div className="search-bar" style={{ marginBottom: "15px" }}>
                  <input
                      type="text"
                      placeholder="Search configurations"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      style={{
                        width: "calc(100% - 60px)",
                        padding: "6px",
                        fontSize: "14px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        background: "#f0f0f0",
                        color: "#333",
                      }}
                  />
                </div>

                {/* New configuration button */}
                <button
                    onClick={onNewConfig}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      marginBottom: "15px",
                      padding: "5px",
                      width: "100%",
                      textAlign: "left",
                      color: "#f0f0f0",
                      transition: "background 0.2s",
                    }}
                >
                  <img
                      src="/icons/new-config.png"
                      alt="New Config"
                      style={{ width: "30px", height: "30px", marginRight: "10px" }}
                  />
                  <span>Start New Configuration</span>
                </button>

                {/* Configuration list */}
                {Object.keys(filteredConfigurations).length > 0 ? (
                    <div>
                      {Object.entries(filteredConfigurations).map(([dateLabel, configs]) => (
                          <div key={dateLabel}>
                            <h4 style={{ marginTop: "10px", fontWeight: "bold", fontSize: "16px", color: "#f0f0f0" }}>
                              {dateLabel}
                            </h4>
                            <ul style={{ paddingLeft: "10px", listStyle: "none" }}>
                              {configs.map((config, index) => (
                                  <li
                                      key={config.id}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "5px 0",
                                        color: "#f0f0f0",
                                      }}
                                  >
                          <span onClick={() => onLoadConfig(config)} style={{ cursor: "pointer" }}>
                            {config.name}
                          </span>
                                    <div style={{ position: "relative" }} ref={menuRef}>
                                      <button
                                          onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const menuHeight = 180;
                                            const spaceBelow = window.innerHeight - rect.bottom;

                                            setForceMenuUp(spaceBelow < menuHeight);
                                            setActiveMenuIndex(activeMenuIndex === config.id ? null : config.id);
                                          }}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "#f0f0f0",
                                            fontSize: "16px",
                                            padding: "0 5px",
                                          }}
                                      >
                                        ...
                                      </button>
                                      {activeMenuIndex === config.id && (
                                          <div
                                              className="menu"
                                              style={{
                                                position: "absolute",
                                                right: "0",
                                                top: forceMenuUp ? "auto" : "100%",
                                                bottom: forceMenuUp ? "100%" : "auto",
                                                background: "#ffffff",
                                                border: "1px solid #ddd",
                                                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                                                padding: "5px",
                                                display: "flex",
                                                flexDirection: "column",
                                                zIndex: 1000,
                                                borderRadius: "4px",
                                                minWidth: "120px",
                                              }}
                                          >
                                            <button
                                                data-action="edit"
                                                onClick={() => handleEdit(config)}
                                                style={{
                                                  background: "#ffffff",
                                                  border: "none",
                                                  cursor: "pointer",
                                                  color: "#333",
                                                  padding: "8px 12px",
                                                  textAlign: "left",
                                                  borderRadius: "4px",
                                                  marginBottom: "4px",
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}
                                                onMouseOver={(e) => (e.target.style.background = "#f0f0f0")}
                                                onMouseOut={(e) => (e.target.style.background = "#ffffff")}
                                            >
                                              <img
                                                  src="/icons/edit.png"
                                                  alt="Edit"
                                                  style={{ width: "16px", height: "16px", marginRight: "8px" }}
                                              />
                                              Rename
                                            </button>
                                            <button
                                                data-action="download"
                                                onClick={() => handleDownload(config)}
                                                style={{
                                                  background: "#ffffff",
                                                  border: "none",
                                                  cursor: "pointer",
                                                  color: "#333",
                                                  padding: "8px 12px",
                                                  textAlign: "left",
                                                  borderRadius: "4px",
                                                  marginBottom: "4px",
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}
                                                onMouseOver={(e) => (e.target.style.background = "#f0f0f0")}
                                                onMouseOut={(e) => (e.target.style.background = "#ffffff")}
                                            >
                                              <img
                                                  src="/icons/download.png"
                                                  alt="Download"
                                                  style={{ width: "16px", height: "16px", marginRight: "8px" }}
                                              />
                                              Download
                                            </button>
                                            <button
                                                data-action="delete"
                                                onClick={() => handleDelete(config.id)}
                                                style={{
                                                  background: "#ffffff",
                                                  border: "none",
                                                  cursor: "pointer",
                                                  color: "#333",
                                                  padding: "8px 12px",
                                                  textAlign: "left",
                                                  borderRadius: "4px",
                                                  marginBottom: "4px",
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}
                                                onMouseOver={(e) => (e.target.style.background = "#f0f0f0")}
                                                onMouseOut={(e) => (e.target.style.background = "#ffffff")}
                                            >
                                              <img
                                                  src="/icons/delete.png"
                                                  alt="Delete"
                                                  style={{ width: "16px", height: "16px", marginRight: "8px" }}
                                              />
                                              Delete
                                            </button>
                                            <button
                                                data-action="load"
                                                onClick={() => onLoadConfig(config)}
                                                style={{
                                                  background: "#ffffff",
                                                  border: "none",
                                                  cursor: "pointer",
                                                  color: "#333",
                                                  padding: "8px 12px",
                                                  textAlign: "left",
                                                  borderRadius: "4px",
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}
                                                onMouseOver={(e) => (e.target.style.background = "#f0f0f0")}
                                                onMouseOut={(e) => (e.target.style.background = "#ffffff")}
                                            >
                                              <img
                                                  src="/icons/load.png"
                                                  alt="Load"
                                                  style={{ width: "16px", height: "16px", marginRight: "8px" }}
                                              />
                                              Load
                                            </button>
                                          </div>
                                      )}
                                    </div>
                                  </li>
                              ))}
                            </ul>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div style={{ color: "gray", fontStyle: "italic" }}>No configurations available</div>
                )}
              </>
          )}
        </div>

        {/* Resizing overlay */}
        {isResizing && (
            <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                  cursor: "col-resize",
                }}
            />
        )}

        {/* Edit modal */}
        {isModalOpen && selectedConfig && (
            <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}
                onClick={handleCancelEdit}
            >
              <div
                  style={{
                    background: "#ffffff",
                    padding: "24px",
                    borderRadius: "14px",
                    width: "480px",
                    maxHeight: "80vh",
                    boxShadow: "0px 12px 40px rgba(0, 0, 0, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    position: "relative",
                  }}
                  onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                    onClick={handleCancelEdit}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "transparent",
                      border: "none",
                      fontSize: "20px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                >
                  ✕
                </button>

                <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "4px" }}>
                  Rename Configuration
                </h2>

                <div>
                  <label
                      style={{
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "15px",
                        color: "#222",
                      }}
                  >
                    Configuration Name
                  </label>
                  <input
                      type="text"
                      value={editedConfig.name}
                      onChange={handleNameChange}
                      placeholder="Enter a new name for this configuration"
                      style={{
                        width: "90%",
                        padding: "12px 14px",
                        border: "2px solid #e0e0e0",
                        borderRadius: "8px",
                        fontSize: "15px",
                        fontWeight: "500",
                        backgroundColor: "#fdfdfd",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        outline: "none",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#007bff";
                        e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.15)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e0e0e0";
                        e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                      }}
                  />
                </div>


                <div style={{ fontSize: "14px", color: "#666" }}>
                  <strong>Date:</strong> {format(new Date(selectedConfig.date), "yyyy-MM-dd HH:mm")}
                </div>

                <div>
                  <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>
                    Parameters
                  </label>
                  <div
                      style={{
                        background: "#f9f9f9",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        padding: "14px 18px",
                        fontSize: "15px",
                        lineHeight: "1.8",
                        maxHeight: "240px",
                        overflowY: "auto",
                        fontFamily: "Menlo, Consolas, monospace",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                  >
                    {editedConfig.parameters &&
                        Object.entries(editedConfig.parameters).map(([key, value]) => (
                            <div
                                key={key}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  borderBottom: "1px dashed #ddd",
                                  paddingBottom: "4px",
                                }}
                            >
                              <span style={{ fontWeight: "600", color: "#333" }}>{getDisplayName(key)}</span>
                              <span style={{ color: "#007bff" }}>{String(value)}</span>
                            </div>
                        ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                      onClick={handleSaveEdit}
                      style={{
                        background: "#007bff",
                        color: "#fff",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontSize: "15px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "background 0.3s",
                      }}
                      onMouseOver={(e) => (e.target.style.background = "#0056b3")}
                      onMouseOut={(e) => (e.target.style.background = "#007bff")}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Download modal */}
        {isDownloadModalOpen && selectedConfig && (
            <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}
                onClick={handleCancelDownload}
            >
              <div
                  style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "8px",
                    width: "400px",
                    maxHeight: "80vh",
                    boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                  onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                    onClick={handleCancelDownload}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "10px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                >
                  <img src="/icons/cancel.png" alt="Close" style={{ width: "24px", height: "24px" }} />
                </button>

                <h3>Download Configuration</h3>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  <p style={{ marginBottom: "10px", fontWeight: "500" }}>
                    Select parameters to include in the download:
                  </p>
                  <button
                      onClick={() => {
                        const allSelected = {};
                        Object.keys(selectedConfig?.parameters || {}).forEach(key => {
                          allSelected[key] = true;
                        });
                        setSelectedParameters(allSelected);
                      }}
                      style={{
                        marginBottom: "12px",
                        padding: "6px 10px",
                        fontSize: "14px",
                        backgroundColor: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                  >
                    Select All
                  </button>

                  {Object.keys(selectedConfig?.parameters || {}).map((param) => (
                      <div key={param} style={{ marginBottom: "10px" }}>
                        <label style={{ fontSize: "14px", color: "#333" }}>
                          <input
                              type="checkbox"
                              checked={selectedParameters[param] || false}
                              onChange={(e) => handleParameterSelection(param, e.target.checked)}
                              style={{ marginRight: "8px" }}
                          />
                          {getDisplayName ? getDisplayName(param) : param}
                        </label>
                      </div>
                  ))}
                </div>

                {/* Confirm button */}
                <div style={{ marginTop: "10px", textAlign: "left" }}>
                  <button
                      onClick={handleConfirmDownload}
                      style={{
                        background: "#007BFF",
                        color: "white",
                        border: "none",
                        padding: "10px 15px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "bold",
                        transition: "background 0.3s ease",
                      }}
                      onMouseOver={(e) => (e.target.style.background = "#0056b3")}
                      onMouseOut={(e) => (e.target.style.background = "#007BFF")}
                  >
                    Confirm Download
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

CompressionSidebarPanel.propTypes = {
  configurations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        parameters: PropTypes.object.isRequired,
      })
  ).isRequired,
  setConfigurations: PropTypes.func.isRequired,
  onNewConfig: PropTypes.func,
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  onLoadConfig: PropTypes.func.isRequired,
  compressedData: PropTypes.arrayOf(PropTypes.number),
};

export default CompressionSidebarPanel;