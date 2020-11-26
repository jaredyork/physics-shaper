var win = nw.Window.get();
let gui = require('nw.gui');

class EditorWorkspace {
    constructor(scene) {
        this.scene = scene;

        this.objectIdIterator = 0;
        this.fixtureIdIterator = 0;
        this.objectData = []; // an array of object data, one element per object
        this.openObjectId = 0;

        this.overlayGraphics = this.scene.add.graphics();
        this.overlayGraphics.setAlpha(0.5);
        this.vertexSprites = this.scene.add.group();

        this.amountVerticesHoveredOver = 0;
        this.isDraggingVertex = false;
        this.isHoveringOverVertex = false;
    }

    flushGraphics() {
        this.overlayGraphics.clear();
        this.vertexSprites.clear(true, true);
    }

    getDefaultObjectData() {
        return {
            image: null,
            type: 'fromPhysicsShaper',
            label: 'untitled',
            isStatic: false,
            density: 0.1,
            restitution: 0.1,
            friction: 0.1,
            frictionAir: 0.1,
            frictionStatic: 0.5,
            collisionFilter: {
                group: 0,
                category: 1,
                mask: 255
            },
            fixtures: []
        };
    }

    convertVertexVectorsTo1DArray(vertices) {
        let returnArray = [];

        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i];

            returnArray.push(vertex.x);
            returnArray.push(vertex.y);
        }

        return returnArray;
    }

    getObject(id) {
        for (let i = 0; i < this.objectData.length; i++) {
            if (this.objectData[i].id === id) {
                return this.objectData[i];
            }
        }
        return null;
    }

    renderObjectWithOverlays(object) {
        this.flushGraphics();

        object.fixtures.forEach(function(fixture) {
            if (fixture.vertices !== undefined) {
                let vertices1D = this.convertVertexVectorsTo1DArray(fixture.vertices);
                console.log(vertices1D);

                let poly = new Phaser.Geom.Polygon(vertices1D);
                console.log(poly);
                this.overlayGraphics.fillStyle(0x0000ff);
                this.overlayGraphics.fillPoints(poly.points, true);        

                this.overlayGraphics.lineStyle(1 / this.scene.cameras.main.zoom, 0x000000);
                this.overlayGraphics.beginPath();
                for (let i = 0; i < poly.points.length; i++) {
                    this.overlayGraphics.lineTo(poly.points[i].x, poly.points[i].y);
                }
                this.overlayGraphics.closePath();
                this.overlayGraphics.strokePath();

                for (let i = 0; i < fixture.vertices.length; i++) {
                    let vertex = fixture.vertices[i];
                    let vertexSprite = this.scene.add.sprite(vertex.x, vertex.y, 'imgVertex');
                    vertexSprite.setScale(1 / this.scene.cameras.main.zoom);

                    let dist = Phaser.Math.Distance.Between(vertex.x, vertex.y, this.scene.input.activePointer.x, this.scene.input.activePointer.y);
                    if (dist < 16) {
                        vertexSprite.setTint(0xff0000);
                    }

                    console.log(vertexSprite.scaleX);
                    this.vertexSprites.add(vertexSprite);
                }
            }
        }.bind(this));
    }

    loadObject(id) {
        let object = this.getObject(id);

        this.renderObjectWithOverlays(object);
    }

    createObject(fixtures) {
        let object = this.getDefaultObjectData();
        object.id = this.objectIdIterator;
        this.objectIdIterator++;

        if (fixtures !== undefined && fixtures !== null) {
            object.fixtures = fixtures;
        }
        this.objectData.push(object);

        this.loadObject(object.id);
    }

    getDefaultFixtureData() {
        return {
            label: 'untitled fixture',
            isSensor: false,
            vertices: []
        };
    }

    createFixture(args) {
        let fixture = this.getDefaultFixtureData();
        fixture.id = this.fixtureIdIterator;
        this.fixtureIdIterator++;

        if (args.vertices !== undefined && args.vertices !== null) {
            fixture.vertices = args.vertices;
        }
        
        args.object.fixtures.push(fixture);

        this.loadObject();
    }

    onScrollWheelChanged(delta) {

        this.scene.cameras.main.setZoom(this.scene.cameras.main.zoom + (delta  * 0.001));
    
        if (this.scene.cameras.main.zoom < 0.1) {
          this.scene.cameras.main.setZoom(0.1);
        }
    
        //this.origin.setScale(1 / this.cameras.main.zoom);

        let object = this.getObject(this.openObjectId);

        this.renderObjectWithOverlays(object);

    }

    update() {
        this.amountVerticesHoveredOver = 0;
        this.isHoveringOverVertex = false;
        this.isDraggingVertex = false;

        if (this.openObjectId !== null) {
            let object = this.getObject(this.openObjectId);

            object.fixtures.forEach(function(fixture) {
                for (let i = 0; i < fixture.vertices.length; i++) {
                    let vertex = fixture.vertices[i];
                    
                    let vertexSprite = null;
                    for (let j = 0; j < this.vertexSprites.getChildren().length; j++) {
                        let spr = this.vertexSprites.getChildren()[i];

                        if (spr.x === vertex.x && spr.y === vertex.y) {
                            vertexSprite = spr;
                        }
                    }

                    let dist = Phaser.Math.Distance.Between(vertex.x, vertex.y, this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);
                    if (dist < 16) {
                        vertexSprite.setTint(0xff0000);

                        this.amountVerticesHoveredOver++;

                        if (this.scene.isMouseDown) {
                            this.isDraggingVertex = true;
                        }
                    }
                    else {
                        vertexSprite.setTint(0xffffff);
                    }
                }
            }.bind(this));
        }

        if (this.amountVerticesHoveredOver > 0) {
            this.isHoveringOverVertex = true;
        }
    }
}

