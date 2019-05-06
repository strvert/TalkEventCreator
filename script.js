window.onresize = function () {
    fitCanvasSize();
};

window.addEventListener("load", init);

function fitCanvasSize() {
    let canvas = document.getElementById("nodeEditor");
    canvas.setAttribute("width", window.innerWidth);
    canvas.setAttribute("height", window.innerHeight);
}

function init() {
    fitCanvasSize();

    let stage = new createjs.Stage("nodeEditor");
    stage.addEventListener("click", (evt) => {
        console.log(stage.mouseX, stage.mouseY);
    });
    createjs.Ticker.framerate = 60;

    let node_controller = new NodesController(stage);

    let addMessageNode = new createjs.DOMElement(document.getElementById("AddMessageNode"));
    addMessageNode.htmlElement.onclick = function() {
        node_controller.addMessageNode(stage.mouseX+stage.regX-300, stage.mouseY+30);
    };
    let addBranchNode = new createjs.DOMElement(document.getElementById("AddBranchNode"));
    addBranchNode.y = 1000;
    addBranchNode.htmlElement.onclick = function() {
        node_controller.addBranchNode(stage.mouseX+stage.regX-300, stage.mouseY+30);
    };

    createjs.Ticker.addEventListener("tick", stage);
    createjs.Ticker.addEventListener("tick", handleTick);
    function handleTick() {
        node_controller.updateAll();
    }
}

nodes = [];
function getUuidByObject(obj) {
    let uuid = null;
    nodes.forEach((node) => {
        if (node.input === obj) {
            uuid = node.UUID;
        }
    });
    return uuid;
}
function getObjectByUuid(uuid) {
    let object = null;
    nodes.forEach((node) => {
        if (node.UUID === uuid) {
            object = node;
        }
    });
    return object;
}

class NodesController {
    constructor(stage) {
        this.stage = stage;
        this.line = new createjs.Shape();
        this.stage.addChild(this.line);

        this.addStartNode(500, 100);
        this.addEndNode(500, 500);
    }

    addEndNode(x, y) {
        this.registerNode(new EndNode(x, y, generateUuid(), this.stage));
    }

    addStartNode(x, y) {
        this.registerNode(new StartNode(x, y, generateUuid(), this.stage));
    }

    addMessageNode(x, y) {
        this.registerNode(new MessageNode(x, y, generateUuid(), this.stage));
    }

    addBranchNode(x, y) {
        this.registerNode(new BranchNode(x, y, generateUuid(), this.stage));
    }

    registerNode(node) {
        nodes.push(node);
    }

    updateAll() {
        nodes.forEach((node) => {
            node.update();
        })
    }
}

class MessageNode {
    constructor(x, y, uuid, stage) {
        this.type = "message";
        this.sizeX = 150;
        this.sizeY = 50;
        this.x = x;
        this.y = y;
        this.UUID = uuid;
        this.nextNodeUUID = null;

        this.stage = stage;

        this.line = new createjs.Shape();
        this.stage.addChild(this.line);
        this.stage.setChildIndex(this.line, 0);

        this.part_main = new createjs.Shape();
        this.part_main.graphics.beginFill("#7fdcea");
        this.part_main.graphics.drawRoundRect(0, 0, this.sizeX, this.sizeY, 10);
        this.stage.addChild(this.part_main);

        this.input = new createjs.Shape();
        this.input.graphics.beginFill("#747474");
        this.input.graphics.drawRoundRect(0, 0, this.sizeX*0.8, this.sizeY*0.25, 3);
        this.stage.addChild(this.input);

        this.output = new createjs.Shape();
        this.output.graphics.beginFill("#575757");
        this.output.graphics.drawRoundRect(0, 0, this.sizeX*0.2, this.sizeY*0.25, 3);
        this.stage.addChild(this.output);

        this.part_main.addEventListener("pressmove", (evt) => {
            this.x = snap(this.stage.mouseX) + this.stage.regX;
            this.y = snap(this.stage.mouseY) + this.stage.regY;
        });
        this.part_main.addEventListener("pressup", (evt) => {
            console.log(this.UUID);
            console.log(this.nextNodeUUID);
        });

        this.input.addEventListener("pressmove", (evt) => {
            console.log("input");
        });

        this.output.addEventListener("mousedown", (evt) => {
            this.nextNodeUUID = null;
        });
        this.output.addEventListener("pressmove", (evt) => {
            this.line.graphics.clear();
            drawLine(this.x, this.y, this.stage.mouseX, this.stage.mouseY, this.line);
        });
        this.output.addEventListener("pressup", (evt) => {
            this.line.graphics.clear();
            let under_object = stage.getObjectsUnderPoint(stage.mouseX, stage.mouseY);
            if (under_object.length >= 1) {
                let uuid = getUuidByObject(under_object[0]);
                if (uuid !== null && uuid !== this.UUID) {
                    this.nextNodeUUID = uuid;
                }
            }
        });
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.input.x = (this.x - this.sizeX*0.8 / 2);
        this.input.y = (this.y - this.sizeY*0.71);

        this.output.x = (this.x - this.sizeX*0.1);
        this.output.y = (this.y + this.sizeY*0.50);

        let nextNode = getObjectByUuid(this.nextNodeUUID);
        if (nextNode !== null) {
            this.line.graphics.clear();
            drawLine(this.x, this.y, nextNode.x, nextNode.y-20, this.line);
        }
    }

}

