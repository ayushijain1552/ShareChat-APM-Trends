"""Local dev entrypoint: python run.py"""

import uvicorn

if __name__ == "__main__":
    # Port 8001 avoids WinError 10013 when 8000 is taken (debugger/old uvicorn)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
