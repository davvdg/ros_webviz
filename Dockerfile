FROM ros:indigo-ros-base
RUN apt-get update && apt-get install -y python-pip
COPY app /web
RUN cd /web && bash setup.bash
EXPOSE 5500 
ENV ROS_MASTER_URI=http://rosmaster:11311
ENTRYPOINT /web/entrypoint.sh
