frontend_pid=$(dotenv get FRONTEND_PID)
backend_pid=$(dotenv get BACKEND_PID)

if ps -p $frontend_pid > /dev/null; then
    kill $frontend_pid
fi

if ps -p $backend_pid > /dev/null; then
    kill $backend_pid
fi