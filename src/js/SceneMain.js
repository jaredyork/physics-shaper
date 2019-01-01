class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class PhaserThreeExportTemplate {
  constructor(properties) {

    this.generator_info = "Shape definitions generated with Physics Shaper.  Visit https://www.github.com/jaredyork/physics-shaper";

    this[properties.name] = {
      type: "fromPhysicsShaper",
      label: properties.name,
      isStatic: properties.isStatic,
      density: properties.density,
      restitution: properties.restitution,
      friction: properties.friction,
      frictionAir: properties.frictionAir,
      frictionStatic: properties.frictionStatic,
      collisionFilter: {
        group: properties.collisionFilterGroup,
        category: properties.collisionFilterCategory,
        mask: properties.collisionFilterMask
      },
      fixtures: [{
        label: properties.name + "-fixture",
        isSensor: properties.isSensor,
        vertices: properties.vertices
      }]
    };

    console.log(this);

  }
}

class Editor {
  constructor(scene) {
    this.scene = scene;

    this.transparencyBackgrounds = this.scene.add.group();

    this.imageRepresentation = null;
    this.polygonOverlay = null;
    this.lineOverlays = this.scene.add.group();
    this.currentLineOverlay = this.scene.add.graphics({
      lineStyle: {
        width: 1,
        color: 0x000000
      }
    });

    this.pointIcons = this.scene.add.group();
    this.points = [];
    this.polygonPoints = [];
    this.polygonCreated = false;

    this.pixelCursor = this.scene.add.graphics({
      lineStyle: { width: 0.1, color: 0x000000 }
    });
    this.pixelCursor.setDepth(9);

    this.scene.input.on("pointerdown", function(pointer) {

      if (!this.polygonCreated) {
        var wx = pointer.worldX;
        var wy = pointer.worldY;
        console.log(pointer);

        var hasConnectedAsShape = false;
        for (var i = 0; i < this.pointIcons.getChildren().length; i++) {
          var icon = this.pointIcons.getChildren()[i];
    
          var dist = Phaser.Math.Distance.Between(
            wx,
            wy,
            icon.x,
            icon.y
          );
    
          if (dist < 4) {
            if (pointer.rightButtonDown()) {
              if (icon) {
                icon.destroy();
              }
            }
            else {
              hasConnectedAsShape = true;
            }
          }
        }

        if (!pointer.rightButtonDown()) {
          if (!hasConnectedAsShape) {
            var icon = this.scene.add.sprite(wx, wy, "sprIconPoint");
            icon.setDepth(10);
            icon.setTint(0x33CCFF);
      
            this.pointIcons.add(icon);
      
            this.points.push(new Point(wx, wy));

            if (this.points.length > 1) {
              var graphics = this.scene.add.graphics({
                lineStyle: { width: 1, color: 0x000000 }
              });
              var line = new Phaser.Geom.Line(
                this.points[this.points.length - 2].x,
                this.points[this.points.length - 2].y,
                this.points[this.points.length - 1].x,
                this.points[this.points.length - 1].y
              );
              graphics.strokeLineShape(line);
              this.lineOverlays.add(graphics);
            }            

            this.polygonCreated = false;
          }
          else {

            // Copy points from 'points' to 'polygonPoints'
            for (var i = 0; i < this.points.length; i++) {
              this.polygonPoints.push(this.points[i]);
            }
            this.points.length = 0;
            
            this.polygonOverlay = this.scene.add.graphics();
            this.polygonOverlay.setAlpha(0.5);

            var poly = new Phaser.Geom.Polygon(this.convertPointsToPolygonArray(this.polygonPoints));
            this.polygonOverlay.fillStyle(0x000000FF);
            this.polygonOverlay.fillPoints(poly.points, true);

            this.polygonCreated = true;

          }
        }
        else {

        }
      }

    }, this);

  }

  static getExportFormats() {
    return {
      PHASER_3: "PHASER_3"
    };
  }

