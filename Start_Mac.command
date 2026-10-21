#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 was not found. Install Python 3, then launch this file again."
  read -r -p "Press Return to close..."
  exit 1
fi
python3 "$PWD/server.py"
launch_status=$?
if [ "$launch_status" -ne 0 ]; then
  read -r -p "Startup failed. Copy the error above. Press Return to close..."
fi
exit "$launch_status"
