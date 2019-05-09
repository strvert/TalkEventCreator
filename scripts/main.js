function fitCanvas() {
    let canvas = document.getElementById("nodeEditor");
    canvas.setAttribute("height", window.innerHeight);
    canvas.setAttribute("width", window.innerWidth);
}

window.onload = function () {
    fitCanvas();
};
window.onchange = function () {
    fitCanvas();
};

class NodesController {
    constructor(stage, nodes) {
        this.stage = stage;
        this.line = new createjs.Shape();
        this.stage.addChild(this.line);
        this.nodes = nodes;

        this.addStartNode(500, 100);
        this.addEndNode(500, 500);
    }

    addEndNode(x, y) {
        return this.registerNode(new EndNode(x, y, generateUuid(), this.stage));
    }

    addStartNode(x, y) {
        return this.registerNode(new StartNode(x, y, generateUuid(), this.stage));
    }

    addMessageNode(x, y) {
        return this.registerNode(new MessageNode(x, y, generateUuid(), this.stage));
    }

    addBranchNode(x, y) {
        return this.registerNode(new BranchNode(x, y, generateUuid(), this.stage));
    }

    addEventNode(x, y) {
        return this.registerNode(new EventNode(x, y, generateUuid(), this.stage));
    }

    registerNode(node) {
        this.nodes.push(node);
        return node;
    }
}

class MessageNode {
    constructor(x, y, uuid, stage) {
        // ノード基本情報
        this.type = "message";
        this.sizeX = 150;
        this.sizeY = 50;
        this.x = x;
        this.y = y;
        this.UUID = uuid;
        this.nextNodeUUID = "";
        this.deletable = true;
        this.duplicatable = true;

        this.stage = stage;

        // ノード固有情報
        this.speaker = "";
        this.text = "";

        // 描画情報
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

        this.part_main.addEventListener("mousedown", (evt) => {
            app.selected_node_uuid = this.UUID;
            app.message_node_text = this.text;
            app.message_node_speaker = this.speaker;
        });
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
            this.nextNodeUUID = "";
        });
        this.output.addEventListener("pressmove", (evt) => {
            this.line.graphics.clear();
            app.drawLine(this.x, this.y, this.stage.mouseX+this.stage.regX, this.stage.mouseY+this.stage.regY, this.line);
        });
        this.output.addEventListener("pressup", (evt) => {
            this.line.graphics.clear();
            let under_object = this.stage.getObjectsUnderPoint(this.stage.mouseX+this.stage.regX, this.stage.mouseY+this.stage.regY);
            if (under_object.length >= 1) {
                let uuid = app.getUuidByObject(under_object[0]);
                if (uuid !== null && uuid !== this.UUID) {
                    this.nextNodeUUID = uuid;
                }
            }
        });

        createjs.Ticker.addEventListener("tick", () => {this.update()});
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.input.x = (this.x - this.sizeX*0.8 / 2);
        this.input.y = (this.y - this.sizeY*0.71);

        this.output.x = (this.x - this.sizeX*0.1);
        this.output.y = (this.y + this.sizeY*0.50);

        let nextNode = app.getObjectByUuid(this.nextNodeUUID);
        if (nextNode !== null) {
            this.line.graphics.clear();
            app.drawLine(this.x, this.y, nextNode.x, nextNode.y-20, this.line);
        }
    }

    destroy() {
        this.stage.removeChild(this.part_main);
        this.stage.removeChild(this.input);
        this.stage.removeChild(this.output);
        this.stage.removeChild(this.line);
    }

    breakLink(uuid) {
        if (this.nextNodeUUID === uuid) {
            this.line.graphics.clear();
            this.nextNodeUUID = "";
        }
    }
}

