from flask import Flask, render_template
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler
import rosgraph.impl.graph
import json

g = rosgraph.impl.graph.Graph()
g.set_master_stale(5.0)
g.set_node_stale(5.0)

def updateGraph():
	print "updating graph"
	g.update()
	"""
	print "all edges"
	for i in g.nt_all_edges:
		print i
	print "####"
	"""



updateGraph()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['JOBS'] = [
        {
            'id': 'job1',
            'func': updateGraph,
            'trigger': 'interval',
            'seconds': 5
        }
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
	nodeTitles = map(lambda node : {"label":node.strip()}, g.nn_nodes)
	nodeUri = g.node_uri_map
	print nodeUri
	return json.dumps(nodeTitles)

@app.route('/api/gettopics')
def getTopics():
	nodeTitles = map(lambda node : {"label":node.strip()}, g.nt_nodes)
	
	return json.dumps(nodeTitles)

def edgeToDict(edge):
	return {"source": edge.start.strip(), 
			"target": edge.end.strip(), 
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


#socketio = SocketIO(app)

#if __name__ == '__main__':
#    socketio.run(app)