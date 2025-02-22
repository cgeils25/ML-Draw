async function predict(canvasId) {
    // take the id of the canvas, get the image, pass to backend, receive the prediction
    const canvasData = document.getElementById(canvasId).toDataURL();

    // figure out how to get BACKEND_PORT working for the fetch. it's in env
    const response = await fetch('http://127.0.0.1:8000/predict', {
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
        Plotly.newPlot('prediction-plot', data, layout);
        first_plot = false;
    }
    else {
        Plotly.animate('prediction-plot', {
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

function randomize() {
    Plotly.animate('myDiv', {
      data: [{y: [Math.random(), Math.random(), Math.random()]}],
      traces: [0],
      layout: {}
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
        ctx.lineWidth = 20;
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

