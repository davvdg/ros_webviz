

var Graph = function(svg, nodes, nodeLinks, topics) {
	var self = this;
	var tnodes = nodes || [];
	var ttopics = topics || [];
	var tnodeLinks = nodeLinks || [];

	self.svg = svg.append("g");

	self.boxes = [];

	/* 
		this will hold the representation of links between nodes
		it is set by computeEdgeDisplayMode.
		it can be either 
			- a node to topic or topic to node representation
			- a node to node representation (avoiding topic node in between)
	*/
	self.edgesRepr = [];
	// this list of edges to display after filtering (either source or display is not visible)
	self.displayEdges = [];

	var strength = -1000;
	self.simulation = d3.forceSimulation()
    	.force("link", 
    		d3.forceLink().id(function(d) { return d.label; })) 		
    	.force("charge", d3.forceManyBody()
    		//.strength(strength)
    		.distanceMax(5000).distanceMin(500))
    	.force("collision", d3.forceCollide(50));
    	//.force("center", d3.forceCenter(width / 2, height / 2));

	self.svgnodes = self.svg.append("g")
		.attr("class", "nodes")
	
	self.svgtopics = self.svg.append("g")
		.attr("class", "topics")	

	self.svglink = self.svg.append("g")
    	.attr("class", "links")	

    self.nodeFilter = [];
    self.topicFilter = [];

    self.topicNotConnected = true;

    self.showTopics = true;

	self.setNodes(tnodes); // nodes are now filtered and displayed
	self.setTopics(ttopics); 
	self.setNodeLinks(tnodeLinks);
	
	self.updateNodeAndTopicDisplay();

	self.simulation.on("tick", ticked);

	self.svg
		.attr("x", 0)
		.attr("y", 0);
	svg
		.call(d3.drag()
			.on("start", self.dragCanvasStarted.bind(self))
          	.on("drag", self.dragCanvasDragged.bind(self))
          	.on("end", self.dragCanvasEnded.bind(self))
        );

	self.svg.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", 10)
    .attr("refY", 5)
    .attr("markerWidth", 13)
    .attr("markerHeight", 13)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,0 L0,10 L10,5 L0,0")
    
  function ticked() {

  	var svgnodes = self.svgnodes
					.selectAll("g");
  	var svgtopics = self.svgtopics
					.selectAll("g");					
	var svglink = self.svglink
					.selectAll("line");					
				
  	function computexy(d) {
  		dx = d.target.x - d.source.x;
  		dy = d.target.y - d.source.y;
  		l = Math.sqrt(dx*dx + dy*dy);
  		dxN = 0;
  		dyN = 0;
  		if (l !== 0) {
	  		dxN = dx / l;
  			dyN = dy / l;
  		}
  		
  		return {x: dxN, y: dyN};
  	}

  	function arrowCoord(d, attr) {

  		c = computexy(d);
  		r = 25;
  		if (d[attr].r) {
  			r = d[attr].r;
  		}
  		if (d[attr].width) {
  			r = d[attr].width;
  		}
  		if (attr === "target") {
  			r = -r;
  		}
  		return {x: d[attr].x + c.x * r, y: d[attr].y + c.y * r};
  	}
    svglink
        .attr("x1", function(d) {return arrowCoord(d, "source").x; })
        .attr("y1", function(d) {return arrowCoord(d, "source").y; })
        .attr("x2", function(d) {return arrowCoord(d, "target").x; })
        .attr("y2", function(d) {return arrowCoord(d, "target").y; });

    svgnodes
		.attr("transform", function(d) {return "translate(" + d.x + "," + d.y+ ")"});

    svgtopics
		.attr("transform", function(d) {return "translate(" + (d.x) + "," + (d.y) + ")"});
  }
}

Graph.prototype.computeEdgeDisplayMode = function() {
	var self = this;
	if (!self.showTopics) {
		// take all topics
		// create a list of edges mapping:
		// all inputs to all outputs
		var directEdges = [];
		self.displayTopics.forEach(function(topic) {
			alli2o = [];
			var i2o = topic.inputs.forEach(function(input) {
				// input is an edge.
				var nodeAtInput = input.source;				
				topic.outputs.forEach(function(output) {
					var nodeAtOutput = output.target;
					alli2o.push( {"source": nodeAtInput, "sourceL": nodeAtInput.label, "targetL": nodeAtOutput.label,"label": topic.label, "target" : nodeAtOutput});
				});
			});
			directEdges = directEdges.concat(alli2o);
		});
		self.edgesRepr = directEdges;
	} else {
		self.edgesRepr = self.nodeLinks;
	}
}