class BranchNode {
    constructor(x, y, uuid, stage) {
        // ノード基本情報
        this.type = "branch";
        this.sizeX = 150;
        this.sizeY = 50;
        this.x = x;
        this.y = y;
        this.UUID = uuid;
        this.nextNodesUUID = ["", "", "", ""];
        this.deletable = true;
        this.duplicatable = true;

        this.stage = stage;

        // ノード固有情報
        this.speaker = "";
        this.choices = ["", "", "", ""];
        this.text = "";

        // 描画情報
        this.part_main = new createjs.Shape();
        this.part_main.graphics.beginFill("#cca1ea");
        this.part_main.graphics.drawRoundRect(0, 0, this.sizeX, this.sizeY, 10);
        this.stage.addChild(this.part_main);

        this.input = new createjs.Shape();
        this.input.graphics.beginFill("#747474");
        this.input.graphics.drawRoundRect(0, 0, this.sizeX*0.8, this.sizeY*0.25, 3);
        this.stage.addChild(this.input);

        this.outputs = [];
        this.offsetsX = [-0.2, 0.01, 0.23, 0.45];
        this.lines = [];
        for (let i = 0; i < 4; i++) {
            this.outputs.push(new createjs.Shape());
            this.outputs[i].graphics.beginFill("#575757");
            this.outputs[i].graphics.drawRoundRect(0, 0, this.sizeX*0.2, this.sizeY*0.25, 3);
            this.stage.addChild(this.outputs[i]);

            this.lines.push(new createjs.Shape());
            this.stage.addChild(this.lines[i]);
            this.stage.setChildIndex(this.lines[i], 0);

            this.outputs[i].addEventListener("mousedown", (evt) => {
                this.nextNodesUUID[i] = "";
            });
            this.outputs[i].addEventListener("pressmove", (evt) => {
                this.lines[i].graphics.clear();
                app.drawLine(this.x-(this.sizeX*this.offsetsX[i])+(this.sizeX*0.1), this.y, this.stage.mouseX+this.stage.regX, this.stage.mouseY+this.stage.regY, this.lines[i]);
            });
            this.outputs[i].addEventListener("pressup", (evt) => {
                this.lines[i].graphics.clear();
                let under_object = this.stage.getObjectsUnderPoint(this.stage.mouseX+this.stage.regX, this.stage.mouseY+this.stage.regY);
                if (under_object.length >= 1) {
                    let uuid = app.getUuidByObject(under_object[0]);
                    if (uuid !== null && uuid !== this.UUID) {
                        this.nextNodesUUID[i] = uuid;
                    }
                }
            });
        }

        this.part_main.addEventListener("mousedown", (evt) => {
            app.selected_node_uuid = this.UUID;
            app.branch_node_choices = this.choices;
            app.message_node_text = this.text;
            app.message_node_speaker = this.speaker;
        });
        this.part_main.addEventListener("pressmove", (evt) => {
            this.x = snap(this.stage.mouseX) + this.stage.regX;
            this.y = snap(this.stage.mouseY) + this.stage.regY;
        });
        this.part_main.addEventListener("pressup", (evt) => {
            console.log(this.UUID);
            console.log(this.nextNodesUUID);
        });

        this.input.addEventListener("pressmove", (evt) => {
            console.log("input");
        });

        createjs.Ticker.addEventListener("tick", () => {this.update()});
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.input.x = (this.x - this.sizeX*0.8 / 2);
        this.input.y = (this.y - this.sizeY*0.71);

        for (let i = 0; i < 4; i++) {
            this.outputs[i].x = (this.x - this.sizeX*this.offsetsX[i]);
            this.outputs[i].y = (this.y + this.sizeY*0.50);
            let nextNode = app.getObjectByUuid(this.nextNodesUUID[i]);
            if (nextNode !== null) {
                this.lines[i].graphics.clear();
                app.drawLine(this.x-(this.sizeX*this.offsetsX[i])+(this.sizeX*0.1), this.y, nextNode.x, nextNode.y-20, this.lines[i]);
            }
        }

    }