class BranchNode {
    constructor(x, y, uuid, stage) {
        this.type = "branch";
        this.sizeX = 150;
        this.sizeY = 50;
        this.x = x;
        this.y = y;
        this.UUID = uuid;
        this.nextNodeUUID = null;

        this.stage = stage;

        this.line = new createjs.Shape();
        this.stage.addChild(this.line);
        this.stage.setChildIndex(this.line, 0);

        this.part_main = new createjs.Shape();
        this.part_main.graphics.beginFill("#cca1ea");
        this.part_main.graphics.drawRoundRect(0, 0, this.sizeX, this.sizeY, 10);
        this.stage.addChild(this.part_main);

        this.input = new createjs.Shape();
        this.input.graphics.beginFill("#747474");
        this.input.graphics.drawRoundRect(0, 0, this.sizeX*0.8, this.sizeY*0.25, 3);
        this.stage.addChild(this.input);

        this.output = new createjs.Shape();
        this.output.graphics.beginFill("#575757");
        this.output.graphics.drawRoundRect(0, 0, this.sizeX*0.2, this.sizeY*0.25, 3);
        this.stage.addChild(this.output);

        this.part_main.addEventListener("pressmove", (evt) => {
            this.x = snap(this.stage.mouseX) + this.stage.regX;
            this.y = snap(this.stage.mouseY) + this.stage.regY;
        });
        this.part_main.addEventListener("pressup", (evt) => {
            console.log(this.UUID);
            console.log(this.nextNodeUUID);
        });

        this.input.addEventListener("pressmove", (evt) => {
            console.log("input");
        });

        this.output.addEventListener("mousedown", (evt) => {
            this.nextNodeUUID = null;
        });
        this.output.addEventListener("pressmove", (evt) => {
            this.line.graphics.clear();
            drawLine(this.x, this.y, this.stage.mouseX, this.stage.mouseY, this.line);
        });
        this.output.addEventListener("pressup", (evt) => {
            this.line.graphics.clear();
            let under_object = stage.getObjectsUnderPoint(stage.mouseX, stage.mouseY);
            if (under_object.length >= 1) {
                let uuid = getUuidByObject(under_object[0]);
                if (uuid !== null && uuid !== this.UUID) {
                    this.nextNodeUUID = uuid;
                }
            }
        });
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.input.x = (this.x - this.sizeX*0.8 / 2);
        this.input.y = (this.y - this.sizeY*0.71);

        this.output.x = (this.x - this.sizeX*0.1);
        this.output.y = (this.y + this.sizeY*0.50);

        let nextNode = getObjectByUuid(this.nextNodeUUID);
        if (nextNode !== null) {
            this.line.graphics.clear();
            drawLine(this.x, this.y, nextNode.x, nextNode.y-20, this.line);
        }
    }

}