  exportJSON(format) {
    var json = JSON.stringify(this.getJSONFromFormat(format));

    var pom = document.createElement("a");
    pom.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(json));
    pom.setAttribute("download", "shape_def.json");
    pom.click();
  }

  getJSONFromFormat(format) {

    var obj = null;

    switch (format) {
      case Editor.getExportFormats().PHASER_3: {

        /*
            this[properties.name] = {
      type: "fromPhysicsShaper",
      label: properties.name,
      isStatic: properties.isStatic,
      density: properties.density,
      restitution: properties.restitution,
      friction: properties.friction,
      frictionAir: properties.frictionAir,
      frictionStatic: properties.frictionStatic,
      collisionFilter: {
        group: properties.collisionFilterGroup,
        category: properties.collisionFilterCategory,
        mask: properties.collisionFilterMask
      },
      fixtures: [{
        label: properties.name + "-fixture",
        isSensor: properties.isSensor,
        vertices: properties.vertices
      }]
    };
    */

        // Generate vertices as an object
        var vertices = [];


        console.log("POLYPOINTS:");
        console.log(this.polygonPoints);
        console.log("");

        var newArrayCounter = 0;
        for (var i = 0; i < Math.ceil(this.polygonPoints.length / 4); i++) {

          var newArray = [];

          for (var j = i * 4; j < (i * 4) + 4; j++) {
            if (j < this.polygonPoints.length) {
              newArray.push({
                x: this.polygonPoints[j].x,
                y: this.polygonPoints[j].y
              });
            }
          }

          vertices.push(newArray);

          if (newArrayCounter < 3) {
            newArrayCounter++;
          }
          else {
            newArrayCounter = 0;
          }
        }


        console.log("VERTICES");
      
        console.log(vertices);
        console.log("");

        obj = new PhaserThreeExportTemplate({
          name: "banana",
          label: "banana",
          isStatic: false,
          density: 0.1,
          restitution: 0.1,
          friction: 0.1,
          frictionAir: 0.1,
          frictionStatic: 0.5,
          collisionFilterGroup: 0,
          collisionFilterCategory: 1,
          collisionFilterMask: 255,
          isSensor: false,
          vertices: vertices
        });

        

        break;
      }
    }

    return obj;
  }

  restartScene() {
    this.scene.scene.start("SceneMain");
  }

  createTransparentBackground() {

    var temp = this.scene.add.image(-512, -512, "sprBgTransparency");
    temp.setVisible(false);

    console.log("w: " + Math.ceil(this.scene.game.config.width / temp.width));

    /*
    for (var i = -Math.ceil(3840 / temp.width); i < Math.ceil(3840 / temp.width); i++) {
      for (var j = -Math.ceil(2160 / temp.height); j < Math.ceil(2160 / temp.height); j++) {
        var bg = this.scene.add.image((i * temp.width), (j * temp.height), "sprBgTransparency");
        bg.setOrigin(0, 0);
        bg.setScale(1 / this.scene.cameras.main.zoom);

        this.transparencyBackgrounds.add(bg);
      }
    }*/

  }

  drawPointLineConnections() {

    this.lineOverlays.clear(true, true);

    if (this.points.length > 1) {
      for (var i = 0; i < this.points.length; i++) {
        var graphics = this.scene.add.graphics({
          lineStyle: { width: 1, color: 0x000000 }
        });
        var line = new Phaser.Geom.Line(
          this.points[i - 1].x,
          this.points[i - 1].y,
          this.points[i].x,
          this.points[i].y
        );
        graphics.strokeLineShape(line);
        this.lineOverlays.add(graphics);
      }
    }

  }

  loadNewImage(key) {

    if (this.imageRepresentation) {
      this.imageRepresentation.destroy();

      console.log("image exists");
    }

    this.imageRepresentation = this.scene.add.sprite(0, 0, key);
    this.imageRepresentation.setOrigin(0, 0);

    this.scene.cameras.main.centerOn(this.imageRepresentation.x + (this.imageRepresentation.displayWidth * 0.5), this.imageRepresentation.y + (this.imageRepresentation.displayHeight * 0.5));
  
    var widthFactor = this.imageRepresentation.width / this.imageRepresentation.width;
    var heightFactor = this.imageRepresentation.height / this.imageRepresentation.height;

    var sizeFactor = Math.max(widthFactor, heightFactor);

    console.log("SIZE FACTOR: " + sizeFactor);

    this.scene.cameras.main.setZoom(sizeFactor);

    amountLoadedImages++;
  }

  initialize() {
    this.createTransparentBackground();
  }

  clearLastPoint() {

    if (this.polygonOverlay) {
      this.polygonOverlay.destroy();
    }

    // Splice the last index from both arrays
    if (this.points.length > 0) {
      this.points = this.points.splice(this.points.length - 1, 1);
    }

    if (this.polygonPoints.length > 0) {
      this.polygonPoints = this.polygonPoints.splice(this.polygonPoints.length - 1, 1);
    }

    // Remove the last sprite from group
    if (this.pointIcons.getChildren().length > 0) {

      this.pointIcons.getChildren()[this.pointIcons.getChildren().length - 1].destroy();
      console.log("attempted to destroy last point icon");
    }

    // Clear the polygon points
    this.polygonPoints.length = 0;

    if (this.polygonCreated) {
      this.polygonCreated = false;
    }
  }

  clearAllPoints() {
    
    this.points.length = 0;
    this.polygonPoints.length = 0;

    if (this.polygonOverlay) {
      this.polygonOverlay.destroy();
    }
    
    this.pointIcons.clear(true, true);
    this.lineOverlays.clear(true, true);

    this.polygonCreated = false;
  }

  convertPointsToPolygonArray(pointArray) {

    var arr = [];

    for (var i = 0; i < pointArray.length; i++) {
      arr.push(pointArray[i].x);
      arr.push(pointArray[i].y);
    }

    return arr;
  }

  update(delta) {

    for (var i = 0; i < this.pointIcons.getChildren().length; i++) {
      var icon = this.pointIcons.getChildren()[i];

      var dist = Phaser.Math.Distance.Between(
        this.scene.input.activePointer.worldX,
        this.scene.input.activePointer.worldY,
        icon.x,
        icon.y
      );

      if (dist < 4) {
        icon.setScale((1 / this.scene.cameras.main.zoom) * 1.25);
        icon.setTint(0xFF3333);
      }
      else {
        icon.setScale(1 / this.scene.cameras.main.zoom);
        icon.setTint(0x33CCFF);
      }
    }

    for (var i = 0; i < this.transparencyBackgrounds.getChildren().length; i++) {
      var bg = this.transparencyBackgrounds.getChildren()[i];

      bg.setScale(1 / this.scene.cameras.main.zoom);
    }
    
    if (this.points.length > 0) {

      if (this.currentLineOverlay) {
        this.currentLineOverlay.destroy();
      }

      this.currentLineOverlay = this.scene.add.graphics({
        lineStyle: { width: 1, color: 0x000000 }
      });
      var line = new Phaser.Geom.Line(
        this.points[this.points.length - 1].x,
        this.points[this.points.length - 1].y,
        this.scene.input.activePointer.worldX,
        this.scene.input.activePointer.worldY
      );

      this.currentLineOverlay.strokeLineShape(line);
    }

    var cursorGeom = new Phaser.Geom.Rectangle(
      Math.floor(this.scene.input.activePointer.worldX) - 0,
      Math.floor(this.scene.input.activePointer.worldY) - 0,
      1,
      1
    );
    this.pixelCursor.clear();
    this.pixelCursor.strokeRectShape(cursorGeom);

    this.pixelCursor.lineStyle.width = 1 / this.scene.cameras.main.zoom;
  }
}

