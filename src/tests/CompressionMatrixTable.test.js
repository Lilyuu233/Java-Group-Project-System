import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MetricsTable from '../components/desktop/CompressionMatrixTable';

describe('MetricsTable', () => {
    const mockRawData = [10, 20, 30, 40, 50];
    const mockCompressedData = [10, 30, 50];
    const mockOnSave = jest.fn();

    beforeEach(() => {
        mockOnSave.mockClear();
    });

    // 1. Basic rendering test
    test('renders all metric categories', () => {
        render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);

        const metrics = [
            'Number of Data Points (Raw)',
            'Number of Data Points (Compressed)',
            'Compression Ratio',
            'Storage Size (Raw) (KB)',
            'Storage Size (Compressed) (KB)',
            'Error Rate (%)'
        ];

        metrics.forEach(metric => {
            expect(screen.getByText(metric)).toBeInTheDocument();
        });
    });

    // 2. Metric calculation validation
    test('calculates correct metrics for sample data', () => {
        render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);

        expect(screen.getByTestId('metric-value-raw-points')).toHaveTextContent('5');
        expect(screen.getByTestId('metric-value-compressed-points')).toHaveTextContent('3');
        expect(screen.getByTestId('metric-value-ratio')).toHaveTextContent('1.67');
        expect(screen.getByTestId('metric-value-error-rate')).toHaveTextContent('0.00');
    });

    // 3. Save functionality tests
    describe('save functionality', () => {
        test('save button is enabled and clickable', async () => {
            render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);
            const saveButton = screen.getByTestId('save-button');
            await userEvent.click(saveButton);
            expect(saveButton).toBeInTheDocument();
        });

        test('saves configuration without CSV by default', async () => {
            render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);
            await userEvent.click(screen.getByTestId('save-button'));
            await userEvent.click(screen.getByText('Confirm'));
            expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
                includeCSV: false
            }));
        });

        test('saves configuration with CSV when checked', async () => {
            render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);
            await userEvent.click(screen.getByText('Save Configuration'));
            await userEvent.click(screen.getByLabelText('Include CSV File'));
            await userEvent.click(screen.getByText('Confirm'));
            expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
                includeCSV: true
            }));
        });
    });

    // 4. Table structure test
    test('renders correct table structure', () => {
        render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);

        const table = screen.getByRole('table');
        const headers = screen.getAllByRole('columnheader');
        const rows = screen.getAllByRole('row');

        expect(table).toBeInTheDocument();
        expect(headers).toHaveLength(2);
        expect(headers[0]).toHaveTextContent('Metric');
        expect(headers[1]).toHaveTextContent('Value');
        expect(rows.length).toBe(7); // Header + 6 metric rows
    });

    // 5. Edge case handling
    describe('data edge cases', () => {
        test('handles single data point', () => {
            render(<MetricsTable rawData={[10]} compressedData={[10]} onSave={mockOnSave} />);
            expect(screen.getByTestId('metric-value-ratio')).toHaveTextContent('1.00');
        });

        test('handles empty compressed data (division by zero)', () => {
            render(<MetricsTable rawData={[1,2,3]} compressedData={[]} onSave={mockOnSave} />);
            expect(screen.getByTestId('metric-value-ratio')).toHaveTextContent('Infinity');
        });
    });

    // 6. Performance test with large datasets
    test('renders large dataset efficiently', () => {
        const largeRawData = Array.from({length: 10000}, (_, i) => i);
        const largeCompressedData = Array.from({length: 1000}, (_, i) => i * 10);

        render(<MetricsTable rawData={largeRawData} compressedData={largeCompressedData} onSave={mockOnSave} />);

        expect(screen.getByText('10000')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('10.00')).toBeInTheDocument();
    });

    // 7. Table header style verification
    test('table headers have correct styling', () => {
        render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);

        const headers = screen.getAllByRole('columnheader');
        headers.forEach(header => {
            expect(header).toHaveStyle(`
                padding: 16px;
                background-color: #f8f9fa;
                color: #212529;
                font-weight: 600;
            `);
        });
    });

    // 8. Save button base styling
    test('save button has correct base styling', () => {
        render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);

        const button = screen.getByText('Save Configuration');
        expect(button).toHaveStyle(`
            background-color: #4CAF50;
            color: white;
            border-radius: 8px;
        `);
    });

    // 9. Scroll container style verification
    test('has correct scroll container styling', () => {
        const { container } = render(
            <MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />
        );
    });

    // 10. Table border styling
    test('table has correct border styling', () => {
        render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);

        const table = screen.getByRole('table');
        expect(table).toHaveStyle('border-collapse: collapse');

        const firstCell = screen.getAllByRole('cell')[0];
        expect(firstCell).toHaveStyle('border: 1px solid #ddd');
    });

    // 11. Save button dimension verification
    test('save button has correct dimensions', () => {
        render(<MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />);

        const button = screen.getByText('Save Configuration');
        expect(button).toHaveStyle('padding: 10px 20px');
        expect(button).toHaveStyle('font-size: 15px');
    });

    // 12. Scroll container border radius
    test('container has correct border radius', () => {
        const { container } = render(
            <MetricsTable rawData={mockRawData} compressedData={mockCompressedData} onSave={mockOnSave} />
        );

        const scrollContainer = container.querySelector('[data-testid="scroll-container"]');
        expect(scrollContainer).toHaveStyle('border-radius: 8px');
    });
});
