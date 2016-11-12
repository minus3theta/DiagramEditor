class Edge {
    constructor(dx, dy, label, over) {
        this.dx = dx;
        this.dy = dy;
        this.label = label;
        this.over = over;
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
        return "\\ar[" + dir + "]" + (this.over?"^":"_") +
            "-{" + this.label + "}";
    }
}

class Node {
    constructor(x, y, label) {
        this.x = x;
        this.y = y;
        this.label = label;
        this.edges = [];
    }
    toXyPic() {
        var s = "{" + this.label + "}";
        for(var i=0; i<this.edges.length; ++i) {
            s += " " + this.edges[i].toXyPic();
        }
        return s;
    }
}

class Diagram {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.table = new Array(h);
        for(var i=0; i<h; ++i) {
            this.table[i] = new Array(w);
            for(var j=0; j<w; ++j) {
                this.table[i][j] = new Node(j, i, "hoge");
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
}

window.addEventListener("load",function(eve){
    var output = document.getElementById("output");
    var dgm = new Diagram(2, 2);
    dgm.table[0][0].edges.push(new Edge(1,1,"f", false));
    output.innerHTML = "\\xymatrix{\n"+ dgm.toXyPic() +"}";
},false);
