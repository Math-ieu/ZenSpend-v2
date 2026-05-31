import React, { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { MonthlyExpense } from '../../types';
import { useTheme } from '../../hooks/useTheme';

// Register ChartJS components including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ExpenseChartProps {
  data: MonthlyExpense[];
  onMonthClick?: (monthName: string) => void;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, onMonthClick }) => {
  const { theme } = useTheme();
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Revenus',
        data: data.map(d => d.income),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(34, 197, 94)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2.5,
      },
      {
        label: 'Dépenses',
        data: data.map(d => d.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(239, 68, 68)',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2.5,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event: any, elements: any[]) => {
      if (elements && elements.length > 0 && chartRef.current) {
        const index = elements[0].index;
        const monthName = chartRef.current.data.labels?.[index] as string;
        if (onMonthClick && monthName) {
          onMonthClick(monthName);
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          color: theme === 'dark' ? '#F9FAFB' : '#111827',
          font: {
            family: "'Inter', system-ui, sans-serif",
            size: 12,
            weight: 'bold',
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1F2937' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'dark' ? '#F9FAFB' : '#111827',
        bodyColor: theme === 'dark' ? '#9CA3AF' : '#4B5563',
        borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ' : ';
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
          display: false,
        },
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          font: {
            family: "'Inter', system-ui, sans-serif",
            size: 11,
            weight: 500,
          },
        }
      },
      y: {
        grid: {
          color: theme === 'dark' ? 'rgba(75, 85, 99, 0.1)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          font: {
            family: "'Inter', system-ui, sans-serif",
            size: 11,
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
      duration: 1200,
      easing: 'easeOutQuart',
    },
  };



  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted font-medium">Aucune donnée disponible</div>;
  }

  return (
    <div style={{ height: '320px' }}>
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options} 
      />
    </div>
  );
};

export default ExpenseChart;