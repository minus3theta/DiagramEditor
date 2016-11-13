var outXyPic;
var dgm;
var radius;

var conf;

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
    toString() {
        return this.str;
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
        this.theta = Math.atan2(dy, dx);
        this.x0 = x + radius * Math.cos(this.theta);
        this.y0 = y + radius * Math.sin(this.theta);
        this.x1 = x + dx - radius * Math.cos(this.theta);
        this.y1 = y + dy - radius * Math.sin(this.theta);
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
        var l = 20;
        var phi = 0.3;
        c.beginPath();
        c.moveTo(this.x0, this.y0);
        c.lineTo(this.x1, this.y1);
        c.stroke();
        c.beginPath();
        c.moveTo(this.x1, this.y1);
        c.lineTo(this.x1 - l * Math.cos(this.theta + phi),
                 this.y1 - l * Math.sin(this.theta + phi));
        c.stroke();
        c.moveTo(this.x1, this.y1);
        c.lineTo(this.x1 - l * Math.cos(this.theta - phi),
                 this.y1 - l * Math.sin(this.theta - phi));
        c.stroke();
        c.fillText(this.label, (this.x0 + this.x1) / 2, (this.y0 + this.y1) / 2);
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
    select() {
        conf.innerHTML =
            "<input type='text' id='obj_label' onchange='update();'></input>";
    }
}

phina.globalize();

phina.main(function() {
    var app = GameApp({
        startLabel: "main",
        domElement: document.getElementById("world"),
        width: 600,
        height: 600,
        fit: false
    });
    app.run();
});

phina.define("MainScene", {
    superClass: "DisplayScene",
    init: function() {
        this.superInit();
        this.backgroundColor = '#fff';
        outXyPic = document.getElementById("outXyPicContents");
        conf = document.getElementById("object");
        this.dgmWidthElem = document.getElementById("dgmWidth");
        this.dgmHeightElem = document.getElementById("dgmHeight");
        this.dgmWidth = this.dgmWidthElem.value;
        this.dgmHeight = this.dgmHeightElem.value;
        this.reset();
    },
    update: function(app) {
        if(this.dgmWidth != this.dgmWidthElem.value ||
           this.dgmHeight != this.dgmHeightElem.value) {
            this.dgmWidth = this.dgmWidthElem.value;
            this.dgmHeight = this.dgmHeightElem.value;
            this.reset();
        }
        this.write();
    },
    reset: function() {
        radius = (this.dgmWidth < 5 && this.dgmHeight < 6) ? 24 : 18;
        this.gridX = Grid({
            width: 600,
            columns: this.dgmWidth
        });
        this.gridY = Grid({
            width: 600,
            columns: this.dgmHeight
        });
        if(this.dgm) {
            this.dgm.remove();
        }
        this.dgm = Diagram(this.dgmWidth, this.dgmHeight,
                           this.gridX, this.gridY).addChildTo(this);
    },
    write: function() {
        outXyPic.innerHTML = "\\xymatrix{\n"+ this.dgm.toXyPic() +"}";
    }
});

phina.define("Diagram", {
    superClass: "DisplayElement",
    init: function(w, h, gridX, gridY) {
        this.superInit();
        this.w = w;
        this.h = h;
        console.log(h);
        this.objArray = new Array(h);
        for(var i=0; i<h; ++i) {
            this.objArray[i] = new Array(w);
            for(var j=0; j<w; ++j) {
                this.objArray[i][j] =
                    Obj("("+j+","+i+")",
                        gridX.span(j) + gridX.unit() / 2,
                        gridY.span(i) + gridY.unit() / 2)
                    .addChildTo(this);
            }
        }
    },
    toXyPic: function() {
        var s = "";
        for(var i=0; i<this.h; ++i) {
            for(var j=0; j<this.w; ++j) {
                s += this.objArray[i][j].toXyPic();
                if (j != this.w-1) {
                    s += " &amp; ";
                }
            }
            s += " \\\\\n";
        }
        return s;
    },
});

phina.define("Obj", {
    superClass: "RectangleShape",
    init: function(label, x, y) {
        this.superInit({
            width: 100,
            height: 50,
            fill: null,
            stroke: "black",
            cornerRadius: 4,
            x: x,
            y: y,
        });
        this.label = ObjLabel(label).addChildTo(this);
        this.width = this.label.calcCanvasWidth();
    },
    toXyPic: function() {
        return this.label.toXyPic();
    },
});

phina.define("ObjLabel", {
    superClass: "Label",
    init: function(str) {
        this.str = str;
        this.superInit(str);
        this.stroke = "black";
    },
    toXyPic: function() {
        return this.str;
    },
});
