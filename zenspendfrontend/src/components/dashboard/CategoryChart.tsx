import React, { useRef, useEffect, useMemo } from 'react';
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
import { TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';


// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface CategoryChartProps {
  transactions?: any[];
  onCategoryClick?: (categoryName: string) => void;
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  transactions = [],
  onCategoryClick
}) => {
  const { theme } = useTheme();
  const chartRef = useRef<ChartJS<"doughnut"> | null>(null);

  const expenseTransactions = useMemo(() => {
    return (transactions || []).filter(t => t.type === 'expense');
  }, [transactions]);

  // Aggregate expenses by category
  const aggregatedData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    expenseTransactions.forEach(t => {
      // Safely fetch category name
      const catName = t.category_name || t.category?.name || t.category || 'Autres';
      const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount || 0);
      categoriesMap[catName] = (categoriesMap[catName] || 0) + amt;
    });

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);
    
    // Nice premium pastels colors
    const colorsMap: Record<string, string> = {
      'Alimentation': '#F87171',
      'Transport': '#60A5FA',
      'Logement': '#34D399',
      'Loisirs': '#FBBF24',
      'Santé': '#F472B6',
      'Factures': '#A78BFA',
      'Abonnements': '#FB923C',
      'Autres': '#9CA3AF',
    };

    const colors = labels.map(label => colorsMap[label] || `hsl(${Math.random() * 360}, 70%, 60%)`);

    return {
      labels,
      data,
      colors
    };
  }, [expenseTransactions]);
  
  const categoryData = useMemo(() => {
    if (aggregatedData.labels.length > 0) {
      return aggregatedData;
    }
    return generateCategories();
  }, [aggregatedData]);

  // Ensure categoryData is valid before creating chart data
  const chartData = categoryData ? {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: categoryData.colors,
        borderColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  } : null;

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '78%',
    onClick: (event: any, elements: any[]) => {
      if (elements && elements.length > 0 && chartRef.current) {
        const index = elements[0].index;
        const categoryName = chartRef.current.data.labels?.[index] as string;
        if (onCategoryClick && categoryName) {
          onCategoryClick(categoryName);
        }
      }
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 16,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          color: theme === 'dark' ? '#F9FAFB' : '#111827',
          font: {
            family: "'Inter', system-ui, sans-serif",
            size: 11,
            weight: 'semibold',
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels && data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = (dataset.data as number[]).reduce((acc, val) => acc + (Number(val) || 0), 0);
              
              return data.labels.map((label, i) => {
                const value = dataset.data[i] as number;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor) as string || '#9CA3AF',
                  strokeStyle: (Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor) as string || '#ffffff',
                  lineWidth: dataset.borderWidth as number || 2,
                  hidden: !chart.getDataVisibility(i),
                  index: i
                };
              });
            }
            return [];
          }
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1F2937' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'dark' ? '#F9FAFB' : '#111827',
        bodyColor: theme === 'dark' ? '#9CA3AF' : '#4B5563',
        borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const dataset = context.dataset;
            if (!Array.isArray(dataset.data)) return label;
            
            const total = (dataset.data as any[]).reduce((acc: number, val: any) => acc + (typeof val === 'number' ? val : 0), 0);
            const percentage = total > 0 ? Math.round((value as number / total) * 100) : 0;
            return ` ${label} : ${percentage}%`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200,
      easing: 'easeOutQuart',
    },
  };

  if (!chartData) {
    return <div className="h-[300px] flex items-center justify-center text-muted font-medium">Aucune donnée disponible</div>;
  }

  // Calculate sum of active data
  const totalExpenseSum = useMemo(() => {
    return (categoryData.data as number[]).reduce((acc, val) => acc + val, 0);
  }, [categoryData]);

  return (
    <div style={{ height: '260px', position: 'relative' }} className="flex justify-center items-center">
      <Doughnut 
        ref={chartRef}
        data={chartData} 
        options={options}
      />
      {/* Dynamic central visual element */}
      <div className="absolute top-1/2 left-[33%] md:left-[35%] lg:left-[30.5%] transform -translate-x-1/2 -translate-y-1/2 text-center bg-background/80 dark:bg-slate-900/80 backdrop-blur-md h-20 w-20 rounded-full flex flex-col items-center justify-center border border-border/40 shadow-lg select-none pointer-events-none">
        <div className="h-6 w-6 rounded-full bg-error/10 text-error flex items-center justify-center mb-0.5">
          <TrendingDown size={13} />
        </div>
        <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-muted leading-none">Dépenses</h4>
        <p className="text-sm font-black text-foreground mt-0.5 font-mono leading-none">
          {totalExpenseSum > 0 ? formatCurrency(Math.round(totalExpenseSum)) : '0'}
        </p>
      </div>
    </div>
  );
};

export default CategoryChart;