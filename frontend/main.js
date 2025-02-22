async function predict(canvasId) {
    // take the id of the canvas, get the image, pass to backend, receive the prediction
    const canvasData = document.getElementById(canvasId).toDataURL();

    // figure out how to get BACKEND_PORT working for the fetch
    const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: JSON.stringify({
            image: canvasData
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    return data;
}

let first_plot = true;

async function updatePlot(canvasId) {
    // get make a prediction and then update the bar chart
    const predict_response = await predict(canvasId);

    predictions = predict_response.predictions;

    labels = Object.keys(predictions);
    probabilities = Object.values(predictions);

    const data = [{
        x: labels,
        y: probabilities,
        type: 'bar',
    }];

    const layout = {
        yaxis: {
            range: [0, 1],
        },
    };

    if (first_plot) {
        Plotly.newPlot('plotly-test', data, layout);
        first_plot = false;
    }
    else {
        Plotly.react('plotly-test', data, layout);
    }
}

function initCanvas(canvasId) {
    // initialize the canvas and add event listeners so you can draw on it
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    let drawing = false;

    canvas.addEventListener('mousedown', () => {
        drawing = true;
    });

    canvas.addEventListener('mouseup', () => {
        drawing = false;
        ctx.beginPath();
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!drawing) return;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    });

    let lastExecution = 0;
    let delay = 250; // how long to wait before updating the plot again

    canvas.addEventListener('mousemove', (event) => {
        const now = Date.now();
        if (now - lastExecution >= delay) {
            updatePlot(canvasId);
            lastExecution = now;
        }
    });
}

function clearCanvas(canvasId) {
    // clear the canvas
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

initCanvas('canvas');
updatePlot('canvas');