    destroy() {
        this.stage.removeChild(this.part_main);
        this.stage.removeChild(this.input);
        for (let i = 0; i < 4; i++) {
            this.stage.removeChild(this.outputs[i]);
            this.stage.removeChild(this.lines[i]);
        }
    }

    breakLink(uuid) {
        this.nextNodesUUID.forEach((nextUuid, i) => {
            if (nextUuid === uuid) {
                this.lines[i].graphics.clear();
                this.nextNodesUUID[i] = "";
            }
        });
    }
}

class EventNode {
    // ノード基本情報
    constructor(x, y, uuid, stage) {
        this.type = "event";
        this.sizeX = 150;
        this.sizeY = 50;
        this.x = x;
        this.y = y;
        this.UUID = uuid;
        this.nextNodeUUID = "";
        this.deletable = true;
        this.duplicatable = true;

        this.stage = stage;

        // ノード固有情報
        this.eventId = -1;

        // 描画情報
        this.line = new createjs.Shape();
        this.stage.addChild(this.line);
        this.stage.setChildIndex(this.line, 0);

        this.part_main = new createjs.Shape();
        this.part_main.graphics.beginFill("#ea6059");
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

        this.part_main.addEventListener("mousedown", (evt) => {
            app.selected_node_uuid = this.UUID;
            app.event_node_event_id = this.eventId;
        });
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
            this.nextNodeUUID = "";
        });
        this.output.addEventListener("pressmove", (evt) => {
            this.line.graphics.clear();
            app.drawLine(this.x, this.y, this.stage.mouseX+this.stage.regX, this.stage.mouseY+this.stage.regY, this.line);
        });
        this.output.addEventListener("pressup", (evt) => {
            this.line.graphics.clear();
            let under_object = this.stage.getObjectsUnderPoint(this.stage.mouseX+this.stage.regX, this.stage.mouseY+this.stage.regY);
            if (under_object.length >= 1) {
                let uuid = app.getUuidByObject(under_object[0]);
                if (uuid !== null && uuid !== this.UUID) {
                    this.nextNodeUUID = uuid;
                }
            }
        });

        createjs.Ticker.addEventListener("tick", () => {this.update()});
    }

    updateOutput() {
        this.output.x = (this.x - this.sizeX*0.1);
        this.output.y = (this.y + this.sizeY*0.50);
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.input.x = (this.x - this.sizeX*0.8 / 2);
        this.input.y = (this.y - this.sizeY*0.71);

        this.output.x = (this.x - this.sizeX*0.1);
        this.output.y = (this.y + this.sizeY*0.50);

        let nextNode = app.getObjectByUuid(this.nextNodeUUID);
        if (nextNode !== null) {
            this.line.graphics.clear();
            app.drawLine(this.x, this.y, nextNode.x, nextNode.y-20, this.line);
        }
    }

    destroy() {
        this.stage.removeChild(this.part_main);
        this.stage.removeChild(this.input);
        this.stage.removeChild(this.output);
        this.stage.removeChild(this.line);
    }

    breakLink(uuid) {
        if (this.nextNodeUUID === uuid) {
            this.line.graphics.clear();
            this.nextNodeUUID = "";
        }
    }
}

