import React, { useEffect, useState } from "react";
import Papa from "papaparse";

export default function CsvTable({ selectedSource }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        if (!selectedSource) return;

        fetch(process.env.PUBLIC_URL + "/data_points.csv")
            .then((res) => res.text())
            .then((csv) => {
                const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });

                const filtered = data.filter(row => row.DataSource === selectedSource);
                setRows(filtered);
            })
            .catch(console.error);
    }, [selectedSource]);

    if (!rows.length) return <p style={{ padding: "1rem" }}>No available data <code>{selectedSource}</code></p>;

    return (
        <div
            style={{
                maxHeight: "320px",
                overflowY: "auto",
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "6px",
            }}
        >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                <tr>
                    <th style={th}>Utc Sample Time</th>
                    <th style={th}>Numeric Value</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((r, i) => (
                    <tr key={i}>
                        <td style={td}>{r.UtcSampleTime}</td>
                        <td style={td}>{r.NumericValue}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

const th = { border: "1px solid #ddd", padding: "4px", background: "#f7f7f7" };
const td = { border: "1px solid #ddd", padding: "4px" };
