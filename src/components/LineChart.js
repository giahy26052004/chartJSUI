import React, { useState, useEffect, useRef } from "react";
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
  const [total, setTotal] = useState(0); // Total value to display on the chart
  const [previousTotal, setPreviousTotal] = useState(0); // To track the previous value
  const [change, setChange] = useState(0); // To track the change in value
  const chartRef = useRef(null); // Create a ref for the chart instance

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
          return currentValue > previousValue ? "#00FF00" : "#FF0000"; // Green for increase, Red for decrease
        },
      },
    ],
  });

  const [priceColor, setPriceColor] = useState("#00FF00"); // Default to green (increase)

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const newTime = new Date().toLocaleTimeString().slice(0, 8);
        const newValue =
          prevData.datasets[0].data[prevData.datasets[0].data.length - 1] +
          (Math.random() - 0.5) * 2;
        const newLabels = [...prevData.labels, newTime];
        const newData = [...prevData.datasets[0].data, newValue];

        // Check price direction (increase or decrease)
        const lastValue =
          prevData.datasets[0].data[prevData.datasets[0].data.length - 1];
        const newPriceColor = newValue > lastValue ? "#00FF00" : "#FF0000"; // Green for increase, Red for decrease
        setPriceColor(newPriceColor);

        if (newLabels.length > 10) {
          newLabels.shift();
          newData.shift();
        }

        return {
          labels: newLabels,
          datasets: [{ ...prevData.datasets[0], data: newData }], // Update the dataset
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const options = {
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
          enabled: true, // Enable zooming
          mode: "xy", // Zoom both X and Y axes
          speed: 0.1, // Zoom speed
          threshold: 10, // Minimum distance to zoom
          wheel: {
            enabled: true, // Enable zooming with the mouse wheel
            speed: 0.05, // Adjust the zoom speed with the mouse wheel
          },
        },
        pan: {
          enabled: true, // Enable panning
          mode: "xy", // Pan both X and Y axes
          speed: 10, // Panning speed
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
        position: "right",
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

  const displayValueOnPointPlugin = {
    id: "displayValueOnPoint",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      const lastPointIndex = dataset.data.length - 1;
      const lastValue = dataset.data[lastPointIndex];

      const previousValue = dataset.data[lastPointIndex - 1] || lastValue; // If no previous value, use the current one

      // Determine the color based on the value change (increase or decrease)
      const color = lastValue > previousValue ? "#00FF00" : "#FF0000"; // Green for increase, Red for decrease

      // Get the x and y position of the last data point
      const x = chart.scales.x.getPixelForValue(
        chart.data.labels[lastPointIndex]
      );
      const y = chart.scales.y.getPixelForValue(lastValue);
      const changeInValue = lastValue - (previousValue || lastValue); // Make sure previousTotal is handled

      // Update the change state
      setPreviousTotal(lastValue);

      setTotal(lastValue.toFixed(2)); // Update the displayed total value
      setChange(changeInValue.toFixed(2)); // Update the displayed change

      ctx.save();
      ctx.font = "bold 12px Arial";

      // Measure text width
      const text = `$${lastValue.toFixed(2)} USD`;
      const textWidth = ctx.measureText(text).width;
      const textHeight = 20; // Approximate height of the text (can be adjusted)

      // Create background for the value (semi-transparent rectangular background)
      ctx.fillStyle = "#ccc"; // White color for background
      ctx.globalAlpha = 0.8; // Set the transparency for the background
      ctx.beginPath();
      // Create a rectangle around the text
      ctx.rect(
        x - textWidth / 2 - 10,
        y - textHeight - 5,
        textWidth + 20,
        textHeight + 10
      );
      ctx.fill();

      // Draw the value text on top of the background
      ctx.fillStyle = color; // Set text color to black for contrast
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"; // Align text vertically in the middle
      ctx.fillText(text, x, y - 10); // Display the value above the point

      ctx.restore();
    },
  };

  return (
    <div className="chart-container">
      <p
        className="current-price"
        style={{ color: priceColor }} // Apply dynamic color for price
      >
        ${total}
      </p>
      <p
        className="price-change"
        style={{
          color: priceColor, // Use dynamic color for text
          width: "80px",
          borderRadius: "8px",
          padding: "5px",
          textAlign: "center",
          backgroundColor: `${priceColor}20`, // Use priceColor with opacity 50% (80 in hex)
        }}
      >
        {change} USD
      </p>

      <Line
        ref={chartRef}
        data={chartData}
        options={options}
        plugins={[displayValueOnPointPlugin]}
      />
      <div className="details">
        <p className="change">8.03</p>
        <p className="time-left">00:28</p>
        <p className="payout">Payout: 0x</p>
        <p className="amount">0 ETH</p>
      </div>
    </div>
  );
};

export default LineChart;