Graph.prototype.dragCanvasStarted = function(d) {
  var self = this;
}
Graph.prototype.dragCanvasDragged = function(d) {
  var self = this;
  var x = Number(self.svg.attr("x"));
  var y = Number(self.svg.attr("y"));
  self.svg.attr("x", (x + d3.event.dx));
  self.svg.attr("y", (y + d3.event.dy));
  self.svg.attr("transform", "translate(" + x + "," + y+ ")");
}
Graph.prototype.dragCanvasEnded = function(d) {
  var self = this;
}

Graph.prototype.dragstarted = function(d) {
  var self = this;
  if (!d3.event.active) self.simulation.alphaTarget(0.1).restart();
  d.fx = d.x;
  d.fy = d.y;
}

Graph.prototype.dragged = function(d) {
  var self = this;
  d.fx = d3.event.x;
  d.fy = d3.event.y;

}

Graph.prototype.dragended = function(d) {
  var self = this;
  if (!d3.event.active) self.simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}


Graph.prototype.updateBoxes = function() {
	var self = this;
	self.boxes = self.displayNodes
	if (self.showTopics) self.boxes = self.boxes.concat(self.displayTopics);
}

Graph.prototype.setNodes = function(nodes) {
	var self = this;
	self.nodesDict = {}
	var tempNodes = nodes.map(function(node) {
		node.nodeType ="node"; 


		

		var oldNode = self.nodes.find(function(item) {return item.label === node.label});
		if (oldNode) {
			node = oldNode; 
		}
		self.nodesDict[node.label] = node;
		node["outputs"] = [];
		node["inputs"] = [];

		return node;
	});

	self.nodes = tempNodes;
}
Graph.prototype.filterDisplayNodes = function(nodes) {	
	var self = this;

	self.displayNodes = self.nodes
	.filter(	function(node) {
		if (self.nodeFilter.indexOf(node.label)>= 0) {
			return false;
		}
		return true;
	});
}
Graph.prototype.renderNodes = function(nodes) {	
	var self = this;
	var vgNodes = self.svgnodes
					.selectAll("g")
					.data(self.displayNodes, function(d) { return d.label; });

	vgNodes.exit()
		.selectAll("circle")
		.transition()
      	.duration(250)
      	.attr("r", 0)
		.remove();

	vgNodes.exit()
		.selectAll("text")
		.transition()
      	.duration(0)
      	.attr("fill-opacity", 0.0)
		.remove();

	vgNodes.exit()
		.transition()
		.duration(250)
		.remove();


	vgNodesG = vgNodes.enter().append("g")
	vgNodesG.call(d3.drag()
			.on("start", self.dragstarted.bind(self))
          	.on("drag", self.dragged.bind(self))
          	.on("end", self.dragended.bind(self))
        );


	vgNodesG
		.append("circle")
		.attr("r", 25)
		.attr("stroke-width", function(d) {
			if (d.inputs.length === 0) {
				return 4;
			} 
			return 1;
		})		


    vgNodesG
        .append("text")
		.text(function(d) { return d.label; })
		.style("text-anchor", "middle");

}

/*
	Merge a new list of topics with the old ones.
	Try to keep the old objects because they are already have simulation values
	avoiding jumps in the display.
*/
Graph.prototype.setTopics = function(topics) {
	var self = this;
	self.topicsDict = {};
	var tempTopics = topics.map(function(node) {
		node.nodeType ="topic"; 


		
		var out = node;
		var oldNode = self.topics.find(function(item) {return item.label === node.label});
		if (oldNode) {
			out = oldNode; 
		}

		out.outputs = [];
		out.inputs = [];
		self.topicsDict[node.label] = out;
		return out;
	});
	self.topics = tempTopics;
}

