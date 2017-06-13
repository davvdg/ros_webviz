var Graph = function(svg, nodes, edges, topics) {
	var self = this;
	self.nodes = nodes || [];
	self.topics = topics || [];
	self.edges = edges || [];
	self.svg = svg.append("g");

	self.boxes = [];
	self.fedges = [];
	var width = 600;
	var height = 600;

	var color = d3.scaleOrdinal(d3.schemeCategory20);


	var strength = -1000;
	self.simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.label; }))
    .force("charge", d3.forceManyBody()
    	.strength(strength)
    	.distanceMax(500).distanceMin(0))
    .force("collision", d3.forceCollide(50));
    //.force("center", d3.forceCenter(width / 2, height / 2));

	self.svgnodes = self.svg.append("g")
		.attr("class", "nodes")
	
	self.svgtopics = self.svg.append("g")
		.attr("class", "topics")	

	self.svglink = self.svg.append("g")
    	.attr("class", "links")	

    self.nodeFilter = [];
    self.topicFilter = ["/clock"];

    self.topicNotConnected = true;

    self.setNodes([]);
    self.setTopics([]);
	self.setEdges([]);
	
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

	self.updateBoxes()
      .on("tick", ticked);


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
	self.boxes = [].concat(self.displayNodes, self.displayTopics);
	return self.simulation.nodes(self.boxes)
}

Graph.prototype.setNodes = function(nodes) {
	var self = this;
	self.nodes = nodes;
	self.displayNodes = self.nodes
	.filter(	function(node) {
		if (self.nodeFilter.indexOf(node.label)>= 0) {
			return false;
		}
		return true;
	});

	var vgNodes = self.svgnodes
					.selectAll("g")
					.data(self.displayNodes, function(d) { return d.label; });

	vgNodes.exit().remove();

	vgNodesG = vgNodes.enter().append("g")
	vgNodesG.call(d3.drag()
			.on("start", self.dragstarted.bind(self))
          	.on("drag", self.dragged.bind(self))
          	.on("end", self.dragended.bind(self))
        );


	vgNodesG
		.append("circle")
		.attr("r", 25)


    vgNodesG
        .append("text")
		.text(function(d) { return d.label; });

}

Graph.prototype.setTopics = function(topics) {
	var self = this;

	self.topics = topics;
	self.displayTopics = self.topics
	.filter(	function(topic) {
		if (self.topicFilter.indexOf(topic.label)>= 0) {
			return false;
		}
		if (self.topicNotConnected && (topic.inputs.length === 0 || topic.outputs.length === 0)) {
			return false;
		}

		return true;
	});
	var vgTopics = self.svgtopics
					.selectAll("g")
					.data(self.displayTopics, function(d) { return d.label; })

	vgTopics.exit().remove();	

	var vgTopicsG = vgTopics.enter().append("g");
	vgTopicsG.call(d3.drag()
			.on("start", self.dragstarted.bind(self))
          	.on("drag", self.dragged.bind(self))
          	.on("end", self.dragended.bind(self))
        );

    vgTopicsG
    	.append("rect")
		.attr("width", 50)
		.attr("height", 50)
		.attr("x", -25)
		.attr("y", -25)

	vgTopicsG.append("text")
      .text(function(d) { return d.label; });

}

Graph.prototype.setGraph = function(graph) {
	var self = this;
	var nodes = graph.nodes.map(function(item) {item.nodeType ="node"; return item;});
	var topics = graph.topics.map(function(item) {item.nodeType ="topic"; return item;});
	var edges = graph.edges;

	var nodesDict = {};
	var topicsDict = {};
	nodes.forEach(function(item) {
		nodesDict[item.label] = item;
		item["outputs"] = [];
		item["inputs"] = [];
	})
	topics.forEach(function(item) {
		topicsDict[item.label] = item;
		item["outputs"] = [];
		item["inputs"] = [];
	})
	edges.forEach(function(edge) {
		s = edge.source
		t = edge.target
		if (nodesDict[s]) {
			nodesDict[s].outputs.push(edge);
		}
		if (topicsDict[s]) {
			topicsDict[s].outputs.push(edge);
		}
		if (nodesDict[t]) {
			nodesDict[t].inputs.push(edge);
		}
		if (topicsDict[t]) {
			topicsDict[t].inputs.push(edge);
		}
	})
	self.setNodes(nodes);
	self.setTopics(topics);
	self.updateBoxes();
	self.setEdges(edges);


}

Graph.prototype.setNodeFilter = function(nodeFilter) {
	var self = this;
	self.nodeFilter = nodeFilter;
	self.setNodes(self.nodes);
	self.updateBoxes();
	self.updateEdges();
}

Graph.prototype.setTopicFilter = function(topicFilter) {
	var self = this;
	self.topicFilter = topicFilter;
	self.setTopics(self.topics);
	self.updateBoxes();
	self.updateEdges();
}

Graph.prototype.updateEdges = function() {
	var self = this;
	self.displayEdges = self.edges.filter(
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
	self.displayEdges = self.displayEdges.map(function(item) {
		item.source = item.sourceL;
		item.target = item.targetL;
		return item
	})
	
	var links = self.svglink
    	.selectAll("line")
    	.data(self.displayEdges, function(d) {return d.sourceL + "-" + d.targetL;});
    
    links
    	.exit().remove();
	
    links
    	.enter()
    	.append("line")
        .attr("stroke-width", 2);
         		
    self.simulation.force("link")
      .links(self.displayEdges);
    self.simulation.alphaTarget(0.01).restart();

}

Graph.prototype.setEdges = function(edges) {
	var self = this;
	self.edges = edges.map(function (item) {
		item["sourceL"] = item.source;
		item["targetL"] = item.target;
		return item;
	});
	self.updateEdges();
}

document.onload = (function() {
	"use strict";
	console.log("haha");
	console.log(d3)
    var svg = d3.select("div#chart")
        .append("svg")




    var graph = new Graph(svg);
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
	window.graph = graph;

	$("#nodefilter").on('input', function (event) {
		var filter = event.currentTarget.value;
		filter = filter.split(";");
		graph.setNodeFilter(filter);
    });

    $("#topicfilter").on('input', function (event) {
		var filter = event.currentTarget.value;
		filter = filter.split(";");
		graph.setTopicFilter(filter);
    });

})(d3);