class StartNode {
    // ノード基本情報
    constructor(x, y, uuid, stage) {
        this.type = "start";
        this.sizeX = 50;
        this.sizeY = 25;
        this.x = x;
        this.y = y;
        this.UUID = uuid;
        this.nextNodeUUID = "";
        this.deletable = false;
        this.duplicatable = false;

        this.stage = stage;

        // 描画情報
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

        this.part_main.addEventListener("mousedown", (evt) => {
            app.selected_node_uuid = this.UUID;
        });
        this.part_main.addEventListener("pressmove", (evt) => {
            this.x = (snap(this.stage.mouseX) + this.stage.regX);
            this.y = (snap(this.stage.mouseY) + this.stage.regY);
        });
        this.part_main.addEventListener("pressup", (evt) => {
            console.log(this.UUID);
            console.log(this.nextNodeUUID);
        });

        this.output.addEventListener("mousedown", (evt) => {
            this.nextNodeUUID = "";
        });
        this.output.addEventListener("pressmove", (evt) => {
            this.line.graphics.clear();
            app.drawLine(this.x, this.y, this.stage.mouseX+this.stage.regX, this.stage.mouseY+this.stage.regY, this.line);
        });
        this.output.addEventListener("pressup", (evt) => {
            this.line.graphics.clear();
            let under_object = this.stage.getObjectsUnderPoint(this.stage.mouseX+this.stage.regX, this.stage.mouseY+this.stage.regY);
            if (under_object.length >= 1) {
                let object = under_object[0];
                let uuid = app.getUuidByObject(object);
                if (uuid !== null && this.UUID !== uuid) {
                    this.nextNodeUUID = uuid;
                }
            }
        });

        createjs.Ticker.addEventListener("tick", () => {this.update()});
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.output.x = (this.x - this.sizeX*0.24);
        this.output.y = (this.y + this.sizeY*0.50);

        let nextNode = app.getObjectByUuid(this.nextNodeUUID);
        if (nextNode !== null) {
            this.line.graphics.clear();
            app.drawLine(this.x, this.y, nextNode.x, nextNode.y-20, this.line);
        }
    }

    destroy() {
        this.stage.removeChild(this.part_main);
        this.stage.removeChild(this.output);
        this.stage.removeChild(this.line);
    }

    breakLink(uuid) {
        if (this.nextNodeUUID === uuid) {
            this.line.graphics.clear();
            this.nextNodeUUID = "";
        }
    }
}

class EndNode{
    // ノード基本情報
    constructor(x, y, uuid, stage) {
        this.type = "end";
        this.sizeX = 50;
        this.sizeY = 25;
        this.x = x;
        this.y = y;
        this.UUID = uuid;
        this.deletable = false;
        this.duplicatable = false;

        this.stage = stage;

        // 描画情報
        this.part_main = new createjs.Shape();
        this.part_main.graphics.beginFill("#1f1e21");
        this.part_main.graphics.drawRoundRect(0, 0, this.sizeX, this.sizeY, 10);
        this.stage.addChild(this.part_main);

        this.input = new createjs.Shape();
        this.input.graphics.beginFill("#747474");
        this.input.graphics.drawRoundRect(0, 0, this.sizeX*0.5, this.sizeY*0.5, 3);
        this.stage.addChild(this.input);

        this.part_main.addEventListener("mousedown", (evt) => {
            app.selected_node_uuid = this.UUID;
        });
        this.part_main.addEventListener("pressmove", (evt) => {
            this.x = snap(this.stage.mouseX, 15) + this.stage.regX;
            this.y = snap(this.stage.mouseY, 15) + this.stage.regY;
        });
        this.part_main.addEventListener("pressup", (evt) => {
            console.log(this.UUID);
        });

        this.input.addEventListener("pressmove", (evt) => {
            console.log("input");
        });

        createjs.Ticker.addEventListener("tick", () => {this.update()});
    }

    update() {
        this.part_main.x = (this.x - this.sizeX / 2);
        this.part_main.y = (this.y - this.sizeY / 2);

        this.input.x = (this.x - this.sizeX*0.55 / 2);
        this.input.y = (this.y - this.sizeY*0.95);
    }

    destroy() {
        this.stage.removeChild(this.part_main);
        this.stage.removeChild(this.input);
    }

    breakLink(uuid) {
    }
}

