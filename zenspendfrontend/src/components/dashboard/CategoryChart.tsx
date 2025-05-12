import React, { useRef, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { generateCategories } from '../../lib/mockData';
import { useTheme } from '../../hooks/useTheme';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const CategoryChart: React.FC = () => {
  const { theme } = useTheme();
  const categoryData = generateCategories();
  const chartRef = useRef<ChartJS<"doughnut"> | null>(null);
  
  // Ensure categoryData is valid before creating chart data
  const chartData = categoryData ? {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: categoryData.colors,
        borderColor: categoryData.colors.map(color => color),
        borderWidth: 1,
      },
    ],
  } : null;

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          color: theme === 'dark' ? '#F9FAFB' : '#111827',
          font: {
            family: "'Inter', system-ui, sans-serif",
            size: 12,
          },
          generateLabels: function(chart) {
            // @ts-ignore - chart typings are not complete
            const original = ChartJS.overrides.doughnut.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            
            if (!chart.data.datasets || !Array.isArray(chart.data.datasets)) {
              return labels;
            }

            labels.forEach((label) => {
              if (label.datasetIndex === undefined) return;
              
              const dataset = chart.data.datasets[label.datasetIndex];
              if (!dataset || !Array.isArray(dataset.data)) return;
              
              const value = dataset.data[label.index as number];
              const total = dataset.data.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
              const percentage = total > 0 ? Math.round((value as number / total) * 100) : 0;
              label.text = `${label.text} (${percentage}%)`;
            });

            return labels;
          }
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#374151' : 'rgba(255, 255, 255, 0.9)',
        titleColor: theme === 'dark' ? '#F9FAFB' : '#111827',
        bodyColor: theme === 'dark' ? '#F9FAFB' : '#111827',
        borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const dataset = context.dataset;
            if (!Array.isArray(dataset.data)) return label;
            
            const total = dataset.data.reduce((acc: number, val: number) => acc + val, 0);
            const percentage = total > 0 ? Math.round((value as number / total) * 100) : 0;
            return `${label}: ${percentage}%`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  // Clean up chart instance on unmount or re-render
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (!chartData) {
    return <div className="h-[300px] flex items-center justify-center">No data available</div>;
  }

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Doughnut 
        ref={chartRef}
        data={chartData} 
        options={options}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h4 className="text-xs font-medium text-muted">Total</h4>
        <p className="text-lg font-semibold text-foreground">100%</p>
      </div>
    </div>
  );
};

export default CategoryChart;