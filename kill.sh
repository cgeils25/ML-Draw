frontend_pid=$(dotenv get FRONTEND_PID)
backend_pid=$(dotenv get BACKEND_PID)
browser_pid=$(dotenv get BROWSER_PID)

if ps -p $frontend_pid > /dev/null; then
    kill $frontend_pid
    echo "Killed the frontend"
fi

if ps -p $browser_pid > /dev/null; then
    kill $browser_pid
    echo "Killed the browser"
fi

if ps -p $backend_pid > /dev/null; then
    kill $backend_pid
    echo "Killed the backend"
fi