let app = new Vue({
    el: '#app',
    data: {
        nodes: [],
        stage: null,
        selected_node_uuid: "none",
        node_controller: null,

        message_node_speaker: "",
        message_node_text: "",
        branch_node_choices: ["", "", "", ""],
        event_node_event_id: -1,
    },
    created: () => {
        createjs.Ticker.framerate = 60;
        this.nodes = [];
    },
    mounted: () => {
        this.stage = new createjs.Stage("nodeEditor");
        createjs.Ticker.addEventListener("tick", this.stage);
        this.node_controller = new NodesController(this.stage, this.nodes);
    },
    methods: {
        scaleUp: () => {
            this.stage.scaleX = this.stage.scaleX + 0.1;
            this.stage.scaleY = this.stage.scaleY + 0.1;
        },
        scaleDown: () => {
            this.stage.scaleX = this.stage.scaleX - 0.1;
            this.stage.scaleY = this.stage.scaleY - 0.1;
        },
        moveStage: (x, y) => {
            this.stage.regX = this.stage.regX + x;
            this.stage.regY = this.stage.regY + y;
        },
        addMessageNode: () => {
            this.node_controller.addMessageNode(this.stage.mouseX-500+this.stage.regX, this.stage.mouseY+50+this.stage.regY);
        },
        addBranchNode: () => {
            this.node_controller.addBranchNode(this.stage.mouseX-500+this.stage.regX, this.stage.mouseY+50+this.stage.regY);
        },
        addEventNode: () => {
            this.node_controller.addEventNode(this.stage.mouseX-500+this.stage.regX, this.stage.mouseY+50+this.stage.regY);
        },
        changeMessage: function() {
            let obj = this.getObjectByUuid(this.selected_node_uuid);
            if (obj !== null) {
                obj.text = this.message_node_text;
            }
        },
        changeChoices: function() {
            let obj = this.getObjectByUuid(this.selected_node_uuid);
            if (obj !== null) {
                obj.choices = this.branch_node_choices;
            }
        },
        changeEventId: function() {
            let obj = this.getObjectByUuid(this.selected_node_uuid);
            if (obj !== null) {
                obj.eventId = this.event_node_event_id;
            }
        },
        changeSpeaker: function() {
            let obj = this.getObjectByUuid(this.selected_node_uuid);
            if (obj !== null) {
                obj.speaker = this.message_node_speaker;
            }
        },
        getUuidByObject: (obj) => {
            let uuid = null;
            this.nodes.forEach((node) => {
                if (node.input === obj) {
                    uuid = node.UUID;
                }
            });
            return uuid;
        },
        getObjectByUuid: (uuid) => {
            let obj = null;
            this.nodes.forEach((node) => {
                if (node.UUID === uuid) {
                    obj = node;
                }
            });
            return obj;
        },
        drawLine: (x1, y1, x2, y2, line) => {
            line.graphics.beginStroke("#768cff");
            line.graphics.setStrokeStyle(3);
            if (y1 <= y2) {
                line.graphics.moveTo(x1, y1+25);
                //line.graphics.lineTo(x1, y1+(y2-y1)/2);
                //line.graphics.lineTo(x2, y1+(y2-y1)/2);
                line.graphics.lineTo(x2, y2);
            } else {
                line.graphics.moveTo(x1, y1);
                line.graphics.lineTo(x1, y1 + 50);
                line.graphics.lineTo(x1 + (x2 - x1) / 2, y1 + 50);
                line.graphics.lineTo(x1 + (x2 - x1) / 2, y2 - 50);
                line.graphics.lineTo(x2, y2 - 50);
                line.graphics.lineTo(x2, y2);
            }
        },
        deleteNodeByUuid: (uuid) => {
            let obj = null;
            this.nodes.forEach((node) => {
                if (node.UUID === uuid) {
                    obj = node;
                }
            });
            console.log(obj);
            if (obj !== null) {
                obj.destroy();
                this.nodes.forEach((node) => {
                    node.breakLink(uuid);
                });
            }

            console.log(this.nodes);
            this.nodes = this.nodes.filter((n) => {
                if (n.UUID !== uuid){
                    return n;
                }
            });
            this.node_controller.nodes = this.nodes;
            console.log(this.nodes);
        },
        deleteNode: function() {
            this.deleteNodeByUuid(this.selected_node_uuid);
        },
        duplicateNode: function() {

        },
        generateTalkEventText: () => {
            let doneNodes = new Set();
            function getNodeObjectByType(type) {
                let obj = null;
                this.nodes.forEach((node, i) => {
                    if (node.type === type) {
                        obj = node;
                    }
                });
                return obj;
            }
            function getObjectByUUID(uuid) {
                let obj = null;
                this.nodes.forEach((node) => {
                    if (node.UUID === uuid) {
                        obj = node;
                    }
                });
                return obj;
            }
            function getUUIDByObject(obj) {
                let uuid = null;
                this.nodes.forEach((node) => {
                    if (node.input === obj) {
                        uuid = node.UUID;
                    }
                });
                return uuid;
            }
            function formatNextNodeUUID(uuid) {
                let node = getObjectByUUID(uuid);
                if (node.type === "end") {
                    return 'end';
                }
                return uuid;
            }
            function readNodeGraph(startUUID, depth = 0) {
                let currentNode = getObjectByUUID(startUUID);
                let text = "";
                while (true) {
                    if (currentNode.type === "end") {
                        console.log(currentNode.type);
                        return text;
                    } else if (currentNode.type === "start") {
                        console.log(currentNode.type);
                        text += ",operator,next,data,pos\n";
                        currentNode = getObjectByUUID(currentNode.nextNodeUUID);
                    } else if (currentNode.type === "message") {
                        console.log(currentNode.type);
                        if (! doneNodes.has(currentNode.UUID)) {
                            text += currentNode.UUID + "," + currentNode.type + "," +
                                formatNextNodeUUID(currentNode.nextNodeUUID) + "," + currentNode.speaker + "|" + currentNode.text + "," +
                                currentNode.x + ":" + currentNode.y + '\n';
                            doneNodes.add(currentNode.UUID);
                        }
                        currentNode = getObjectByUUID(currentNode.nextNodeUUID);
                    } else if (currentNode.type === "event") {
                        console.log(currentNode.type);
                        if (! doneNodes.has(currentNode.UUID)) {
                            text += currentNode.UUID + "," + currentNode.type + "," +
                                formatNextNodeUUID(currentNode.nextNodeUUID) + "," + currentNode.eventId + "," +
                                currentNode.x + ":" + currentNode.y + '\n';
                            doneNodes.add(currentNode.UUID);
                        }
                        currentNode = getObjectByUUID(currentNode.nextNodeUUID);
                    } else if (currentNode.type === "branch") {
                        console.log(currentNode.type);
                        if (!doneNodes.has(currentNode.UUID)) {
                            text += currentNode.UUID + "," + currentNode.type + ",";
                            for (let i = 0; i < 4; i++) {
                                let tempText = currentNode.nextNodesUUID[i];
                                if (tempText !== "") {
                                    text += formatNextNodeUUID(tempText);
                                }
                                if (i < 3) {
                                    text += ":"
                                } else {
                                    text += ","
                                }
                            }
                            text += currentNode.speaker + '|' + currentNode.text + '|';
                            for (let i = 0; i < 4; i++) {
                                text += currentNode.choices[i];
                                if (i < 3) {
                                    text += ":"
                                } else {
                                    text += ",";
                                }
                            }
                            text += currentNode.x + ":" + currentNode.y + '\n';
                            doneNodes.add(currentNode.UUID);
                        }
                        for (let i = 0; i < 4; i++) {
                            if (currentNode.nextNodesUUID[i] !== "") {
                                text += readNodeGraph(currentNode.nextNodesUUID[i], depth+1);
                            }
                        }
                        if (depth === 0) {
                            console.log("ReadFinish");
                            break;
                        } else {
                            return text;
                        }
                    } else {
                        text += "undefinedNode;\n";
                    }
                }
                return text;
            }
            let text = "ERROR";
            let startNode = getNodeObjectByType("start");
            let endNode = getNodeObjectByType("end");
            text = readNodeGraph(startNode.UUID);
            return text;
        },
        deleteAllNodes: () => {
            this.nodes.forEach((node) => {
                if (node.type !== "start" && node.type !== "end") {
                    let obj = node;
                    if (obj !== null) {
                        obj.destroy();
                        this.nodes.forEach((n) => {
                            n.breakLink(node.UUID);
                        });
                    }

                    console.log(this.nodes);
                    this.nodes = this.nodes.filter((n) => {
                        if (n.UUID !== node.UUID){
                            return n;
                        }
                    });
                    this.node_controller.nodes = this.nodes;
                }
            });
        },
        exportCSV: function () {
            let filename = "file.csv";
            let content = this.generateTalkEventText();
            console.log(content);
            let blob = new Blob([ content ], { "type" : "text/plain" });
            window.URL = window.URL || window.webkitURL;
            let link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        },
        importCSV: function (e) {
            this.deleteAllNodes();
            let reader = new FileReader();
            reader.readAsText(e.target.files[0]);
            let texts = [];
            reader.onload = (evt)=> {
                let text = evt.target.result.toString();
                texts = text.split('\n');
                texts.shift();
                texts.pop();

                this.addNodeFromArray(texts);
            };
        },
        addNodeFromArray: (arr)=> {
            arr.forEach((row, i) => {
                let data = row.split(',');
                let pos = data[4].split(':');
                let addedNode = null;
                console.log(data);
                switch (data[1]) {
                    case "branch":
                        addedNode = this.node_controller.addBranchNode(parseInt(pos[0]), parseInt(pos[1]));
                        addedNode.UUID = data[0];
                        let branchData = data[3].split('|');
                        addedNode.speaker = branchData[0];
                        addedNode.text = branchData[1];
                        addedNode.choices = branchData[2].split(':');
                        let nextNodesUUID = data[2].split(':');
                        nextNodesUUID.forEach((uuid, i) => {
                            if (uuid === "end") {
                                addedNode.nextNodesUUID[i] = this.nodes[1].UUID;
                            } else {
                                addedNode.nextNodesUUID[i] = uuid;
                            }
                        });

                        break;
                    case "event":
                        console.log(pos[0], pos[1]);
                        addedNode = this.node_controller.addEventNode(parseInt(pos[0]), parseInt(pos[1]));
                        addedNode.UUID = data[0];
                        if (data[2] === "end") {
                            addedNode.nextNodeUUID = this.nodes[1].UUID;
                        } else {
                            addedNode.nextNodeUUID = data[2];
                        }
                        addedNode.eventId =  parseInt(data[3]);
                        break;
                    case "message":
                        addedNode = this.node_controller.addMessageNode(parseInt(pos[0]), parseInt(pos[1]));
                        addedNode.UUID = data[0];
                        if (data[2] === "end") {
                            addedNode.nextNodeUUID = this.nodes[1].UUID;
                        } else {
                            addedNode.nextNodeUUID = data[2];
                        }
                        let messageData = data[3].split('|');
                        addedNode.speaker = messageData[0];
                        addedNode.text = messageData[1];
                        break;
                }
                if (i === 0) {
                    this.nodes[0].nextNodeUUID = data[0];
                }
            });
        }

    },
    computed: {
        selected_node_type: function () {
            let obj = this.getObjectByUuid(this.selected_node_uuid);
            let type = "none";
            if (obj !== null) {
                type = obj.type;
            }
            return type;
        },
        selected_node_deletable: function () {
            let obj = this.getObjectByUuid(this.selected_node_uuid);
            let deletable = false;
            if (obj !== null) {
                deletable = obj.deletable;
            }
            return deletable;
        },
        selected_node_duplicatable: function () {
            let obj = this.getObjectByUuid(this.selected_node_uuid);
            let duplicatable = false;
            if (obj !== null) {
                duplicatable = obj.deletable;
            }
            return duplicatable;
        }
    }
});
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
