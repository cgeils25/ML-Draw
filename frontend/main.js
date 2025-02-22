async function predict(smiles) {
    const predictEndpoint = 'http://127.0.0.1:8000/predict'
    const response = await fetch(`${predictEndpoint}?smiles=${smiles}`)
    const data = await response.json()
    return data
}

const backend_enpoint = 'http://127.0.0.1:8000'

async function predict(canvasId) {
    // take the id of the canvas, get the image, pass to backend, receive the prediction
    const canvasData = document.getElementById(canvasId).toDataURL();

    // do something with this maybe?
    const base64_string = canvasData.split(',')[1]

    // figure out how to get BACKEND_PORT working for the fetch. it's in env
    const response = await fetch(`${backend_enpoint}/predict?image_base64_string=${base64_string}`, {
        method: 'POST',
        body: JSON.stringify({
            image_base64_string: base64_string
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    return data;
}

let first_plot = true;

async function updatePlot(labels, probabilities, model_name, plot_id, first_plot=true)  {
    const data = [{
        x: labels,
        y: probabilities,
        type: 'bar',
    }];

    const layout = {
        autosize: false,
        width: 500,
        height: 500,

        title: {text: `Model Predictions (${model_name})`},
        
        yaxis: {
            range: [0, 1],
            title: {text: 'Predicted Probability'}
        },

        xaxis: {
            title: {text: 'Digit'},
            tickvals: labels,
        },
    };

    if (first_plot) {
        Plotly.newPlot(plot_id, data, layout);
        first_plot = false;
    }
    else {
        Plotly.animate(plot_id, {
            data: [{y: probabilities}],
            traces: [0],
            layout: layout
          }, {
            transition: {
              duration: 500,
              easing: 'cubic-in-out'
            },
            frame: {
              duration: 500
            }
          })
    }
}

async function updatePlots(canvasId) {
    // get make a prediction and then update the bar chart
    const predict_response = await predict(canvasId);

    predictions = predict_response.predictions;

    lr_predictions = predictions.lr;
    rf_predictions = predictions.rf;

    updatePlot(labels=Object.keys(lr_predictions), probabilities=Object.values(lr_predictions), 'Logistic Regression', 'lr-prediction-plot', first_plot);
    updatePlot(labels=Object.keys(rf_predictions), Object.values(rf_predictions), 'Random Forest', 'rf-prediction-plot', first_plot);

    first_plot = false;
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
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    });

    canvas.addEventListener('mouseleave', () => {
        drawing = false;
        ctx.beginPath();
    });

    let lastExecution = 0;
    let delay = 400; // how long to wait before updating the plot again

    canvas.addEventListener('mousemove', (event) => {
        const now = Date.now();

        // only update if it has been at least delay ms since the last update and we are currently drawing
        if (now - lastExecution >= delay && drawing) {
            updatePlots(canvasId);
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
updatePlots('canvas');

// animate pressing the clear button
document.getElementById('clear-button').addEventListener('click', function() {
    this.style.transform = 'scale(0.8)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 100);
    });
