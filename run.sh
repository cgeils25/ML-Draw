export FRONTEND_PORT=5500
export BACKEND_PORT=8000 # for now this can't be changed because the frontend is hardcoded to use this port

# start hosting the frontend
uv run python -m http.server -d frontend $FRONTEND_PORT &

# open the frontend in the browser
uv run python -m webbrowser http://127.0.0.1:$FRONTEND_PORT/frontend/index.html &

# start the backend. putting it in dev mode means it will reload whenever you change the code
uv run fastapi dev --port $BACKEND_PORT backend/app.py