class EditorBootScene extends Phaser.Scene {
    constructor() {
        super({ super: 'EditorBootScene' });
    }

    preload() {
        let ir = '../assets/';

        this.load.image('imgVertex', ir + 'imgVertex.png');
    }

    create() {
        this.scene.start('EditorScene');
    }
}

class EditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EditorScene' });
    }

    create() {
        this.editorWorkspace = new EditorWorkspace(this);

        this.editorWorkspace.createObject(
            [
                {
                    label: 'triangle',
                    isSensor: false,
                    vertices: [
                        { x: 128, y: 128 },
                        { x: 256, y: 256 },
                        { x: 64, y: 320 }
                    ]
                }
            ]
        );

        this.cameraDragging = false;
        this.cameraDragSpeed = 1;
        this.lastCameraDragOrigin = new Phaser.Math.Vector2(0, 0);
        this.cameraDragOrigin = new Phaser.Math.Vector2(
            this.cameras.main.originX,
            this.cameras.main.originY
        );
        this.lastIsMouseDown = false;
        this.isMouseDown = false;
        this.amountTicksMouseDown = 0;
    }

    recenterView() {
        this.cameras.main.centerOn(
            this.cameras.main.worldView.width * 0.5,
            this.cameras.main.worldView.height * 0.5
        );
    }

    resetZoom() {
        this.cameras.main.setZoom(1);

        let object = this.editorWorkspace.getObject(this.editorWorkspace.openObjectId);
        this.editorWorkspace.flushGraphics();
        this.editorWorkspace.renderObjectWithOverlays(object);
    }

    update() {
        this.lastIsMouseDown = this.isMouseDown;
        this.isMouseDown = this.input.activePointer.isDown;

        this.editorWorkspace.update();

        this.lastCameraDragOrigin = this.cameraDragOrigin;

        let cameraCenterX = this.cameras.main.worldView.x + (this.cameras.main.worldView.width * 0.5);
        let cameraCenterY = this.cameras.main.worldView.y + (this.cameras.main.worldView.height * 0.5);

        console.log(this.editorWorkspace.isHoveringOverVertex);

        if (!this.lastIsMouseDown && this.isMouseDown && !this.editorWorkspace.isHoveringOverVertex) {
            this.cameraDragging = true;
            this.cameraDragOrigin = new Phaser.Math.Vector2(
                this.input.activePointer.x,
                this.input.activePointer.y
            );
        }
        else if (this.lastIsMouseDown && !this.isMouseDown) {
            this.cameraDragOrigin = new Phaser.Math.Vector2(
                this.input.activePointer.x,
                this.input.activePointer.y
            );
            this.cameraDragging = false;
        }

        if (this.cameraDragging) {
            let moveDelta = new Phaser.Math.Vector2(
                this.input.activePointer.x - this.cameraDragOrigin.x,
                this.input.activePointer.y - this.cameraDragOrigin.y
            );

            if (moveDelta.x != 0 || moveDelta.y != 0) {
                this.cameras.main.centerOn(
                    cameraCenterX - (moveDelta.x * (1 / this.cameras.main.zoom)),
                    cameraCenterY - (moveDelta.y * (1 / this.cameras.main.zoom))
                );
            }

            this.cameraDragOrigin = new Phaser.Math.Vector2(
                this.input.activePointer.x,
                this.input.activePointer.y
            );
        }
    }
}

