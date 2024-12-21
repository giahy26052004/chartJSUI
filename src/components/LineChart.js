import React, { useState, useEffect, useRef, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

// Register necessary components and plugin
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

const LineChart = () => {
  const [total, setTotal] = useState(3444); // Initial total value
  const [change, setChange] = useState(0); // Initial change value
  const [priceColor, setPriceColor] = useState("#00FF00");
  const [chartData, setChartData] = useState({
    labels: [
      "18:46:45",
      "18:47:00",
      "18:47:15",
      "18:47:30",
      "18:47:45",
      "18:48:00",
    ],
    datasets: [
      {
        label: "Asset Value",
        data: [3440, 3442, 3444, 3443, 3445, 3444],
        fill: true,
        borderColor: "#b2e400",
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          gradient.addColorStop(0, "#b2e400");
          gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
          return gradient;
        },
        tension: 0.8,
        pointStyle: "circle",
        pointRadius: (context) => {
          const dataLength = context.dataset.data.length;
          return context.dataIndex === dataLength - 1 ? 5 : 3;
        },
        pointHoverRadius: 8,
        pointBackgroundColor: (context) => {
          const dataset = context.dataset;
          const currentValue = dataset.data[context.dataIndex];
          const previousValue =
            dataset.data[context.dataIndex - 1] || currentValue;
          return currentValue > previousValue ? "#00FF00" : "#FF0000";
        },
        yAxisID: "y", // Use the main Y axis (right)
      },
    ],
  });

  // Variable to store the timeout reference
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Function to update chart data with a delay
    const updateChartData = () => {
      setChartData((prevData) => {
        const newTime = new Date().toLocaleTimeString().slice(0, 8);
        const newValue =
          prevData.datasets[0].data[prevData.datasets[0].data.length - 1] +
          (Math.random() - 0.5) * 2;
        const newLabels = [...prevData.labels, newTime];
        const newData = [...prevData.datasets[0].data, newValue];

        // Update priceColor and total change
        const lastValue =
          prevData.datasets[0].data[prevData.datasets[0].data.length - 1];
        const newPriceColor = newValue > lastValue ? "#00FF00" : "#FF0000";
        setPriceColor(newPriceColor);

        // Update total and change
        const newTotal = newData[newData.length - 1];
        const newChange =
          newData[newData.length - 1] - newData[newData.length - 2];

        setTotal(newTotal);
        setChange(newChange);

        // Keep the number of labels and data points below a certain number (e.g., 10)
        if (newLabels.length > 10) {
          newLabels.shift();
          newData.shift();
        }

        return {
          labels: newLabels,
          datasets: [{ ...prevData.datasets[0], data: newData }],
        };
      });

      // Call this function again with a delay of 2 seconds (2000ms)
      timeoutRef.current = setTimeout(updateChartData, 2000); // 2 seconds delay
    };

    // Start the first update
    timeoutRef.current = setTimeout(updateChartData, 2000);

    // Cleanup on component unmount
    return () => clearTimeout(timeoutRef.current);
  }, []); // Empty dependency array to run only once when the component mounts

  const chartRef = useRef(null);

  const options = useMemo(() => {
    return {
      responsive: true,
      plugins: {
        title: {
          display: false,
        },
        tooltip: {
          enabled: true,
          position: "nearest",
        },
        zoom: {
          zoom: {
            enabled: true,
            mode: "xy",
            speed: 0.1,
            threshold: 10,
            wheel: {
              enabled: true,
              speed: 0.05,
            },
          },
          pan: {
            enabled: true,
            mode: "xy",
            speed: 10,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Time",
            color: "#fff",
          },
          ticks: {
            color: "#fff",
          },
          grid: {
            color: "#555",
          },
        },
        y: {
          position: "right", // First Y axis on the right
          title: {
            display: true,
            text: "Value in USD",
            color: "#fff",
          },
          ticks: {
            color: "#fff",
          },
          grid: {
            color: "#555",
          },
        },
      },
    };
  }, [chartData]);

  return (
    <div className="chart-container">
      <p className="current-price" style={{ color: priceColor }}>
        ${total.toFixed(2)}
      </p>
      <p className="change">
        {change >= 0 ? `+${change.toFixed(2)}` : `${change.toFixed(2)}`} USD
      </p>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default LineChart;
