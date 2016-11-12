var canvas;
var cWidth;
var cHeight;
var outXyPic;
var dgm;
var radius;
var fontHeight;

class EdgeStyle {
    constructor(s) {
        this.s = s;             // String
    }
    toXyPic() {
        return this.s;
    }
}

class EdgeLabel {
    constructor(str, pos) {
        this.str = str;         // String
        this.pos = pos;         // String
    }
    toXyPic() {
        return this.pos + "-{" + this.str + "}";
    }
}

class Edge {
    constructor(x, y, stepX, stepY, label, style) {
        this.stepX = stepX;     // Number
        this.stepY = stepY;     // Number
        this.label = label;     // EdgeLabel
        this.style = style;     // EdgeStyle
        var dx = stepX * dgm.dx;
        var dy = stepY * dgm.dy;
        var d = radius / Math.sqrt(dx * dx + dy * dy);
        this.x0 = x + d * dx;
        this.y0 = y + d * dy;
        this.x1 = x + (1 - d) * stepX * dgm.dx;
        this.y1 = y + (1 - d) * stepY * dgm.dy;
    }
    toXyPic() {
        var dir = "";
        if(this.stepX >= 0) {
            dir += "r".repeat(this.stepX);
        } else {
            dir += "l".repeat(-this.stepX);
        }
        if(this.stepY >= 0) {
            dir += "d".repeat(this.stepY);
        } else {
            dir += "u".repeat(-this.stepY);
        }
        return "\\ar[" + dir + "]" + this.style.toXyPic() + this.label.toXyPic();
    }
    draw(c) {
        c.beginPath();
        c.moveTo(this.x0, this.y0);
        c.lineTo(this.x1, this.y1);
        c.stroke();
    }
}

class Node {
    constructor(x, y, label) {
        this.x = x;             // Number
        this.y = y;             // Number
        this.label = label;     // String
        this.edges = [];        // [Edge]
    }
    toXyPic() {
        var s = this.label;
        for(var i=0; i<this.edges.length; ++i) {
            s += " " + this.edges[i].toXyPic();
        }
        return s;
    }
    addEdge() {
        this.edges.push(
            new Edge(this.x,this.y,1,1,new EdgeLabel("f", "^"), new EdgeStyle("")));
    }
    draw(c) {
        var l = c.measureText(this.label).width;
        c.fillText(this.label, this.x - l / 2, this.y);
        var margin = fontHeight / 2;
        c.strokeRect(this.x - l / 2 - margin, this.y - fontHeight / 2 - margin,
                     l + margin * 2, fontHeight + margin * 2);
        this.edges.forEach(function(edge) {
            edge.draw(c);
        });
    }
}

class Diagram {
    constructor(w, h) {
        this.w = w;             // Number
        this.h = h;             // Number
        this.table = new Array(h); // [[Node]]
        this.dx = cWidth / w;
        this.dy = cHeight / h;
        for(var i=0; i<h; ++i) {
            this.table[i] = new Array(w);
            for(var j=0; j<w; ++j) {
                this.table[i][j] =
                    new Node(this.jtox(j), this.itoy(i), "("+i+", "+j+")");
            }
        }
    }
    toXyPic() {
        var s = "";
        for(var i=0; i<this.h; ++i) {
            for(var j=0; j<this.w; ++j) {
                s += this.table[i][j].toXyPic();
                if (j != this.w-1) {
                    s += " &amp; ";
                }
            }
            s += " \\\\\n";
        }
        return s;
    }
    draw(c) {
        c.fillStyle = "white";
        c.fillRect(0, 0, cWidth, cHeight);
        c.fillStyle = "black";
        for(var i=0; i<this.h; ++i) {
            for(var j=0; j<this.w; ++j) {
                this.table[i][j].draw(c);
            }
        }
    }
    jtox(j) {
        return (j+0.5) * this.dx;
    }
    itoy(i) {
        return (i+0.5) * this.dy;
    }
}

function reset() {
    var width = Number(document.getElementById("dgmWidth").value);
    var height = Number(document.getElementById("dgmHeight").value);
    radius = fontHeight = (width < 5 && height < 6) ? 24 : 18;
    canvas.font = fontHeight + "px 'Times New Roman'";
    dgm = new Diagram(width, height);
    dgm.table[0][0].addEdge();
    outXyPic.innerHTML = "\\xymatrix{\n"+ dgm.toXyPic() +"}";
    dgm.draw(canvas);
}

window.addEventListener("load",function(eve){
    var c = document.getElementById("mainc");
    if(!c.getContext) {
        return;
    }
    cWidth = c.width;
    cHeight = c.height;
    canvas = c.getContext("2d");
    canvas.textBaseline = "middle";
    outXyPic = document.getElementById("outXyPicContents");
    reset();
},false);