/*
	We update the connection data between nodes
	This has nothing to do with the display;
	This should always be called AFTER setting nodes and topics
*/
Graph.prototype.setNodeLinks = function(nodeLinks) {
	var self = this;
	// prepare edges
	self.nodeLinks = nodeLinks.map(function (item) {
		item["sourceL"] = item.source;
		item["targetL"] = item.target;
		return item;
	});
	// reset the connections for all nodes
	self.nodes.concat(self.topics).forEach(function(node, i) {
		node.id = i;
		node.inputs = [];
		node.outputs = [];
	})
	self.nodeLinks.forEach(function(link) {
		s = link.source
		t = link.target		
		if (self.nodesDict[s]) {
			link.source = self.nodesDict[s];
			self.nodesDict[s].outputs.push(link);
		}
		if (self.topicsDict[s]) {
			link.source = self.topicsDict[s];
			self.topicsDict[s].outputs.push(link);
		}
		if (self.nodesDict[t]) {
			link.target = self.nodesDict[t];
			self.nodesDict[t].inputs.push(link);
		}
		if (self.topicsDict[t]) {			
			link.target = self.topicsDict[t];
			self.topicsDict[t].inputs.push(link);
		}
	})
}

/* filter which topics should be kept for rendering */
Graph.prototype.filterDisplayTopics = function() {
	var self = this;
	self.displayTopics = self.topics
	.filter(	function(topic) {
		if (self.topicFilter.indexOf(topic.label)>= 0) {
			return false;
		}
		if (self.topicNotConnected && (topic.outputs.length === 0)) {
			return false;
		}

		return true;
	});
}
/*
	Render the topics to display.
*/
Graph.prototype.renderTopics = function() {
	var self = this;
	var data = []
	if (self.showTopics) {
		data = self.displayTopics;
	}
	var vgTopics = self.svgtopics
					.selectAll("g")
					.data(data, function(d) { return d.label; })
	console.log(vgTopics);
	vgTopics.exit()
		.selectAll("rect")
		.transition()
      	.duration(250)
      	.attr("width", 0)
      	.attr("height", 0)
      	.attr("x", 0)
      	.attr("y", 0)
		.remove();

	vgTopics.exit()
		.selectAll("text")
		.transition()
      	.duration(0)
		.remove();

	vgTopics.exit()
		.transition()
      	.duration(250)
      	.remove();	

	var vgTopicsG = vgTopics
						.enter()
						.append("g");

	vgTopicsG.call(d3.drag()
			.on("start", self.dragstarted.bind(self))
          	.on("drag", self.dragged.bind(self))
          	.on("end", self.dragended.bind(self))
        );

	var textNodes = vgTopicsG.append("text")
      .text(function(d) { return d.label; })
      .style("text-anchor", "middle");

    vgTopicsG
    	.append("rect")
		//.attr("width", 50)
		.attr("height", 50)
		.attr('x', function (d, i) {
    		return (textNodes.filter(function (d, j) { 
    			return i === j;
    		}).node().getComputedTextLength()+10) / -2;        		
		})
		.attr("y", -25)
		.attr("stroke-width", function(d) {
			if (d.inputs.length === 0) {
				return 4;
			} 
			return 1;
		})
		.attr('width', function (d, i) {
    		return textNodes.filter(function (d, j) { 
    			return i === j;
    		}).node().getComputedTextLength()+10;        		
		});



}

Graph.prototype.setGraph = function(graph) {
	var self = this;	
	// Data Graph management
	self.setNodes(graph.nodes); // nodes are now filtered and displayed
	self.setTopics(graph.topics); 
	self.setNodeLinks(graph.edges);
	
	self.updateNodeAndTopicDisplay();


}

Graph.prototype.updateNodeAndTopicDisplay = function(value) {
	var self = this;
	self.filterDisplayNodes();
	self.renderNodes();
	self.filterDisplayTopics(); // topics are now filtered
	self.updateEdgesDisplay();
}

Graph.prototype.updateEdgesDisplay = function(value) {
	var self = this;
	self.renderTopics(); // and displayed

	// Edge display management
	self.updateBoxes(); // agregate nodes and topics
	self.computeEdgeDisplayMode();
	self.filterEdges();

	self.renderEdges();
	// Simulation
	self.updateSimulation();
}