class SceneMain extends Phaser.Scene {
  constructor() {
    super({ key: "SceneMain" });
  }

  preload() {
    let base = "img/";

    this.load.image("sprBgTransparency", base + "sprBgTransparency.png");
    this.load.image("sprIconPoint", base + "sprIconPoint.png");
    this.load.image("sprOrigin", base + "sprOrigin.png");
  }

  create() {

    this.textures.on("addtexture", function(key) {

      console.log("added texture: " + key);

      this.loadNewImage(key);

    }, this);

    this.editor = new Editor(this);
    this.editor.initialize();
    editor = this.editor;

    this.origin = this.add.sprite(0, 0, "sprOrigin");
    this.origin.setDepth(9);

    this.cursor = this.add.sprite(this.input.activePointer.x, this.input.activePointer.y, "sprIconPoint");
    this.cursor.setDepth(10);
    this.cursor.setTint(0x33CCFF);

    this.lastPointerDown = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

  }

  update(delta) {

    this.cursor.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);

    if (this.input.activePointer.isDown && !this.lastPointerDown) {
      this.lastPointerX = this.cameras.main.x + this.input.activePointer.x;
      this.lastPointerY = this.cameras.main.y + this.input.activePointer.y;
    }

    if (windowDragged == null) {
      if (this.input.activePointer.isDown) {

        var amountX = this.input.activePointer.x - this.lastPointerX;
        var amountY = this.input.activePointer.y - this.lastPointerY;
      
        if (Phaser.Math.Distance.Between(this.input.activePointer.x, this.input.activePointer.y, this.lastPointerX, this.lastPointerY) > 32) {
          this.cameras.main.centerOn(amountX, amountY);
        }
      }
    }

    if (!this.input.activePointer.isDown && !this.lastPointerDown) {
      this.lastPointerX = this.input.activePointer.x;
      this.lastPointerY = this.input.activePointer.y;
    }

    this.lastPointerDown = this.input.activePointer.isDown;

    this.editor.update(delta);
  }

  loadNewImage(key) {

    this.editor.loadNewImage(key);

  }

  onScrollWheelChanged(delta) {

    this.cameras.main.setZoom(this.cameras.main.zoom + (delta  * 0.001));

    if (this.cameras.main.zoom < 0.1) {
      this.cameras.main.setZoom(0.1);
    }

    this.cursor.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);

    this.cursor.setScale(1 / this.cameras.main.zoom);

    this.origin.setScale(1 / this.cameras.main.zoom);

  }
}