import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import '@testing-library/jest-dom';

// Mock Azure TableClient and AzureSASCredential
jest.mock("@azure/data-tables", () => {
    return {
        TableClient: jest.fn().mockImplementation(() => ({
            listEntities: jest.fn(() => ({
                [Symbol.asyncIterator]: () => {
                    let done = false;
                    return {
                        next: async () => {
                            if (done) return { done: true };
                            done = true;
                            return {
                                value: {
                                    rowKey: "1",
                                    name: "Mock Config 1",
                                    date: "2025-01-01",
                                    parameters: "{}",
                                    rawData: "1\n2\n3",
                                    labels: JSON.stringify(["2025-01-01T00:00:00Z"]),
                                    compressedData: "1\n2",
                                    compressedLabels: JSON.stringify(["2025-01-01T00:00:00Z"]),
                                },
                                done: false,
                            };
                        }
                    };
                }
            })),
            createEntity: jest.fn(),
        })),
        AzureSASCredential: jest.fn(),
    };
});

// Mock child components to prevent rendering issues
jest.mock("../components/desktop/ConfigPanel", () => {
    const React = require('react');
    return React.forwardRef(() => <div>Mock ConfigPanel</div>);
});
jest.mock("../components/desktop/CompressionMatrixTable", () => () => <div>Mock MetricsTable</div>);
jest.mock("../components/desktop/CompressionSidebarPanel", () => () => <div>Mock Sidebar</div>);
jest.mock("../components/desktop/Chart", () => () => <div>Mock Chart</div>);

describe("App Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("loads configurations on mount", async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText(/Mock ConfigPanel/i)).toBeInTheDocument();
        });

        // Check that the page title or main UI renders
        expect(screen.getByText(/Intelligent Plant Compression Optimisation/i)).toBeInTheDocument();
    });

    it("renders child components", async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText("Mock Sidebar")).toBeInTheDocument();
            expect(screen.getByText("Mock ConfigPanel")).toBeInTheDocument();
            expect(screen.getByText("Mock Chart")).toBeInTheDocument();
            expect(screen.getByText("Mock MetricsTable")).toBeInTheDocument();
        });
    });
});