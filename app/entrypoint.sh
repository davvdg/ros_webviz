#!/bin/bash
source "/opt/ros/$ROS_DISTRO/setup.bash"
cd /web/app
FLASK_APP=app.py flask run --host 0.0.0.0 --port 5500