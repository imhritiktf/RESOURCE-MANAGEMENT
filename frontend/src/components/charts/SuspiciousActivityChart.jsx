import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const SuspiciousActivityChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    // Prepare data for the chart
    const types = ["tooFast", "tooLate", "anomaly"];
    const counts = types.map((type) => data.filter((log) => log.suspiciousActivity.some((activity) => activity.type === type)).length);

    // Create the chart
    const ctx = chartRef.current.getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: types,
        datasets: [
          {
            label: "Suspicious Activity Count",
            data: counts,
            backgroundColor: ["#FFA500", "#FF4500", "#1E90FF"], // Custom colors
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }, [data]);

  return <canvas ref={chartRef}></canvas>;
};

export default SuspiciousActivityChart;