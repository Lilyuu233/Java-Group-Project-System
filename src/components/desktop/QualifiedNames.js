import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Papa from "papaparse";

/**
 * Displays each qualified name as a large vertical button with inline styles
 * so it works even if Tailwind isn’t enabled.
 */
export default function QualifiedNames({ onSelect }) {
  const [names, setNames] = useState([]);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/qualified_names.csv")
      .then((res) => res.text())
      .then((csv) => {
        const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
        const cleaned = data.map((row) => {
          const qn = row.QualifiedName || "";
          const dot = qn.indexOf(".");
          return dot === -1 ? qn : qn.slice(dot + 1);
        });
        setNames(cleaned);
      })
      .catch(console.error);
  }, []);

  if (!names.length) return <p>Loading…</p>;

  const btnStyle = {
    width: "100%",
    textAlign: "left",
    padding: "16px 24px",
    fontSize: "18px",
    border: "1px solid #ccc",
    borderRadius: "12px",
    marginBottom: "12px",
    backgroundColor: "#f9f9f9",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
  };

  const btnHover = {
    backgroundColor: "#e9e9e9",
  };

  return (
    <div style={{ width: "100%" }}>
      {names.map((n, i) => (
        <button
          key={i}
          style={btnStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: "#f9f9f9" })}
          onClick={() => onSelect && onSelect(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

QualifiedNames.propTypes = {
  onSelect: PropTypes.func,
};
