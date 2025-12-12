import React from 'react';
import { render } from '@testing-library/react';
import ZoomableChart from '../components/desktop/Chart.js';
import { Line } from 'react-chartjs-2';

jest.mock('react-chartjs-2', () => ({
    Line: jest.fn(() => null),
}));

describe('ZoomableChart Component', () => {
    const mockRawData = [1, 2, 3, 4, 5];
    const mockLabels = ['1', '2', '3', '4', '5'];
    const mockCompressedData = [1.5, 3.5, 5];
    const mockCompressedLabels = ['1', '3', '5'];

    beforeEach(() => {
        Line.mockClear();
    });

    // Basic render test
    it('renders without crashing', () => {
        render(
            <ZoomableChart
                rawData={mockRawData}
                labels={mockLabels}
                compressedData={mockCompressedData}
                compressedLabels={mockCompressedLabels}
            />
        );
    });

    // Render with empty props
    it('renders with empty data when no props are provided', () => {
        render(<ZoomableChart />);

        const chartProps = Line.mock.calls[0][0];
        expect(chartProps.data.labels).toEqual([]);
        expect(chartProps.data.datasets[0].data).toEqual([]);
        expect(chartProps.data.datasets[1].data).toEqual([]);
    });

    // Data passed correctly to Line chart
    it('passes correct data to Line chart when provided with props', () => {
        render(
            <ZoomableChart
                rawData={mockRawData}
                labels={mockLabels}
                compressedData={mockCompressedData}
                compressedLabels={mockCompressedLabels}
            />
        );

        const chartProps = Line.mock.calls[0][0];
        expect(chartProps.data.labels).toEqual(mockLabels);
        expect(chartProps.data.datasets[1].data).toEqual([
            { x: '1', y: 1 },
            { x: '2', y: 2 },
            { x: '3', y: 3 },
            { x: '4', y: 4 },
            { x: '5', y: 5 }
            ]);
        expect(chartProps.data.datasets[0].data).toEqual([
            { x: '1', y: 1.5 },
            { x: '3', y: 3.5 },
            { x: '5', y: 5 }
            ]);
    });

    // Chart options configuration validation
    it('has correct chart options configured', () => {
        render(
            <ZoomableChart
                rawData={mockRawData}
                labels={mockLabels}
                compressedData={mockCompressedData}
                compressedLabels={mockCompressedLabels}
            />
        );

        const chartProps = Line.mock.calls[0][0];
        expect(chartProps.options.responsive).toBe(true);
        expect(chartProps.options.scales.x.title.text).toBe('Time');
        expect(chartProps.options.scales.y.title.text).toBe('Value');
        expect(chartProps.options.plugins.zoom.pan.enabled).toBe(true);
    });

    // Handle empty rawData array
    it('handles empty rawData array correctly', () => {
        render(
            <ZoomableChart
                rawData={[]}
                labels={mockLabels}
                compressedData={mockCompressedData}
                compressedLabels={mockCompressedLabels}
            />
        );

        const chartProps = Line.mock.calls[0][0];
        expect(chartProps.data.datasets[1].data).toEqual([]);
        expect(chartProps.data.datasets[0].data.length).toBe(3)
    });

    // Handle empty compressedData array
    it('handles empty compressedData array correctly', () => {
        render(
            <ZoomableChart
                rawData={mockRawData}
                labels={mockLabels}
                compressedData={[]}
                compressedLabels={mockCompressedLabels}
            />
        );

        const chartProps = Line.mock.calls[0][0];
        expect(chartProps.data.datasets[1].data.length).toBe(5);
        expect(chartProps.data.datasets[0].data).toEqual([]);
    });

    // Snapshot testing
    it('matches snapshot with data', () => {
        const { asFragment } = render(
            <ZoomableChart
                rawData={mockRawData}
                labels={mockLabels}
                compressedData={mockCompressedData}
                compressedLabels={mockCompressedLabels}
            />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    // Dataset border color validation
    it('applies correct border colors to datasets', () => {
        render(
            <ZoomableChart
                rawData={mockRawData}
                labels={mockLabels}
                compressedData={mockCompressedData}
                compressedLabels={mockCompressedLabels}
            />
        );

        const chartProps = Line.mock.calls[0][0];
        expect(chartProps.data.datasets[0].borderColor).toBe('#8884d8');
        expect(chartProps.data.datasets[1].borderColor).toBe('#82ca9d');
    });

    // Dataset point radius configuration
    it('configures correct point radius for datasets', () => {
        render(
            <ZoomableChart
                rawData={mockRawData}
                labels={mockLabels}
                compressedData={mockCompressedData}
                compressedLabels={mockCompressedLabels}
            />
        );

        const chartProps = Line.mock.calls[0][0];
        expect(chartProps.data.datasets[0].pointRadius).toBe(4);
        expect(chartProps.data.datasets[1].pointRadius).toBe(2);
    });

    // Aspect ratio configuration
    it('maintains correct aspect ratio setting', () => {
        render(
            <ZoomableChart
                rawData={mockRawData}
                labels={mockLabels}
                compressedData={mockCompressedData}
                compressedLabels={mockCompressedLabels}
            />
        );

        const chartProps = Line.mock.calls[0][0];
        expect(chartProps.options.maintainAspectRatio).toBe(false);
    });
});