Graph.prototype.showTopicsAsEdge = function(value) {
	var self = this;
	self.showTopics = !value;
	self.updateEdgesDisplay(); // and displayed
}

Graph.prototype.setNodeFilter = function(nodeFilter) {
	var self = this;
	self.nodeFilter = nodeFilter;
	self.updateNodeAndTopicDisplay();	
}

Graph.prototype.setTopicFilter = function(topicFilter) {
	var self = this;
	self.topicFilter = topicFilter;
	self.updateNodeAndTopicDisplay();	
}

Graph.prototype.setHideDeadSinkTopics = function(value) {
	var self = this;
	self.topicNotConnected = value;
	self.updateNodeAndTopicDisplay();	
}

Graph.prototype.filterEdges = function() {
	var self = this;
	self.displayEdges = self.edgesRepr.filter(
		function(item) {
			var s = item.sourceL;
			source = self.boxes.find(
				function(elem) {								
					return elem.label === s;
				}
			);

			var t = item.targetL;
			target = self.boxes.find(
				function(elem) {					
					return elem.label === t;
				}
			);
			if (source !== undefined && target!== undefined) {
				return true
			}
			return false;
		}
	);
}

Graph.prototype.renderEdges = function() {
	var self = this;
	var links = self.svglink
    	.selectAll("line")
    	.data(self.displayEdges, function(d) {return d.sourceL + "-" + d.targetL;});
    
    links
    	.exit().remove();
	
    links
    	.enter()
    	.append("line")
        .attr("stroke-width", 2);
}

Graph.prototype.updateSimulation = function() {
	var self = this;
    self.simulation
    	.force("link")
      	.links(self.displayEdges);
	
	self.simulation.nodes(self.boxes)
    
    self.simulation.alphaTarget(0.001).restart();
    return self.simulation;
}

document.onload = (function() {



	"use strict";
	console.log("haha");
	console.log(d3)
    var svg = d3.select("div#chart")
        .append("svg")




    var graph = new Graph(svg);

    var updateStatus = function(statusjson) {
    	console.log(statusjson);
    	var textStatus = "connected";
        if (statusjson.app_connected === false) textStatus = "disconnected";
        $("#masterstatus").val(textStatus);
        $("#masteruri").val(statusjson.ros_master_uri);
    }

	var socket = io.connect('http://' + document.domain + ':' + location.port);
    socket.on('connect', function() {
    	console.log("socketio connected");        
        socket.on("graph_updated", function(graphJson) {
        	console.log("graph_updated")
        	graph.setGraph(graphJson);
        });
        socket.on("connectivity_changed", function(status) {
        	status = JSON.parse(status);
			updateStatus(status);
        	
        });
    });

    /*
	$.getJSON('./api/getnodes', function(data) {         
        graph.setNodes(data);
    });

	$.getJSON('./api/gettopics', function(data) {         
        graph.setTopics(data);
    });
	
	$.getJSON('./api/getntedges', function(data) {         
        graph.setEdges(data);
    });    
	*/
	$.getJSON('./api/getgraph', function(data) {         
        graph.setGraph(data);
    });      
	$.getJSON('./api/getstatus', function(data) {         
        updateStatus(data);
    });      

    updateStatus(status);
	window.graph = graph;

	$("#nodefilter").on('input', function (event) {
		var filter = event.currentTarget.value;
		filter = filter
					.split(" ")
					.map(function(item) {return item.replace(/^\s+|\s+$/g, '')});
		graph.setNodeFilter(filter);
    });

    $("#topicfilter").on('input', function (event) {
		var filter = event.currentTarget.value;
		filter = filter
					.split(" ")
					.map(function(item) {return item.replace(/^\s+|\s+$/g, '')})
					.map(function(item) {return " " + item});
		graph.setTopicFilter(filter);
    });

    $("#hidedeadsinktopics").change('input', function (event) {
		var value = event.target.checked;
		graph.setHideDeadSinkTopics(value);
    });

    $("#showtopicsasedge").change('input', function (event) {
		var value = event.target.checked;
		graph.showTopicsAsEdge(value);
    });

})(d3);