#!/bin/bash
source "/opt/ros/$ROS_DISTRO/setup.bash"
#roslaunch rosbridge_server rosbridge_websocket.launch &
export ROS_MASTER_URI=http://rosmaster.ros:11311
cd /web
rosrun rosbridge_server rosbridge_websocket _port:=9090 _ssl:=true _certfile:=certs/server.crt _keyfile:=certs/server.key _authenticate:=false &
python app.py
#FLASK_APP=app.py flask run --host 0.0.0.0 --port 5500 
