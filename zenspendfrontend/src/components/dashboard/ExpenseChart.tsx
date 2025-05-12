import React, { useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { MonthlyExpense } from '../../types';
import { useTheme } from '../../hooks/useTheme';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ExpenseChartProps {
  data: MonthlyExpense[];
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const chartRef = useRef<ChartJS<"bar"> | null>(null);
  
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Dépenses',
        data: data.map(d => d.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Revenus',
        data: data.map(d => d.income),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#F9FAFB' : '#111827',
          font: {
            family: "'Inter', system-ui, sans-serif",
            size: 12,
          },
        },
      },
      title: {
        display: false,
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.8)',
        },
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          font: {
            family: "'Inter', system-ui, sans-serif",
          },
        }
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.8)',
        },
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          font: {
            family: "'Inter', system-ui, sans-serif",
          },
          callback: function(value) {
            return new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(Number(value));
          }
        }
      }
    },
    animation: {
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

  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center">No data available</div>;
  }

  return (
    <div style={{ height: '300px' }}>
      <Bar 
        ref={chartRef}
        data={chartData} 
        options={options} 
      />
    </div>
  );
};

export default ExpenseChart;