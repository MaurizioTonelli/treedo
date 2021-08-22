const Application = PIXI.Application;
const loader = PIXI.loader;
const resources = PIXI.loader.resources;
const Sprite = PIXI.Sprite;
const utils = PIXI.utils;
const Rectangle = PIXI.Rectangle;
const Graphics = PIXI.Graphics;
const Texture = PIXI.Texture;

const APP_WIDTH = 600;
const APP_HEIGHT = 600;

const GRID_UNIT_SIZE = APP_HEIGHT / 6;
const X_OFFSET = APP_HEIGHT / 6;

const tree = [
  {
    name: "parent todo task",
    type: "general",
    color: 0x000000,
    id: 1,
    parent: null,
    children: [
      {
        name: "Child todo task",
        type: "educational",
        color: 0x000000,
        id: 2,
        parent: 1,
        children: [
          {
            name: "Child todo task",
            type: "educational",
            color: 0x000000,
            id: 3,
            parent: 2,
            children: [],
          },
          {
            name: "Child todo task 2",
            type: "decision",
            color: 0x000000,
            id: 4,
            parent: 2,
            children: [],
          },
        ],
      },
      {
        name: "Child todo task 2",
        type: "decision",
        color: 0x000000,
        id: 5,
        parent: 1,
        children: [
          {
            name: "Child todo task",
            type: "educational",
            color: 0x000000,
            id: 6,
            parent: 5,
            children: [
              {
                name: "Child todo task",
                type: "educational",
                color: 0x000000,
                id: 7,
                parent: 6,
                children: [
                  {
                    name: "Child todo task",
                    type: "educational",
                    color: 0x000000,
                    id: 8,
                    parent: 7,
                    children: [],
                  },
                  {
                    name: "Child todo task 2",
                    type: "decision",
                    color: 0x000000,
                    id: 9,
                    parent: 7,
                    children: [],
                  },
                ],
              },
              {
                name: "Child todo task 2",
                type: "decision",
                color: 0x000000,
                id: 10,
                parent: 6,
                children: [
                  {
                    name: "Child todo task",
                    type: "educational",
                    color: 0x000000,
                    id: 11,
                    parent: 10,
                    children: [],
                  },
                  {
                    name: "Child todo task 2",
                    type: "decision",
                    color: 0x000000,
                    id: 12,
                    parent: 10,
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            name: "Child todo task 2",
            type: "decision",
            color: 0x000000,
            id: 13,
            parent: 5,
            children: [
              {
                name: "Child todo task",
                type: "educational",
                color: 0x000000,
                id: 14,
                parent: 13,
                children: [],
              },
              {
                name: "Child todo task 2",
                type: "decision",
                color: 0x000000,
                id: 15,
                parent: 13,
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
];

function getNodeYCoordinate(upperYBound, lowerYBound, familySize, nodeIndex) {
  return (
    lowerYBound +
    ((upperYBound - lowerYBound) / (familySize + 1)) * (nodeIndex + 1)
  );
}

function getChildrenBounds(upperYBound, lowerYBound, familySize, nodeIndex) {
  return {
    upperYBound:
      lowerYBound +
      ((upperYBound - lowerYBound) / familySize) * (nodeIndex + 1),
    lowerYBound:
      lowerYBound + ((upperYBound - lowerYBound) / familySize) * nodeIndex,
  };
}

class Drawing {
  static drawLine(stage, fromX, fromY, toX, toY, width) {
    let line = new Graphics();
    line.lineStyle(width, 0x995522);
    line.moveTo(fromX, fromY);
    line.lineTo(toX, toY);
    stage.addChild(line);
  }
  static getLineTexture() {
    let line = new Graphics();
    line.lineStyle(width, 0x666666, width);
    line.moveTo(fromX, fromY);
    line.lineTo(toX, toY);
    return line.generateTexture();
  }
  static getCircleTexture(color, level) {
    let circle = new Graphics();
    circle.beginFill(color);
    circle.drawCircle(0, 0, (5 - level) * 6);
    circle.endFill();
    return circle.generateTexture();
  }
}

class TreeMemento {
  static currentTree;
  static currentTreeGraph;
  static currentRootNode = 1;
}

class Node {
  stage;
  nodeInfo;
  children = [];
  level = 0; //level is expressed in GRID_UINT size
  y = 0; //y is expressed in pixels
  upperYBound = 0; //maximum y coordinate allowed for node positioning
  lowerYBound = 0; //minimum y coordinate allowed for node positioning
  nodesInLevel = 0;
  sprite;

  constructor(
    stage,
    nodeInfo,
    children,
    level,
    y,
    upperYBound,
    lowerYBound,
    nodesInLevel
  ) {
    this.stage = stage;
    this.nodeInfo = nodeInfo;
    this.level = level;
    this.y = y;
    this.upperYBound = upperYBound;
    this.lowerYBound = lowerYBound;
    this.nodesInLevel = nodesInLevel;

    children.forEach((node, index) => {
      this.children.push(
        new Node(
          this.stage,
          node,
          node.children,
          this.level + 1,
          getNodeYCoordinate(
            this.upperYBound,
            this.lowerYBound,
            children.length,
            index
          ),
          getChildrenBounds(
            this.upperYBound,
            this.lowerYBound,
            this.nodesInLevel,
            index
          ).upperYBound,
          getChildrenBounds(
            this.upperYBound,
            this.lowerYBound,
            this.nodesInLevel,
            index
          ).lowerYBound,
          node.children.length
        )
      );
      Drawing.drawLine(
        this.stage,
        this.level * GRID_UNIT_SIZE + X_OFFSET,
        this.y,
        (this.level + 1) * GRID_UNIT_SIZE + X_OFFSET,
        getNodeYCoordinate(
          this.upperYBound,
          this.lowerYBound,
          children.length,
          index
        ),
        (5 - this.level) * 0.6
      );
    });
  }

  createSprite() {
    return new Sprite(
      Drawing.getCircleTexture(this.nodeInfo.color, this.level)
    );
  }
  setUpSprite() {
    this.sprite.x =
      this.level * GRID_UNIT_SIZE + X_OFFSET - this.sprite.width / 2;
    this.sprite.y = this.y - this.sprite.height / 2;
    this.sprite.boundsPadding = 0;
    this.sprite.interactive = true;
    this.addSpriteListeners();
  }

  addSpriteListeners() {
    this.sprite.on("pointerdown", (e) => {
      if (this.level === 0 && this.nodeInfo.parent) {
        TreeMemento.currentTreeGraph.renderSubTree(this.nodeInfo.parent);
        TreeMemento.currentRootNode = this.nodeInfo.parent;
        return;
      }
      TreeMemento.currentTreeGraph.renderSubTree(this.nodeInfo.id);
      TreeMemento.currentRootNode = this.nodeInfo.id;
    });
    this.sprite.on("mouseover", (e) => {
      this.sprite.alpha = 0.5;
      document.body.style.cursor = "pointer";
    });
    this.sprite.on("mouseout", (e) => {
      this.sprite.alpha = 1;
      document.body.style.cursor = "default";
    });
  }

  render() {
    this.sprite = this.createSprite();
    this.setUpSprite();
    this.stage.addChild(this.sprite);
    this.children.forEach((child) => {
      child.render();
    });
  }
}

class TreeGraph {
  nodes = [];
  stage;
  constructor(stage, nodes) {
    this.stage = stage;
    nodes.forEach((node, index) => {
      this.nodes.push(
        new Node(
          this.stage,
          node,
          node.children,
          0,
          getNodeYCoordinate(APP_HEIGHT, 0, nodes.length, index),
          APP_HEIGHT,
          0,
          node.children.length
        )
      );
    });
  }

  render() {
    this.nodes.forEach((node) => {
      node.render();
    });
  }

  getSubtreeWithId(id) {
    let queue = [...TreeMemento.currentTree];
    while (queue.length) {
      if (queue[0].id === id) {
        return queue[0];
      }
      queue[0].children.forEach((childNode) => {
        queue.push(childNode);
      });
      queue.splice(0, 1);
    }
    return false;
  }

  getTreeNodeCount() {
    let queue = [...TreeMemento.currentTree];
    let count = 0;
    while (queue.length) {
      queue[0].children.forEach((childNode) => {
        queue.push(childNode);
      });
      queue.splice(0, 1);
      count += 1;
    }
    return count;
  }

  auxiliaryPerformAction(node, id) {
    if (node.id == id) {
      node.children.push({
        name: "Stupid as fuck node",
        type: "educational",
        color: 0x000000,
        id: this.getTreeNodeCount() + 1,
        parent: id,
        children: [],
      });
      this.renderSubTree(id);
    }
    for (let i = 0; i < node.children.length; i++) {
      this.auxiliaryPerformAction(node.children[i], id);
    }
  }

  addNode(id) {
    this.auxiliaryPerformAction(TreeMemento.currentTree[0], id);
  }

  renderSubTree(id) {
    let subtree = this.getSubtreeWithId(id);
    this.clear();
    let newTree = new TreeGraph(app.stage, [subtree]);
    newTree.render();
  }

  clear() {
    for (var i = this.stage.children.length - 1; i >= 0; i--) {
      this.stage.removeChild(this.stage.children[i]);
    }
  }
}

function initMemento(tree, treeGraph) {
  TreeMemento.currentTree = tree;
  TreeMemento.currentTreeGraph = treeGraph;
}

const addNodeButton = document.getElementById("add-node");
addNodeButton.addEventListener("click", (e) => {
  e.preventDefault();
  TreeMemento.currentTreeGraph.addNode(TreeMemento.currentRootNode);
});

let app = new Application({
  width: APP_WIDTH,
  height: APP_HEIGHT,
  antialias: true,
  transparent: true,
});

document.body.appendChild(app.view);

let treeGraph = new TreeGraph(app.stage, tree);
initMemento(tree, treeGraph);

treeGraph.render();
