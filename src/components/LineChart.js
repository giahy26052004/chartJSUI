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
  const [total, setTotal] = useState(0);
  const [change, setChange] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const newTime = new Date().toLocaleTimeString().slice(0, 8);
        const newValue =
          prevData.datasets[0].data[prevData.datasets[0].data.length - 1] +
          (Math.random() - 0.5) * 2;
        const newLabels = [...prevData.labels, newTime];
        const newData = [...prevData.datasets[0].data, newValue];

        const lastValue =
          prevData.datasets[0].data[prevData.datasets[0].data.length - 1];
        const newPriceColor = newValue > lastValue ? "#00FF00" : "#FF0000";
        setPriceColor(newPriceColor);

        if (newLabels.length > 10) {
          newLabels.shift();
          newData.shift();
        }

        return {
          labels: newLabels,
          datasets: [{ ...prevData.datasets[0], data: newData }],
        };
      });
    }, 2000);
    drawWithPenEffect();
    return () => clearInterval(interval);
  }, []);

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
        y2: {
          // Second Y axis (left)
          position: "left", // Position it to the left
          title: {
            display: true,
            text: "Current Value",
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
  }, [chartData]); // Only recreate options when chartData changes
  const drawWithPenEffect = () => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setChartData((prevData) => {
        if (currentIndex >= prevData.datasets[0].data.length) {
          clearInterval(interval);
          return prevData;
        }

        const newLabels = [...prevData.labels];
        const newData = [...prevData.datasets[0].data];

        // Only show up to the current index
        const updatedLabels = newLabels.slice(0, currentIndex + 1);
        const updatedData = newData.slice(0, currentIndex + 1);

        return {
          labels: updatedLabels,
          datasets: [
            {
              ...prevData.datasets[0],
              data: updatedData,
            },
          ],
        };
      });

      // Move to the next data point
      currentIndex++;
    }, 4000); // Slower speed (increase from 100ms to 200ms)
  };

  const displayValueOnPointPlugin = {
    id: "displayValueOnPoint",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      const lastPointIndex = dataset.data.length - 1;
      const lastValue = dataset.data[lastPointIndex];

      const previousValue = dataset.data[lastPointIndex - 1] || lastValue;
      const color = lastValue > previousValue ? "#00FF00" : "#FF0000";

      const x = chart.scales.x.getPixelForValue(
        chart.data.labels[lastPointIndex]
      );
      const y = chart.scales.y.getPixelForValue(lastValue);
      const changeInValue = lastValue - (previousValue || lastValue);

      setTotal(lastValue.toFixed(2));
      setChange(changeInValue.toFixed(2));

      ctx.save();
      ctx.font = "bold 12px Arial";
      const text = `$${lastValue.toFixed(2)} USD`;
      const currentText = "Current";
      const textWidth = ctx.measureText(text).width;

      const textHeight = 20;

      ctx.fillStyle = "#ccc";
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.rect(
        x - textWidth / 2 - 10,
        y - textHeight - 5,
        textWidth + 20,
        textHeight + 10
      );
      ctx.fill();

      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y - 10);

      // Draw the "Current" text next to the value
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(currentText, x + textWidth / 2 + 10, y - 10);

      ctx.restore();
    },
  };

  // Custom plugin to draw lines and cross at a specific point
  const drawCrossPlugin = {
    id: "drawCross",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      const targetIndex = dataset.data.length - 2; // Points to the last data point in the dataset

      if (targetIndex < 0) return; // Return if there's no data yet

      // Get the position of the target point (point where the cross should be drawn)
      const x = chart.scales.x.getPixelForValue(chart.data.labels[targetIndex]);
      const y = chart.scales.y.getPixelForValue(dataset.data[targetIndex]);
      // Draw horizontal and vertical lines crossing at the target point
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#fd853a"; // Color of the cross lines

      // Set line dash (for dotted line effect)
      ctx.setLineDash([5, 5]); // Dotted line pattern: 5px line, 5px gap

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chart.height);
      ctx.stroke();

      const textWidth = ctx.measureText("Current").width;
      const textHeight = 10;

      // Draw background box for the text
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.rect(
        x - textWidth / 2 + 40, // Adjust position horizontally
        y - textHeight - 20, // Adjust position vertically
        textWidth + -20, // Width of the box
        textHeight + 36 // Height of the box
      );
      ctx.fill(); // Rotate the canvas to draw "Current" vertically along the Y-axis
      ctx.save();
      ctx.translate(x, y); // Move to the position where we want to draw the text
      ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise

      // Set the color and draw the text
      ctx.fillStyle = "black";
      ctx.textAlign = "center";

      ctx.textBaseline = "middle";
      ctx.fillText("Current", 6, 28); // Draw the text at the new position

      // Restore the canvas context after rotation
      ctx.restore();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chart.width, y);
      ctx.stroke();

      // Draw the target point as a circle
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#00FF00";
      ctx.fill();

      ctx.restore();
    },
  };

  const drawCrossPluginEnd = {
    id: "drawCross",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      const targetIndex = dataset.data.length - 9; // Points to the last data point in the dataset

      if (targetIndex < 0) return; // Return if there's no data yet

      // Get the position of the target point (point where the cross should be drawn)
      const x = chart.scales.x.getPixelForValue(chart.data.labels[targetIndex]);
      const y = chart.scales.y.getPixelForValue(dataset.data[targetIndex]);
      // Draw horizontal and vertical lines crossing at the target point
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#fd853a"; // Color of the cross lines

      // Set line dash (for dotted line effect)
      ctx.setLineDash([5, 5]); // Dotted line pattern: 5px line, 5px gap

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chart.height);
      ctx.stroke();

      const textWidth = ctx.measureText("End").width;
      const textHeight = 10;

      // Draw background box for the text
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.rect(
        x - textWidth / 2 + 26, // Adjust position horizontally
        y - textHeight - 20, // Adjust position vertically
        textWidth + 0, // Width of the box
        textHeight + 36 // Height of the box
      );
      ctx.fill(); // Rotate the canvas to draw "Current" vertically along the Y-axis
      ctx.save();
      ctx.translate(x, y); // Move to the position where we want to draw the text
      ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise

      // Set the color and draw the text
      ctx.fillStyle = "black";
      ctx.textAlign = "center";

      ctx.textBaseline = "middle";
      ctx.fillText("End", 6, 28); // Draw the text at the new position

      // Restore the canvas context after rotation
      ctx.restore();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chart.width, y);
      ctx.stroke();

      // Draw the target point as a circle
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#00FF00";
      ctx.fill();

      ctx.restore();
    },
  };

  return (
    <div className="chart-container">
      <p className="current-price" style={{ color: priceColor }}>
        ${total}
      </p>
      <p className="change">{change} USD</p>
      <Line
        ref={chartRef}
        data={chartData}
        options={options}
        plugins={[
          drawCrossPlugin,
          displayValueOnPointPlugin,
          drawCrossPluginEnd,
        ]} // Use the plugin to draw the cross and lines
      />
    </div>
  );
};

export default LineChart;
