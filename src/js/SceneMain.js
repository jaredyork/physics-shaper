class Editor {
  constructor(scene) {
    this.scene = scene;

    this.transparencyBackgrounds = this.scene.add.group();
  }

  createTransparentBackground() {

    var temp = this.scene.add.image(-512, -512, "sprBgTransparency");
    temp.setVisible(false);

    console.log("w: " + Math.ceil(this.scene.game.config.width / temp.width));

    for (var i = 0; i < Math.ceil(3840 / temp.width); i++) {
      for (var j = 0; j < Math.ceil(2160 / temp.height); j++) {
        var bg = this.scene.add.image((i * temp.width) - (this.scene.game.config.width * 0.5), (j * temp.height) - (this.scene.game.config.height * 0.5), "sprBgTransparency").setScrollFactor(0);
        bg.setOrigin(0, 0);

        this.transparencyBackgrounds.add(bg);
      }
    }

  }

  loadNewImage(key) {

    if (this.imageRepresentation) {
      this.imageRepresentation.destroy();
    }

    this.imageRepresentation = this.scene.add.image(0, 0, key);
    this.imageRepresentation.setOrigin(0, 0);

    this.scene.cameras.main.centerOn(this.imageRepresentation.x + (this.imageRepresentation.displayWidth * 0.5), this.imageRepresentation.y + (this.imageRepresentation.displayHeight * 0.5));
  
    var widthFactor = this.imageRepresentation.width / this.imageRepresentation.width;
    var heightFactor = this.imageRepresentation.height / this.imageRepresentation.height;

    var sizeFactor = Math.max(widthFactor, heightFactor);

    console.log("SIZE FACTOR: " + sizeFactor);

    this.scene.cameras.main.setZoom(sizeFactor);
  }

  initialize() {
    this.createTransparentBackground();
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
  }

  create() {

    this.textures.once("addtexture", function(key) {

      this.loadNewImage(key);

      console.log("LOADED TEXTURE.");
    }, this);

    this.editor = new Editor(this);
    this.editor.initialize();

    this.cursor = this.add.sprite(this.input.activePointer.x, this.input.activePointer.y, "sprIconPoint");

    this.lastPointerDown = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

  }

  update(delta) {

    this.cursor.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);



    if (this.input.activePointer.isDown && !this.lastPointerDown) {
      this.lastPointerX = this.input.activePointer.x;
      this.lastPointerY = this.input.activePointer.y;

      this.cameras.main.centerOn(this.cameras.main.x - amountX, this.cameras.main.y - amountY);
    }

    if (this.input.activePointer.isDown && this.lastPointerDown) {
      var amountX = this.input.activePointer.x - this.lastPointerX;
      var amountY = this.input.activePointer.y - this.lastPointerY;

      this.cameras.main.centerOn(this.cameras.main.x - amountX, this.cameras.main.y - amountY);
    }

    if (!this.input.activePointer.isDown && !this.lastPointerDown) {
      this.lastPointerX = this.input.activePointer.x;
      this.lastPointerY = this.input.activePointer.y;
    }

    this.lastPointerDown = this.input.activePointer.isDown;
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

  }
}