const Application = PIXI.Application;
const loader = PIXI.loader;
const resources = PIXI.loader.resources;
const Sprite = PIXI.Sprite;
const utils = PIXI.utils;
const Rectangle = PIXI.Rectangle;
const Graphics = PIXI.Graphics;
const Texture = PIXI.Texture;
const Container = PIXI.Container;

const APP_WIDTH = window.innerWidth;
const APP_HEIGHT = window.innerHeight - 51;

const GRID_UNIT_SIZE = APP_WIDTH / 4.5;
const X_OFFSET = APP_HEIGHT / 6;

const tree = [];

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

function getPriorityColor(priority) {
  switch (priority) {
    case "0":
      return "green";
    case "2":
      return "blue";
    case "5":
      return "yellow";
    case "10":
      return "orange";
    case "18":
      return "red";
    default:
      return "black";
  }
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
  static getCircleTexture(color, level, priority) {
    let circle = new Graphics();
    circle.beginFill(color);
    circle.drawCircle(0, 0, (5 - level) * 7 + parseInt(priority));
    circle.endFill();
    return circle.generateTexture();
  }

  static getAdministrativeTaskSprite(level, iconName, priority) {
    let id = loader.resources["images/icons.json"].textures;
    let sprite = new Sprite(id[iconName + ".png"]);
    sprite.width = (5 - level) * 7 + parseInt(priority);
    sprite.height = (5 - level) * 7 + parseInt(priority);
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.x = sprite.width;
    sprite.y = sprite.height;
    sprite.scale.x =
      0.07 *
      (((5 - level) * 7 + parseInt(priority)) / (30 + parseInt(priority)));
    sprite.scale.y =
      0.07 *
      (((5 - level) * 7 + parseInt(priority)) / (30 + parseInt(priority)));

    return sprite;
  }
}

class AppMemento {
  static app;
}

class TreeMemento {
  static currentTree = [];
  static currentTreeGraph = [];
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
      Drawing.getCircleTexture(
        this.nodeInfo.color,
        this.level,
        this.nodeInfo.priority
      )
    );
  }
  setUpSprite(sprite) {
    sprite.x = this.level * GRID_UNIT_SIZE + X_OFFSET - sprite.width / 2;
    sprite.y = this.y - sprite.height / 2;
    sprite.boundsPadding = 0;
    sprite.interactive = true;
    this.addSpriteListeners(sprite);
  }

  addSpriteListeners(sprite) {
    sprite.on("click", (e) => {
      if (this.level === 0 && this.nodeInfo.parent) {
        TreeMemento.currentTreeGraph.renderSubTree(this.nodeInfo.parent);
        TreeMemento.currentRootNode = this.nodeInfo.parent;
        return;
      }
      TreeMemento.currentTreeGraph.renderSubTree(this.nodeInfo.id);
      TreeMemento.currentRootNode = this.nodeInfo.id;
    });
    sprite.on("mouseover", (e) => {
      let tooltip = document.getElementById("tooltip");
      tooltip.style.display = "block";
      let tooltipText = document.getElementById("tooltip-text");
      let tooltipPriority = document.getElementById("tooltip-priority");
      tooltipText.textContent = this.nodeInfo.name;
      tooltipPriority.style.backgroundColor = getPriorityColor(
        this.nodeInfo.priority
      );
      let tooltipStatus = document.getElementById("tooltip-status");
      tooltipStatus.textContent = this.nodeInfo.status;
      tooltipStatus.style.color =
        "#" +
        String(this.nodeInfo.color).substring(
          2,
          String(this.nodeInfo.color).length
        );
      let tooltipDescription = document.getElementById("tooltip-description");
      tooltipDescription.textContent = this.nodeInfo.description;
      sprite.alpha = 0.5;
      document.body.style.cursor = "pointer";
    });
    sprite.on("rightclick", (e) => {
      alert("This shit has been right clicked");
    });

    sprite.on("mouseout", (e) => {
      sprite.alpha = 1;
      tooltip.style.display = "none";
      document.body.style.cursor = "default";
    });
  }

  render() {
    let icon = Drawing.getAdministrativeTaskSprite(
      this.level,
      this.nodeInfo.type,
      this.nodeInfo.priority
    );
    let combinedSprite = new Container();
    combinedSprite.addChild(this.createSprite());
    combinedSprite.addChild(icon);
    let tex = AppMemento.app.renderer.generateTexture(combinedSprite);
    this.sprite = new Sprite(tex);
    this.setUpSprite(this.sprite);
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

  auxiliaryAddNode(node, id) {
    let name = document.getElementById("name").value;
    let description = document.getElementById("description").value;
    let type = document.getElementById("type").value;
    let color = document.getElementById("color").value;
    let priority = document.getElementById("priority").value;
    let statusElement = document.getElementById("color");
    let status = statusElement.options[statusElement.selectedIndex].text;

    if (!node) {
      TreeMemento.currentTree.push({
        name: name,
        description: description,
        type: type,
        color: color,
        priority: priority,
        status: status,
        id: this.getTreeNodeCount() + 1,
        parent: id,
        children: [],
      });
      this.renderSubTree(id);
      return;
    }
    if (node.id == id) {
      node.children.push({
        name: name,
        description: description,
        type: type,
        color: color,
        status: status,
        priority: priority,
        id: this.getTreeNodeCount() + 1,
        parent: id,
        children: [],
      });
      this.renderSubTree(id);
    }
    for (let i = 0; i < node.children.length; i++) {
      this.auxiliaryAddNode(node.children[i], id);
    }
  }

  addNode(id) {
    this.auxiliaryAddNode(TreeMemento.currentTree[0], id);
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

function addButtonEvents() {
  const addNodeButton = document.getElementById("add-node-form");
  addNodeButton.addEventListener("submit", (e) => {
    e.preventDefault();
    TreeMemento.currentTreeGraph.addNode(TreeMemento.currentRootNode);
  });
}

function setUpTooltipPositions() {
  document.addEventListener("mousemove", (e) => {
    let tooltip = document.getElementById("tooltip");
    tooltip.style.left = e.pageX + "px";
    tooltip.style.top = e.pageY + "px";
  });
}
function initApp() {
  let app = new Application({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    antialias: true,
  });
  const appContainer = document.getElementById("app-container");
  appContainer.appendChild(app.view);
  appContainer.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
  loader.add("images/icons.json").load(setup);
  AppMemento.app = app;
  return app;
}

function setup() {
  setUpTooltipPositions();
  addButtonEvents();

  let treeGraph = new TreeGraph(app.stage, tree);
  initMemento(tree, treeGraph);

  treeGraph.render();
}

let app = initApp();
