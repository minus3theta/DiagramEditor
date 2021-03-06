var outXyPic;
var preview;
var objConf;
var edgeConf;
var macros;

var FONT_SIZE = 24;
var FRAME_SIZE = 36;
var FONT_FAMILY = "'Source Code Pro', monospace";

escapeString = function(str) {
    return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

phina.globalize();

phina.main(function() {
    var app = GameApp({
        startLabel: "main",
        domElement: document.getElementById("world"),
        width: 600,
        height: 600,
        fit: false,
    });
    app.run();
});

phina.define("MainScene", {
    superClass: "DisplayScene",
    init: function() {
        this.superInit();
        this.backgroundColor = '#fff';
        outXyPic = document.getElementById("outXyPicContents");
        preview = document.getElementById("preview");
        objConf = document.getElementById("object");
        edgeConf = document.getElementById("edge");
        macros = document.getElementById("macros");
        document.getElementById("copyXyPic").onclick = function(e) {
            outXyPic.select();
            document.execCommand("copy");
        };
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
    },
    reset: function() {
        this.gridX = Grid({
            width: 600,
            columns: this.dgmWidth
        });
        this.gridY = Grid({
            width: 600,
            columns: this.dgmHeight
        });
        if(this.dgm) {
            this.dgm.unselectObj();
            this.dgm.unselectEdge();
            this.dgm.remove();
            preview.innerHTML = "";
        }
        this.dgm = Diagram(this.dgmWidth, this.dgmHeight,
                           this.gridX, this.gridY).addChildTo(this);
        this.dgm.write();
        var self = this;
        macros.onchange = function() {
            self.dgm.write();
        };
    },
});

phina.define("Diagram", {
    superClass: "Shape",
    init: function(w, h, gridX, gridY) {
        this.superInit({
            originX: 0,
            originY: 0,
            width: 600,
            height: 600,
            backgroundColor: "white",
            stroke: "black",
            strokeWidth: 8,
        });
        this.w = w;
        this.h = h;
        this.objs = new Array(h);
        for(var i=0; i<h; ++i) {
            this.objs[i] = new Array(w);
            for(var j=0; j<w; ++j) {
                this.objs[i][j] =
                    Obj("", i, j,
                        gridX.span(j) + gridX.unit() / 2,
                        gridY.span(i) + gridY.unit() / 2)
                    .addChildTo(this);
            }
        }
        this.onenterframe = function(e) {
            this.p = e.app.pointer;
        };
        this.release = function(src) {
            var dst = null;
            var p = this.p;
            this.children.forEach(function(o) {
                if(o.hitTest(this.p.position.x, this.p.position.y)) {
                    dst = o;
                }
            }, this);
            if(src == dst) {
                this.unselectObj();
                src.select();
            } else if(dst != null) {
                src.addEdge(dst, "", "^", "");
            }
        };
        this.setInteractive(true);
    },
    toXyPic: function() {
        var s = "";
        for(var i=0; i<this.h; ++i) {
            for(var j=0; j<this.w; ++j) {
                s += this.objs[i][j].toXyPic();
                if (j != this.w-1) {
                    s += " &amp; ";
                }
            }
            s += " \\\\\n";
        }
        return s;
    },
    unselectObj: function() {
        this.children.forEach(function(o) {
            o.fill = null;
        });
        objConf.innerHTML = "";
    },
    unselectEdge: function() {
        this.children.forEach(function(o) {
            o.edges.children.forEach(function(e) {
                e.frame.fill = "white";
            });
        });
        edgeConf.innerHTML = "";
    },
    write: function() {
        var xy = "\\xymatrix{\n" + this.toXyPic() + "}";
        outXyPic.innerHTML = xy;
        preview.innerHTML = "\\(\n" + macros.value + xy + "\\)";
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "preview"]);
    },
});

