export FRONTEND_PORT=5500
export BACKEND_PORT=8000

# start the backend. putting it in dev mode means it will reload whenever you change the code
uv run fastapi run --port $BACKEND_PORT backend/app.py &

dotenv set BACKEND_PID $!

# start hosting the frontend
uv run python -m http.server -d frontend $FRONTEND_PORT &

dotenv set FRONTEND_PID $!

# open the frontend in the browser
uv run python -m webbrowser http://127.0.0.1:$FRONTEND_PORT & 

dotenv set BROWSER_PID $!
