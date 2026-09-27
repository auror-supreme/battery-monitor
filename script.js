document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('voltageChart').getContext('2d');

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
            x: {
                type: 'linear',
                title: { display: true, text: 'Cumulative Time [s]', font: { size: 12, family: 'Inter' }, color: '#94a3b8' },
                min: 0,
                max: 120,
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' }
            },
            y: {
                title: { display: true, text: 'Voltage [V] / Current [A]', font: { size: 12, family: 'Inter' }, color: '#94a3b8' },
                min: 3.10,
                max: 4.05,
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' }
            }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        elements: { 
            line: { borderWidth: 2, tension: 0.3 }, // Slightly thicker, smoother curves
            point: { radius: 0 } 
        }
    };

    const data = {
        datasets: [
            { label: 'Solar Input', borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)', fill: true, data: [] },
            { label: 'Battery Pack', borderColor: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.15)', fill: true, data: [] },
            { label: 'Inverter Load', borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.15)', fill: true, data: [] }
        ]
    };

    const voltageChart = new Chart(ctx, { type: 'line', data: data, options: chartOptions });

    let currentTime = 0;
    let isConnected = false;
    let v1 = 3.95, v2 = 3.65, v3 = 3.35;

    function generateDataPoint() {
        let drift1 = (Math.random() - 0.5) * 0.02;
        let drift2 = (Math.random() - 0.5) * 0.015;
        let drift3 = (Math.random() - 0.5) * 0.01;

        const suddenDrop = Math.random() > 0.9 ? 0.08 : 0; 
        const suddenRecovery = Math.random() > 0.9 ? 0.08 : 0; 
        
        v1 += drift1 - 0.002 - suddenDrop + suddenRecovery;
        v2 += drift2 - 0.001 - (suddenDrop * 0.5) + (suddenRecovery * 0.5);
        v3 += drift3 - 0.001 - (suddenDrop * 0.8) + (suddenRecovery * 0.8);

        v1 = Math.max(3.75, Math.min(4.00, v1));
        v2 = Math.max(3.45, Math.min(3.75, v2));
        v3 = Math.max(3.10, Math.min(3.45, v3));

        return [v1, v2, v3];
    }

    function updateChart() {
        if (!isConnected) return; // Do nothing if not connected yet

        const [newV1, newV2, newV3] = generateDataPoint();
        
        voltageChart.data.datasets[0].data.push({ x: currentTime, y: newV1 });
        voltageChart.data.datasets[1].data.push({ x: currentTime, y: newV2 });
        voltageChart.data.datasets[2].data.push({ x: currentTime, y: newV3 });

        if (currentTime > 120) {
            voltageChart.options.scales.x.min = currentTime - 120;
            voltageChart.options.scales.x.max = currentTime;
            
            voltageChart.data.datasets.forEach(dataset => {
                while(dataset.data.length > 0 && dataset.data[0].x < currentTime - 120) {
                    dataset.data.shift();
                }
            });
        }

        // Update current values in table to look like live telemetry
        document.getElementById('val-solar').innerText = newV1.toFixed(2);
        document.getElementById('val-battery').innerText = newV2.toFixed(2);
        document.getElementById('val-load').innerText = newV3.toFixed(2);

        voltageChart.update();
        currentTime += 0.5;
    }

    // Attempt telemetry update every 500ms
    setInterval(updateChart, 500);

    // Hidden trigger to start the simulation
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'k' && !isConnected) {
            isConnected = true;
            
            // Remove the overlay to reveal the chart
            document.getElementById('chartOverlay').classList.add('hidden');
            
            // Update the connection status indicator
            const statusIndicator = document.getElementById('connectionStatus');
            statusIndicator.innerText = "Online";
            statusIndicator.classList.add('online');

            // Populate table with active status text
            document.getElementById('status-solar').innerText = "Active";
            document.getElementById('status-battery').innerText = "Discharging";
            document.getElementById('status-load').innerText = "Active";

            // Update checkmarks to active green color in dark mode
            const checks = document.querySelectorAll('.icon-check');
            checks.forEach(check => {
                check.innerText = "✔";
                check.style.backgroundColor = "var(--color-green)";
                check.style.color = "#0f172a";
            });
        }
    });
});
