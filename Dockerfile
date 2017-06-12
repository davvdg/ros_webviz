FROM ros:indigo-ros-base
RUN apt-get update && apt-get install -y python-pip
RUN pip install flask flask-socketio
RUN mkdir /web
EXPOSE 5500 

