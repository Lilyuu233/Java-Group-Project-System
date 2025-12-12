import React, { useState, useRef, useEffect, useMemo  } from "react";
import ConfigPanel from "./components/desktop/ConfigPanel";
import MetricsTable from "./components/desktop/CompressionMatrixTable";
import CompressionSidebarPanel from "./components/desktop/CompressionSidebarPanel";
import ZoomableChart from "./components/desktop/Chart";
import { TableClient, AzureSASCredential } from "@azure/data-tables";

function App() {
    const [rawData, setRawData] = useState([]);
    const [labels, setLabels] = useState([]);
    const [compressedData, setCompressedData] = useState([]);
    const [compressedLabels, setCompressedLabels] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [configurations, setConfigurations] = useState([]);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const configPanelRef = useRef(null);
    const [setEditedConfig] = useState(null);
    const lastParamsRef = useRef(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);

    const sasToken = "?sv=2017-07-29&ss=t&srt=so&sp=rwdlacu&se=2026-01-01T00:00:00Z&st=2025-01-01T00:00:00Z&spr=https&sig=wK7MJiU907XljD3qFOQ0H4KJOL9pYYL8CteWYq5Rhfc%3D";
    const accountName = "team6ipstorageaccount";
    const tableClient = new TableClient(
        `https://${accountName}.table.core.windows.net`,
        "ipconfigurations",
        new AzureSASCredential(sasToken)
    );

    const FUNCTION_URL = "https://ip-team6-compression-function.azurewebsites.net/api/compressdata";
    const FUNCTION_KEY = "cY1UQbInfG8J47x6HpICBc_rrCFwSNen_geoVqVGgZAEAzFuv_plDw==";

    const parseTimestamp = (timestamp, index = 0) => {
        if (!timestamp || typeof timestamp !== "string") {
            console.warn("Invalid timestamp (not a string):", timestamp);
            return null;
        }

        if (timestamp.includes("T") && timestamp.endsWith("Z")) {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                console.warn("Invalid ISO 8601 timestamp:", timestamp);
                return null;
            }
            return date;
        }

        const timeMatch = timestamp.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/i);
        if (timeMatch) {
            const [, hours, minutes, period] = timeMatch;
            let hour = parseInt(hours, 10);
            const minute = parseInt(minutes, 10);

            if (period.toUpperCase() === "PM" && hour !== 12) {
                hour += 12;
            } else if (period.toUpperCase() === "AM" && hour === 12) {
                hour = 0;
            }

            const baseDate = new Date("2025-02-18T00:00:00Z");
            const date = new Date(baseDate.getTime() + index * 1000);
            date.setUTCHours(hour, minute, 0, 0);

            if (isNaN(date.getTime())) {
                console.warn("Invalid timestamp after parsing HH:mm AM/PM:", timestamp);
                return null;
            }
            return date;
        }

        console.warn("Invalid timestamp (unrecognized format):", timestamp);
        return null;
    };

    useEffect(() => {
        const loadConfigurations = async () => {
            console.log("Starting to load configurations from Azure...");
            try {
                const entities = [];
                for await (const entity of tableClient.listEntities()) {
                    console.log("Fetched entity:", entity);
                    let parsedLabels = [];
                    try {
                        parsedLabels = entity.labels ? JSON.parse(entity.labels) : [];
                        parsedLabels = parsedLabels
                            .map((label, index) => {
                                const parsed = parseTimestamp(label, index);
                                return parsed ? parsed.toISOString() : null;
                            })
                            .filter(label => label !== null);
                    } catch (err) {
                        console.error("Error parsing labels for entity:", entity, err);
                        parsedLabels = [];
                    }

                    let parsedCompressedLabels = [];
                    try {
                        parsedCompressedLabels = entity.compressedLabels ? JSON.parse(entity.compressedLabels) : [];
                        parsedCompressedLabels = parsedCompressedLabels
                            .map((label, index) => {
                                const parsed = parseTimestamp(label, index);
                                return parsed ? parsed.toISOString() : null;
                            })
                            .filter(label => label !== null);
                    } catch (err) {
                        console.error("Error parsing compressedLabels for entity:", entity, err);
                        parsedCompressedLabels = [];
                    }

                    entities.push({
                        id: entity.rowKey,
                        name: entity.name,
                        date: entity.date,
                        parameters: JSON.parse(entity.parameters || "{}"),
                        rawData: entity.rawData ? entity.rawData.split("\n").map(Number) : [],
                        labels: parsedLabels,
                        compressedData: entity.compressedData ? entity.compressedData.split("\n").map(Number) : [],
                        compressedLabels: parsedCompressedLabels,
                    });
                }
                console.log("Loaded configurations:", entities);
                setConfigurations(entities);
                setLoading(false);
            } catch (err) {
                console.error("Error loading configurations from Azure:", err);
                setError(`Failed to load configurations from Azure: ${err.message}`);
                setLoading(false);
            }
        };
        loadConfigurations();
    }, []);

    useEffect(() => {
        if (lastParamsRef.current && configPanelRef.current) {
            console.log("Restoring last used parameters:", lastParamsRef.current);
            configPanelRef.current.setParams(lastParamsRef.current);
        }
    }, []);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.documentElement.style.height = '100vh';
    }, []);

    const handleSave = async (config) => {
        const realParams = configPanelRef.current?.getParams?.();
        const newConfig = {
            ...config,
            name: config.name || `Configuration ${configurations.length + 1}`,
            date: new Date().toISOString(),
            parameters: JSON.stringify(realParams),
            rawData: config.includeCSV ? rawData.join("\n") : null,
            labels: config.includeCSV ? JSON.stringify(labels) : null,
            compressedData: config.includeCSV ? compressedData.join("\n") : null,
            compressedLabels: config.includeCSV ? JSON.stringify(compressedLabels) : null,
        };

        try {
            const entity = {
                partitionKey: "configurations",
                rowKey: `${Date.now()}`,
                name: newConfig.name,
                date: newConfig.date,
                parameters: newConfig.parameters,
                rawData: newConfig.rawData,
                labels: newConfig.labels,
                compressedData: newConfig.compressedData,
                compressedLabels: newConfig.compressedLabels,
            };

            await tableClient.createEntity(entity);

            setConfigurations((prev) => [
                ...prev,
                {
                    id: entity.rowKey,
                    ...newConfig,
                    parameters: realParams,
                    rawData: typeof newConfig.rawData === "string"
                        ? newConfig.rawData.split("\n").map(Number)
                        : newConfig.rawData || [],
                    labels: typeof newConfig.labels === "string"
                        ? JSON.parse(newConfig.labels)
                        : newConfig.labels || [],
                    compressedData: typeof newConfig.compressedData === "string"
                        ? newConfig.compressedData.split("\n").map(Number)
                        : newConfig.compressedData || [],
                    compressedLabels: typeof newConfig.compressedLabels === "string"
                        ? JSON.parse(newConfig.compressedLabels)
                        : newConfig.compressedLabels || [],
                },
            ]);

            alert("Optimal configuration saved!");
        } catch (err) {
            console.error("Error saving configuration to Azure:", err);
            setError(`Failed to save configuration to Azure: ${err.message}`);
        }
    };

    const handleNewConfig = () => {
        if (configPanelRef.current) {
            configPanelRef.current.reset();
        }
        setFile(null);
        setCompressedData([]);
        setCompressedLabels([]);
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLoadConfig = (config, source = 'sidebar') => {
        setRawData(config.rawData || []);
        setLabels(config.labels || []);

        if (source === 'sidebar') {
            if (configPanelRef.current?.reset) {
                configPanelRef.current.reset();
            }

            const compressedDataArray = typeof config.compressedData === 'string'
                ? config.compressedData.split('\n').map(Number)
                : config.compressedData || [];

            const compressedLabelsArray = typeof config.compressedLabels === 'string'
                ? JSON.parse(config.compressedLabels)
                : config.compressedLabels || [];

            setCompressedData(compressedDataArray);
            setCompressedLabels(compressedLabelsArray);
        } else if (source === 'upload') {
            setCompressedData([]);
            setCompressedLabels([]);
        }

        setFile(new File([""], config.name || "cloud.csv", { type: "text/csv" }));

        if (configPanelRef.current?.loadFromCloud) {
            configPanelRef.current.loadFromCloud(
                config.labels || [],
                config.rawData || [],
                config.name || 'cloud.csv',
                config.compressedData || [],
                config.compressedLabels || []
            );
        }

        if (config.parameters && configPanelRef.current?.setParams) {
            const parsed = typeof config.parameters === "string"
                ? JSON.parse(config.parameters)
                : config.parameters;
            configPanelRef.current.setParams(parsed);
            lastParamsRef.current = parsed;
        }
    };

    const compressData = async () => {
        if (!rawData.length || !labels.length) {
            setError("Please upload a file first");
            return;
        }

        const params = configPanelRef.current.getParams();
        lastParamsRef.current = params;
        const {
            compressionDeviationLimit,
            compressionDeviationType,
            exceptionFilterDeviationLimit,
            exceptionFilterDeviationType,
        } = params;

        const parsedTimestamps = labels.map((label, index) => parseTimestamp(label, index))
            .filter(timestamp => timestamp !== null)
            .map(timestamp => timestamp.toISOString());

        if (parsedTimestamps.length !== rawData.length) {
            throw new Error("Mismatch between timestamps and raw data");
        }

        const requestData = {
            rawData: rawData.map((value, index) => ({
                timestamp: parsedTimestamps[index],
                value: value,
            })),
            parameters: {
                deviationLimit: compressionDeviationLimit || exceptionFilterDeviationLimit || 0,
                deviationType: (compressionDeviationType || exceptionFilterDeviationType || "absolute").toLowerCase(),
            },
        };

        try {
            setIsCompressing(true);
            setError(null);

            const response = await fetch(`${FUNCTION_URL}?code=${FUNCTION_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }

            const result = await response.json();

            if (!Array.isArray(result) || !result.every(item => "timestamp" in item && "value" in item)) {
                throw new Error("Unexpected response format from compression endpoint");
            }

            if (result.length === 0) {
                setError("No data points remained after compression. Try adjusting the parameters.");
                setCompressedData([]);
                setCompressedLabels([]);
            }
            else {
                const rawDataForChart = rawData
                    .map((value, index) => {
                        const parsedTime = parseTimestamp(labels[index], index);
                        if (!parsedTime) return null;
                        return {
                            time: parsedTime,
                            value: value,
                        };
                    })
                    .filter(item => item !== null)
                    .sort((a, b) => a.time - b.time);

                const params = configPanelRef.current?.getParams?.() ?? {};
                const maxGapSeconds = params.maxResampleLimit ?? 8;

                const rawCompressed = result
                    .map((item, index) => {
                        const parsedTime = parseTimestamp(item.timestamp, index);
                        if (!parsedTime || isNaN(item.value)) return null;
                        return {
                            time: parsedTime,
                            value: item.value,
                        };
                    })
                    .filter(item => item !== null)
                    .sort((a, b) => a.time - b.time);

                const compressedWithGaps = [];
                const connectedTimestamps = new Set();

                if (rawCompressed.length > 0) {
                    compressedWithGaps.push({
                        time: rawCompressed[0].time,
                        value: rawCompressed[0].value,
                    });
                    connectedTimestamps.add(rawCompressed[0].time.toISOString());

                    for (let i = 1; i < rawCompressed.length; i++) {
                        const prev = rawCompressed[i - 1];
                        const current = rawCompressed[i];

                        const currTsStr = current.time.toISOString();

                        if (connectedTimestamps.has(currTsStr)) {
                            compressedWithGaps.push({
                                time: new Date((prev.time.getTime() + current.time.getTime()) / 2),
                                value: null,
                            });
                        }

                        compressedWithGaps.push({
                            time: current.time,
                            value: current.value,
                        });

                        connectedTimestamps.add(currTsStr);
                    }
                }

                setCompressedData(compressedWithGaps.map(item => item.value));
                setCompressedLabels(compressedWithGaps.map(item => item.time.toISOString()));
            }

        } catch (err) {
            console.error("Error compressing data with Azure Function:", err);
            setError(`Failed to compress data: ${err.message}`);
        } finally {
            setIsCompressing(false);
        }
    };

    const rawDataForChart = rawData
        .map((value, index) => {
            const parsedTime = parseTimestamp(labels[index], index);
            if (!parsedTime) return null;
            return {
                time: parsedTime,
                value: value,
            };
        })
        .filter(item => item !== null)
        .sort((a, b) => a.time - b.time);

    const compressedDataForChart = useMemo(() => {
        return compressedData
            .map((value, index) => {
                const parsedTime = parseTimestamp(compressedLabels[index], index);
                if (!parsedTime) return null;
                return {
                    time: parsedTime,
                    value: value,
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => a.time - b.time);
    }, [compressedData, compressedLabels]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "20px" }}>
                <h1>Loading...</h1>
                <p>Fetching configurations from Azure Table Storage</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
                <h1>Error</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div
            className="App"
            style={{
                display: "flex",
                flexDirection: "column",
                overflow: 'hidden',
                alignItems: "center",
                minHeight: "100vh",
                backgroundImage: "url('/icons/background.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                padding: "0px",
            }}
        >
            <div style={{
                width: '100%',
                backgroundColor: '#212121',
                color: 'white',
                padding: '12px 24px',
                fontSize: '20px',
                fontWeight: '600',
                boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                marginBottom: '0px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ flexGrow: 1, textAlign: 'center' }}>
                    Intelligent Plant Compression Optimisation
                </div>
                <img
                    src="/icons/logo.png"
                    alt="Logo"
                    style={{
                        height: '40px',
                        width: '40px',
                        objectFit: 'contain',
                        marginLeft: '0px',
                        marginRight: '12px'
                    }}
                />
            </div>

            <div style={{ width: "100%", maxWidth: "1000px" }}>
                <CompressionSidebarPanel
                    configurations={configurations}
                    setConfigurations={setConfigurations}
                    onNewConfig={handleNewConfig}
                    isOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    onLoadConfig={(config) => handleLoadConfig(config, 'sidebar')}
                    compressedData={compressedData}
                />
            </div>

            {/* Top section: ConfigPanel and MetricsTable side by side */}
            <div style={{
                width: "93%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "stretch",
                marginBottom: "0px",
                gap: "0px",
                height: '360px',
            }}>
                {/* Left: ConfigPanel (wider) */}
                <div style={{
                    flex: 1.5,
                    overflowY: 'hidden',
                    overflowX: 'hidden',
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    padding: "0px",
                }}>
                    <ConfigPanel
                        ref={configPanelRef}
                        setRawData={setRawData}
                        setLabels={(newLabels) => {
                            console.log("Setting labels from ConfigPanel:", newLabels);
                            setLabels(newLabels);
                        }}
                        setFile={setFile}
                        setCompressedData={setCompressedData}
                        setCompressedLabels={setCompressedLabels}
                        onCompress={compressData}
                        isCompressing={isCompressing}
                        onOptimized={(params) => {
                            setEditedConfig({
                                name: `Optimized Config - ${new Date().toLocaleTimeString()}`,
                                date: new Date().toISOString(),
                                parameters: params,
                            });
                            setModalOpen(true);
                        }}
                        onUploadComplete={(config) => handleLoadConfig(config, 'upload')}
                    />
                </div>

                {/* Right: MetricsTable (narrower) */}
                <div style={{
                    flex: 0.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    padding: "0px",
                }}>
                    <MetricsTable
                        rawData={rawData}
                        compressedData={compressedData}
                        onSave={handleSave}
                    />
                </div>
            </div>

            {/* Bottom chart section */}
            <div
                style={{
                    width: "90%",
                    flexGrow: 1,
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                    padding: "0px 20px 20px 20px",
                    marginBottom: "20px",
                    height: "340px"
                }}
            >
                <ZoomableChart
                    rawData={rawDataForChart.map(item => item.value)}
                    labels={rawDataForChart.map(item => item.time.toISOString())}
                    compressedData={compressedDataForChart.map(item => item.value)}
                    compressedLabels={compressedDataForChart.map(item => item.time.toISOString())}
                />
            </div>
        </div>
    );
}

export default App;
