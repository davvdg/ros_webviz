from flask import Flask, render_template
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler
import rosgraph.impl.graph
import rosgraph.masterapi
import json
import os, sys

rosmaster = None
g = None
app_connected = False

_ROS_NAME = '/rosviz' 

app = Flask(__name__)
socketio = SocketIO(app)

def updateGraph():
	if g != None and app_connected:
		print "updating graph"
		updated = g.update()
		if updated:
			print "graph updated"
			out = createGraphJson()
			jout = json.dumps(out)
			socketio.emit('graph_updated', out)
	"""
	print "all edges"
	for i in g.nt_all_edges:
		print i
	print "####"


	"""

def checkConnectivity():
	global app_connected
	global socketio
	global rosmaster
	global g
	status = False
	if rosmaster:
		try:
			status = rosmaster.is_online()
			print status
		except:
			status = False
			g = None
	if status != app_connected:
		print "status changed"
		app_connected = status
		jout = json.dumps({"app_connected": app_connected, "ros_master_uri": os.environ["ROS_MASTER_URI"]})
		socketio.emit("connectivity_changed", jout)
	if app_connected == False:
		g = None

def connectToGraph():
	global rosmaster
	global socketio
	global g
	global app_connected

	if rosmaster == None:
		print "no rosmaster. Attempting connection"
		try:
			rosmaster = rosgraph.masterapi.Master(_ROS_NAME)
			print "ros master created"
		except:
			print "unable to create rosmaster"
	if rosmaster:
		checkConnectivity()
		print app_connected, g
		if app_connected == True and g == None:
			print "ros master is online - connecting to graph"
			g = rosgraph.impl.graph.Graph()
			g.set_master_stale(5.0)	
			g.set_node_stale(5.0)
			g.update()
			out = createGraphJson()
			jout = json.dumps(out)
			socketio.emit('graph_updated', out)


app.config['SECRET_KEY'] = 'secret!'

app.config['JOBS'] = [
        {
            'id': 'updateGraph',
            'func': updateGraph,
            'trigger': 'interval',
            'seconds': 5
        }, 
        {
            'id': 'connectToGraph',
            'func': connectToGraph,
            'trigger': 'interval',
            'seconds': 5
        }, 
    ]
app.config["SCHEDULER_API_ENABLED"] = True
app.static_folder = 'static'
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()



@app.route('/')
def hello_world():
    return app.send_static_file("index.html")

@app.route('/api/getnodes')
def getNodes():
	nodeTitles = map(lambda node : {"label":node}, g.nn_nodes)
	nodeUri = g.node_uri_map
	print nodeUri
	return json.dumps(nodeTitles)

@app.route('/api/gettopics')
def getTopics():
	nodeTitles = map(lambda node : {"label":node}, g.nt_nodes)
	
	return json.dumps(nodeTitles)

def edgeToDict(edge):
	return {"source": edge.start, 
			"target": edge.end, 
			"label":edge.label, 
			"key":edge.key,
			"rkey":edge.rkey}

@app.route('/api/getnnedges')
def getnnEdges():

	edges = map(edgeToDict, g.nn_edges)
	
	return json.dumps(edges)

@app.route('/api/getntedges')
def getntEdges():
	for i in g.nt_edges:
		print i
	edges = map(edgeToDict, g.nt_all_edges)
	
	return json.dumps(edges)

@app.route('/api/getstatus')
def getStatus():
	out = {
		"app_connected": app_connected,
		"ros_master_uri": os.environ["ROS_MASTER_URI"]
	}

	return json.dumps(out)

def createGraphJson():
	edges = map(edgeToDict, g.nt_all_edges)
	nodes = map(lambda node : {"label":node}, g.nn_nodes)
	topics = map(lambda node : {"label":node}, g.nt_nodes)
	out = {
		"edges": edges,
		"nodes": nodes,
		"topics": topics
	}
	return out

@app.route('/api/getgraph')
def getGraph():
	out = {
			"nodes": [],
			"topics": [],
			"edges": [],
		}
	if app_connected:
		out = createGraphJson()

	return json.dumps(out)


#socketio = SocketIO(app)

#if __name__ == '__main__':
#    socketio.run(app)