class Editor {
    constructor() {
        this.gameConfig = {
            type: Phaser.AUTO,
            scale: {
                mode: Phaser.Scale.RESIZE,
                parent: 'canvas-container',
                width: window.innerWidth - 32,
            },
            transparent: true,
            scene: [EditorBootScene, EditorScene]
        };
        this.game = new Phaser.Game(this.gameConfig);

        this.editorWindowManager = new EditorWindowManager();

        // Define an object that stores the on-click functions for menu items
        this.menuBar = {
            onClick: {
                file: {},
                view: {},
                help: {}
            }
        };

        this.menuBar.onClick.file.newWorkspace = function() {

        };

        this.menuBar.onClick.file.openWorkspace = function() {

        };

        this.menuBar.onClick.file.export = function() {

        };

        this.menuBar.onClick.file.exit = function() {
            nw.App.closeAllWindows();
        };

        this.menuBar.onClick.view.recenterView = function() {
            this.game.scene.scenes[1].recenterView();
        }.bind(this);

        this.menuBar.onClick.view.resetZoom = function() {
            this.game.scene.scenes[1].resetZoom();
        }.bind(this);

        this.menuBar.onClick.help.aboutPhysicsShaper = function() {
            let helpWindow = new EditorAboutWindow();
            this.editorWindowManager.append(helpWindow);
            console.log(this.editorWindowManager);
        }.bind(this);

        this.menuBar.onClick.help.findUsOnGithub = function() {
            gui.Shell.openExternal('https://github.com/jaredyork/physics-shaper');
        };
    }
}

class MenuBar extends nw.Menu {
    constructor() {
        super({ type: 'menubar' });
    }

    setup(editor) {
        this.submenuFile = new nw.Menu();
        this.submenuFile.append(new nw.MenuItem({
            label: 'New Workspace',
            click: editor.menuBar.onClick.file.newWorkspace
        }));
        this.submenuFile.append(new nw.MenuItem({
            label: 'Open Workspace',
            click: editor.menuBar.onClick.file.openWorkspace
        }));
        this.submenuFile.append(new nw.MenuItem({ type: 'separator' }));
        this.submenuFile.append(new nw.MenuItem({
            label: 'Export',
            click: editor.menuBar.onClick.file.export
        }));
        this.submenuFile.append(new nw.MenuItem({ type: 'separator' }));
        this.submenuFile.append(new nw.MenuItem({
            label: 'Exit',
            click: editor.menuBar.onClick.file.exit
        }));


        this.submenuView = new nw.Menu();
        this.submenuView.append(new nw.MenuItem({
            label: 'Recenter View',
            click: editor.menuBar.onClick.view.recenterView
        }));
        this.submenuView.append(new nw.MenuItem({
            label: 'Reset Zoom',
            click: editor.menuBar.onClick.view.resetZoom
        }));



        this.submenuHelp = new nw.Menu();
        this.submenuHelp.append(new nw.MenuItem({
            label: 'About Physics Shaper',
            click: editor.menuBar.onClick.help.aboutPhysicsShaper
        }));

        this.submenuHelp.append(new nw.MenuItem({
            label: 'Find Us on GitHub',
            icon: 'assets/imgIconGitHubMark.png',
            click: editor.menuBar.onClick.help.findUsOnGithub
        }));

        
        
        this.append(new nw.MenuItem({
            label: 'File',
            submenu: this.submenuFile
        }));

        this.append(new nw.MenuItem({
            label: 'View',
            submenu: this.submenuView
        }));

        this.append(new nw.MenuItem({
            label: 'Help',
            submenu: this.submenuHelp
        }));

        win.menu = this;
    }
}

let editor = null;
window.addEventListener('DOMContentLoaded', function() {
    editor = new Editor();
    let menuBar = new MenuBar();
    menuBar.setup(editor);
});

// PREVENT CONTEXT MENU FROM OPENING
document.addEventListener("contextmenu", function(evt){
    evt.preventDefault();
}, false);

function onWheelScroll(e) {

    console.log(e.wheelDelta);

    var evt = window.event || e;
    var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta;
  
    editor.game.scene.scenes[1].editorWorkspace.onScrollWheelChanged(delta);
  
}
  
var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";

if (document.attachEvent) //if IE (and Opera depending on user setting)
    document.attachEvent("on"+mousewheelevt, onWheelScroll);
else if (document.addEventListener) //WC3 browsers
    document.addEventListener(mousewheelevt, onWheelScroll, false);