phina.define("Obj", {
    superClass: "RectangleShape",
    init: function(text, i, j, x, y) {
        this.superInit({
            width: FRAME_SIZE,
            height: FRAME_SIZE,
            fill: null,
            stroke: "black",
            strokeWidth: 2,
            cornerRadius: 4,
            x: x,
            y: y,
        });
        this.i = i;
        this.j = j;
        this.label = Label({
            text: text,
            fontSize: FONT_SIZE,
            fontFamily: FONT_FAMILY,
        }).addChildTo(this);
        this.width = Math.max(this.label.calcCanvasWidth(), FRAME_SIZE);
        this.edges = DisplayElement().addChildTo(this);
        this.setInteractive(true);
        this.onpointend = function() {
            this.parent.release(this);
        }
    },
    toXyPic: function() {
        var s = "{" + escapeString(this.label.text) + "}";
        this.edges.children.forEach(function(e) {
            s += e.toXyPic();
        });
        return s;
    },
    select: function() {
        this.fill = "#c0c0ff";
        objConf.innerHTML = "<table><tr><td>Label</td>" +
            "<td><input type='text' id='objLabel' value='" +
            escapeString(this.label.text) +
            "'></td></tr></table>";
        var o = this;
        document.getElementById("objLabel").focus();
        objConf.onchange = function() {
            o.label.text = document.getElementById("objLabel").value;
            o.width = Math.max(o.label.calcCanvasWidth(), FRAME_SIZE);
            o.parent.write();
        };
    },
    addEdge: function(dst, text, pos, style) {
        var e = Edge(this, dst, text, pos, style);
        e.addChildTo(this.edges);
        this.parent.write();
    },
});

phina.define("Edge", {
    superClass: "DisplayElement",
    init: function(src, dst, text, pos, style) {
        this.superInit();
        var dx = dst.x - src.x;
        var dy = dst.y - src.y;
        var r = 30;
        this.theta = Math.atan2(dy, dx);
        this.x0 = r * Math.cos(this.theta);
        this.y0 = r * Math.sin(this.theta);
        this.x1 = dx - r * Math.cos(this.theta);;
        this.y1 = dy - r * Math.sin(this.theta);;
        this.stepI = dst.i - src.i;
        this.stepJ = dst.j - src.j;
        this.frame = RectangleShape({
            width: FRAME_SIZE,
            height: FRAME_SIZE,
            fill: "white",
            stroke: "gray",
            strokeWidth: 2,
            cornerRadius: 4,
            x: dx / 2,
            y: dy / 2,
        }).addChildTo(this);
        this.label = Label({
            text: text,
            fontSize: FONT_SIZE,
            fontFamily: FONT_FAMILY,
        }).addChildTo(this.frame);
        this.frame.width = Math.max(this.label.calcCanvasWidth(), FRAME_SIZE);
        this.pos = pos;
        this.style = style;
        this.frame.setInteractive(true);
        var e = this;
        this.frame.onpointstart = function() {
            src.parent.unselectEdge();
            e.select(src);
        };
        src.parent.unselectEdge();
        this.select(src);
    },
    select: function(obj) {
        this.frame.fill = "#c0ffc0";
        edgeConf.innerHTML = "<table><tr><td>Label</td>" +
            "<td><input type='text' id='edgeLabel' value='" +
            escapeString(this.label.text) +
            "'></td></tr><tr><td>Position</td>" +
            "<td><label><input type='radio' name='edgePos' id='edgePos^' value='^'" +
            (this.pos === "^" ? " checked" : "") + ">^</label>" +
            "<label><input type='radio' name='edgePos' id='edgePos_' value='_'" +
            (this.pos === "_" ? " checked" : "") + ">_</label>" +
            "</tr><tr><td>Style</td>" +
            "<td><input type='text' id='edgeStyle' value='" +
            this.style + "'></td></tr><tr><td colspan='2'>" +
            "<input type='button' id='edgeDel' value='Delete'></td></tr></table>";
        var e = this;
        document.getElementById("edgeLabel").focus();
        document.getElementById("edgeDel").onclick = function() {
            e.remove();
            obj.parent.unselectEdge();
            obj.parent.write();
        }
        edgeConf.onchange = function() {
            e.label.text = document.getElementById("edgeLabel").value;
            e.frame.width = Math.max(e.label.calcCanvasWidth(), FRAME_SIZE);
            if(document.getElementById("edgePos^").checked) {
                e.pos = "^";
            } else {
                e.pos = "_";
            }
            e.style = document.getElementById("edgeStyle").value;
            e.parent.parent.parent.write();
        };
    },
    toXyPic: function() {
        var dir = "";
        if(this.stepI >= 0) {
            dir += "d".repeat(this.stepI);
        } else {
            dir += "u".repeat(-this.stepI);
        }
        if(this.stepJ >= 0) {
            dir += "r".repeat(this.stepJ);
        } else {
            dir += "l".repeat(-this.stepJ);
        }
        return " \\ar" + escapeString(this.style) + "[" + dir + "]" +
            escapeString(this.pos) +
            "-{" + escapeString(this.label.text) + "}";
    },
    draw: function(canvas) {
        canvas.drawArrow(this.x0, this.y0, this.x1, this.y1, 10);
    },
});