class StartNode {
    constructor(x, y, uuid, stage) {
        this.type = "start";
        this.sizeX = 50;
        this.sizeY = 25;
        this.x = x;
        this.y = y;
        this.UUID = uuid;
        this.nextNodeUUID = null;

        this.stage = stage;

        this.line = new createjs.Shape();
        this.stage.addChild(this.line);
        this.stage.setChildIndex(this.line, 0);

        this.part_main = new createjs.Shape();
        this.part_main.graphics.beginFill("#eabb7d");
        this.part_main.graphics.drawRoundRect(0, 0, this.sizeX, this.sizeY, 10);
        this.stage.addChild(this.part_main);

        this.output = new createjs.Shape();
        this.output.graphics.beginFill("#575757");
        this.output.graphics.drawRoundRect(0, 0, this.sizeX*0.5, this.sizeY*0.5, 3);
        this.stage.addChild(this.output);

        this.part_main.addEventListener("pressmove", (evt) => {
            this.x = snap(this.stage.mouseX) + this.stage.regX;
            this.y = snap(this.stage.mouseY) + this.stage.regY;
        });
        this.part_main.addEventListener("pressup", (evt) => {
            console.log(this.UUID);
            console.log(this.nextNodeUUID);
        });

        this.output.addEventListener("mousedown", (evt) => {
            this.nextNodeUUID = null;
        });
        this.output.addEventListener("pressmove", (evt) => {
            this.line.graphics.clear();
            drawLine(this.x, this.y, this.stage.mouseX, this.stage.mouseY, this.line);
        });
        this.output.addEventListener("pressup", (evt) => {
            this.line.graphics.clear();
            let under_object = stage.getObjectsUnderPoint(stage.mouseX, stage.mouseY);
            if (under_object.length >= 1) {
                let object = under_object[0];
                let uuid = getUuidByObject(object);
                if (uuid !== null && this.UUID !== uuid) {
                    this.nextNodeUUID = uuid;
                }
            }
        });
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.output.x = (this.x - this.sizeX*0.24);
        this.output.y = (this.y + this.sizeY*0.50);

        let nextNode = getObjectByUuid(this.nextNodeUUID);
        if (nextNode !== null) {
            this.line.graphics.clear();
            drawLine(this.x, this.y, nextNode.x, nextNode.y-20, this.line);
        }
    }
}

class EndNode{
    constructor(x, y, uuid, stage) {
        this.type = "end";
        this.sizeX = 50;
        this.sizeY = 25;
        this.x = x;
        this.y = y;
        this.UUID = uuid;

        this.stage = stage;

        this.part_main = new createjs.Shape();
        this.part_main.graphics.beginFill("#1f1e21");
        this.part_main.graphics.drawRoundRect(0, 0, this.sizeX, this.sizeY, 10);
        this.stage.addChild(this.part_main);

        this.input = new createjs.Shape();
        this.input.graphics.beginFill("#747474");
        this.input.graphics.drawRoundRect(0, 0, this.sizeX*0.5, this.sizeY*0.5, 3);
        this.stage.addChild(this.input);

        this.part_main.addEventListener("pressmove", (evt) => {
            this.x = snap(this.stage.mouseX, 15) + this.stage.regX;
            this.y = snap(this.stage.mouseY, 15) + this.stage.regY;
        });
        this.part_main.addEventListener("pressup", (evt) => {
            console.log(this.UUID);
            console.log(this.nextNodeUUID);
        });

        this.input.addEventListener("pressmove", (evt) => {
            console.log("input");
        });
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.input.x = (this.x - this.sizeX*0.55 / 2);
        this.input.y = (this.y - this.sizeY*0.95);
    }

}

function generateUuid() {
    let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
    for (let i = 0, len = chars.length; i < len; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
}

function snap(num, snap=15) {
    return Math.round(num/snap)*snap;
}

function  drawLine(x1, y1, x2, y2, line) {
    line.graphics.beginStroke("#768cff");
    line.graphics.setStrokeStyle(3);
    if (y1 <= y2) {
        line.graphics.moveTo(x1, y1+25);
        //line.graphics.lineTo(x1, y1+(y2-y1)/2);
        //line.graphics.lineTo(x2, y1+(y2-y1)/2);
        line.graphics.lineTo(x2, y2);
    } else {
        line.graphics.moveTo(x1, y1);
        line.graphics.lineTo(x1, y1+50);
        line.graphics.lineTo(x1+(x2-x1)/2, y1+50);
        line.graphics.lineTo(x1+(x2-x1)/2, y2-50);
        line.graphics.lineTo(x2, y2-50);
        line.graphics.lineTo(x2, y2);
    }
}
