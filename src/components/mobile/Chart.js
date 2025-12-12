import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register required chart components and plugins
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    zoomPlugin
);

function formatSmartTimestamp(isoString) {
    const date = new Date(isoString);
    if (isNaN(date)) return isoString;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');

    if (h === '00' && min === '00' && s === '00') {
        return `${y}-${m}-${d}`;
    } else if (s === '00') {
        return `${m}-${d} ${h}:${min}`;
    } else {
        return `${m}-${d} ${h}:${min}:${s}`;
    }
}

const ZoomableChart = ({ rawData = [], labels = [], compressedData = [], compressedLabels = [] }) => {
    const chartRef = useRef(null);

    const initialY = useMemo(() => {
        const allY = [...rawData, ...compressedData];
        const min = Math.min(...allY);
        const max = Math.max(...allY);
        const padding = (max - min) * 0.05;
        return {
            min: min,
            max: max,
            paddedMin: min - padding,
            paddedMax: max + padding
        };
    }, [rawData, compressedData]);

    const initialX = useMemo(() => {
        const startIndex = 0;
        const endIndex = labels.length - 1;
        const extra = 5;
        const paddedStart = Math.max(startIndex - extra, 0);
        const paddedEnd = Math.min(endIndex + extra, labels.length - 1);
        return {
            min: labels[startIndex],
            max: labels[endIndex],
            paddedMin: labels[paddedStart],
            paddedMax: labels[paddedEnd]
        };
    }, [labels]);


    const chartData = {
        labels,
        datasets: [
            {
                label: 'Compressed Data',
                data: compressedData.map((value, index) => ({
                    x: compressedLabels[index],
                    y: value
                })),
                borderColor: '#8884d8',
                borderWidth: 2,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 5,
                spanGaps: false
            },
            {
                label: 'Raw Data',
                data: rawData.map((value, index) => ({
                    x: labels[index],
                    y: value
                })),
                borderColor: '#82ca9d',
                borderWidth: 1,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 3
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                type: 'category',
                title: {
                    display: true,
                    text: 'Time',
                    font: { size: 14 },
                    padding: { top: 10, bottom: 10 }
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    font: { size: 12 },
                    callback: function(value) {
                        return formatSmartTimestamp(this.getLabelForValue(value));
                    }
                },

                grid: { display: false },
                bounds: 'ticks'
            },
            y: {
                title: {
                    display: true,
                    text: 'Value',
                    font: { size: 14 },
                    padding: { top: 10, bottom: 10 }
                },
                ticks: { font: { size: 12 } },
                grid: { color: '#f0f0f0' }
            }
        },
        plugins: {
            zoom: {
                pan: { enabled: true, mode: 'xy' ,speed: 5},
                zoom: {
                    enabled: true,
                    mode: 'xy',
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    limits: {
                        x: {
                            min: initialX.paddedMin,
                            max: initialX.paddedMax,
                            minRange: 3
                        },
                        y: {
                            min: initialY.paddedMin,
                            max: initialY.paddedMax,
                            minRange: (initialY.max - initialY.min) * 0.01
                        }
                    },

                    // Handle zoom completion logic
                    onZoomComplete: ({ chart }) => {
                        const xScale = chart.scales.x;
                        const yScale = chart.scales.y;
                        const labels = xScale.getLabels();

                        let updated = false;

                        if (xScale.min < initialX.paddedMin) {
                            xScale.options.min = initialX.paddedMin;
                            updated = true;
                        }
                        if (xScale.max > initialX.paddedMax) {
                            xScale.options.max = initialX.paddedMax;
                            updated = true;
                        }

                        if (yScale.min < initialY.paddedMin) {
                            yScale.options.min = initialY.paddedMin;
                            updated = true;
                        }
                        if (yScale.max > initialY.paddedMax) {
                            yScale.options.max = initialY.paddedMax;
                            updated = true;
                        }

                        const visibleCount = labels.filter((_, i) => {
                            const px = xScale.getPixelForTick(i);
                            return px >= xScale.left && px <= xScale.right;
                        }).length;

                        if (visibleCount <= 3) {
                            const centerIndex = Math.floor(labels.length / 2);
                            const minIndex = Math.max(centerIndex - 1, 0);
                            const maxIndex = Math.min(centerIndex + 1, labels.length - 1);

                            xScale.options.min = labels[minIndex];
                            xScale.options.max = labels[maxIndex];
                            updated = true;
                        }

                        if (updated) chart.update();
                    }

                }
            },

            legend: {
                position: 'top',
                labels: { padding: 20 }
            }
        },
        layout: {
            padding: { left: 20, right: 20, top: 0, bottom: 0 }
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '500px',
            padding: '0px 0px',
            boxSizing: 'border-box',
            margin: '0px auto',
            maxWidth: '100%'
        }}>
            <Line ref={chartRef} data={chartData} options={options} />
        </div>
    );
};

export default ZoomableChart;
