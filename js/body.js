var canvas;
var cWidth;
var cHeight;
var outXyPic;
var dgm;

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
    constructor(dx, dy, label, style) {
        this.dx = dx;           // Number
        this.dy = dy;           // Number
        this.label = label;     // EdgeLabel
        this.style = style;     // EdgeStyle
    }
    toXyPic() {
        var dir = "";
        if(this.dx >= 0) {
            dir += "r".repeat(this.dx);
        } else {
            dir += "l".repeat(-this.dx);
        }
        if(this.dy >= 0) {
            dir += "d".repeat(this.dy);
        } else {
            dir += "u".repeat(-this.dy);
        }
        return "\\ar[" + dir + "]" + this.style.toXyPic() + this.label.toXyPic();
    }
    draw(c, x, y, pitch) {
        return this;
    }
}

class Node {
    constructor(i, j, label) {
        this.i = i;             // Number
        this.j = j;             // Number
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
    draw(c, pitch, marginX, marginY) {
        var l = c.measureText(this.label).width;
        var x = this.i * pitch + marginX;
        var y = this.j * pitch + marginY;
        c.fillText(this.label, x - l / 2, y);
        this.edges.forEach(function(edge) {
            edge.draw(c, x, y, pitch);
        });
    }
}

class Diagram {
    constructor(w, h) {
        this.w = w;             // Number
        this.h = h;             // Number
        this.table = new Array(h); // [[Node]]
        for(var i=0; i<h; ++i) {
            this.table[i] = new Array(w);
            for(var j=0; j<w; ++j) {
                this.table[i][j] = new Node(j, i, "("+i*10000+", "+j+")");
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
                this.table[i][j].draw(c, 200, 50, 50);
            }
        }
    }
    select(elem) {
        elem.innerHTML;
    }
}

function reset() {
    var width = Number(document.getElementById("dgmWidth").value);
    var height = Number(document.getElementById("dgmHeight").value);
    dgm = new Diagram(width, height);
    dgm.table[0][0].edges.push(
        new Edge(1,1,new EdgeLabel("f", "^"), new EdgeStyle("")));
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
    canvas.font = "24px 'Times New Roman'";
    outXyPic = document.getElementById("outXyPicContents");
    reset();
},false);
