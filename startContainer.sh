#!/bin/bash
docker run  -ti -v $(pwd)/app:/web --rm --name rosbridge -h rosbridge.ros --env ROS_MASTER_URI="http://172.17.0.4:11311" -p 5500:5500 -p 9090:9090 --dns $(docker inspect -f '{{.NetworkSettings.IPAddress}}' dns) rosbridge

