var win = nw.Window.get();
let gui = require('nw.gui');

class EditorObject {
    constructor() {
        this.image = null;
        this.type = 'fromPhysicsShaper';
        this.label = 'untitled';
        this.isStatic = false;
        this.density = 0.1;
        this.restitution = 0.1;
        this.friction = 0.1;
        this.frictionAir = 0.1;
        this.frictionStatic = 0.5;
        this.collisionFilter = {
            group: 0,
            category: 1,
            mask: 255
        };
        this.fixtures = [];
    }
}

class EditorFixture {
    constructor(args) {
        this.object = args.object;
        this.label = args.label;
        this.isSensor = args.isSensor;
        this.vertices = args.vertices;
    }
}

class EditorVertex {
    constructor(args) {
        this.fixture = args.fixture;
        this.x = args.x;
        this.y = args.y;
        this.editor = {
            isDragging: false
        };
    }
}

class EditorWorkspace {
    constructor(scene) {
        this.scene = scene;

        this.objectIdIterator = 0;
        this.fixtureIdIterator = 0;
        this.objects = []; // an array of object data, one element per object
        this.openObjectId = 0;

        this.overlayGraphics = this.scene.add.graphics();
        this.overlayGraphics.setAlpha(0.5);
        this.vertexSprites = this.scene.add.group();

        this.amountVerticesHoveredOver = 0;
        this.isDraggingVertex = false;
        this.isHoveringOverVertex = false;
    }

    clearWorkspace() {
        this.openObjectId = 0;

        this.objects.length = 0;

        let thumbnails = document.getElementsByClassName('thumb-object');
        for (let i = 0; i < thumbnails.length; i++) {
            thumbnails[i].parentNode.removeChild(thumbnails[i]);
            i--;
        }
    }

    resetWorkspace() {
        this.clearWorkspace();

        this.createObject();
        let object = this.getObject(this.openObjectId);
        let fixture = this.createFixture({
            object: object
        });

        this.createVertex({
            fixture: fixture,
            x: 256,
            y: 256
        });

        this.createVertex({
            fixture: fixture,
            x: 320,
            y: 320
        });

        this.createVertex({
            fixture: fixture,
            x: 200,
            y: 420
        });

        this.loadObject(object.id);
    }

    openWorkspace(data) {
        this.clearWorkspace();

        // Copy objects from data to the array in this class instance
        for (let i = 0; i < data.objects.length; i++) {
            let objectJson = data.objects[i];

            let object = new EditorObject();

            for (const [key, value] of Object.entries(objectJson)) {
                object[key] = value;
            }

            this.objects.push(object);
        }

        // Re-link object references
        for (var i = 0; i < this.objects.length; i++) {
            var object = this.objects[i];

            for (var j = 0; j < object.fixtures.length; j++) {
                var fixtureJson = object.fixtures[j];

                var fixture = new EditorFixture({
                    object: object,
                    label: fixtureJson.label,
                    isSensor: fixtureJson.isSensor,
                    vertices: fixtureJson.vertices
                });

                object.fixtures[j] = fixture;

                for (var k = 0; k < fixture.vertices.length; k++) {
                    var vertexJson = fixture.vertices[k];

                    var vertex = new EditorVertex({
                        fixture: fixture,
                        x: vertexJson.x,
                        y: vertexJson.y
                    });

                    fixture.vertices[k] = vertex;
                }
            }
        }

        console.log('LOADED OBJECTS', this.objects);


        this.regenerateThumbnails();

        this.openObjectId = 0;
        this.loadObject(this.openObjectId);
    }

    regenerateThumbnails() {

        let thumbnails = document.getElementsByClassName('thumb-object');
        for (let i = 0; i < thumbnails.length; i++) {
            thumbnails[i].parentNode.removeChild(thumbnails[i]);
            i--;
        }

        for (let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];

            let objectSelectionRibbonFlex = document.getElementsByClassName('object-selection-ribbon-flex')[0];
            let objectThumbnail = document.createElement('canvas');
            if (document.getElementsByClassName('thumb-object').length === 0) {
                objectThumbnail.setAttribute('class', 'thumb-object selected');
            }
            else {
                objectThumbnail.setAttribute('class', 'thumb-object');
            }
            objectThumbnail.setAttribute('id', 'thumb-object' + object.id);
            objectThumbnail.width = 640;
            objectThumbnail.height = 480;
            objectThumbnail.style.width = '64px';
            objectThumbnail.style.height = '48px';
            objectThumbnail.addEventListener('click', function() {
                let objectThumbnails = document.getElementsByClassName('thumb-object');
                for (let i = 0; i < objectThumbnails.length; i++) {
                    objectThumbnails[i].setAttribute('class', 'thumb-object');
                }

                objectThumbnail.setAttribute('class', 'thumb-object selected');

                let objectId = Number(objectThumbnail.id.replace('thumb-object', ''));

                this.loadObject(objectId);
            }.bind(this));

            objectSelectionRibbonFlex.appendChild(objectThumbnail);


            // Update the thumbnail
            let thumbnail = document.getElementById('thumb-object' + object.id);
            if (thumbnail !== null) {
                let thumbnailCtx = thumbnail.getContext('2d');
                thumbnailCtx.clearRect(0, 0, thumbnail.width, thumbnail.height);

                object.fixtures.forEach(function(fixture) {
                    if (fixture.vertices !== undefined) {
                        let vertexPairs = PolyDecompUtilties.convertVerticesToArrayPairs(fixture.vertices);
                        
                        decomp.makeCCW(vertexPairs);

                        let vertices1D = PolyDecompUtilties.convertArrayPairsTo1DArray(vertexPairs);

                        let poly = new Phaser.Geom.Polygon(vertices1D);

                        thumbnailCtx.save();
                        thumbnailCtx.fillStyle = '#0000ff';
                        thumbnailCtx.beginPath();
                        for (let i = 0; i < poly.points.length; i++) {
                            if (i === 0) {
                                thumbnailCtx.moveTo(poly.points[i].x, poly.points[i].y);
                            }
                            else if (i > 0) {
                                thumbnailCtx.lineTo(poly.points[i].x, poly.points[i].y);
                            }
                        }
                        thumbnailCtx.closePath();
                        thumbnailCtx.fill();
                        thumbnailCtx.stroke();
                        thumbnailCtx.restore();
                    }
                }.bind(this));
            }
        }
    }

    flushGraphics() {
        this.overlayGraphics.clear();
        this.vertexSprites.clear(true, true);
    }

    getDefaultObjectData() {
        return {

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
        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i].id === id) {
                return this.objects[i];
            }
        }
        return null;
    }

    renderObjectWithOverlays(object) {
        this.flushGraphics();

        object.fixtures.forEach(function(fixture) {
            if (fixture.vertices !== undefined) {
                let vertexPairs = PolyDecompUtilties.convertVerticesToArrayPairs(fixture.vertices);
                
                decomp.makeCCW(vertexPairs);

                let vertices1D = PolyDecompUtilties.convertArrayPairsTo1DArray(vertexPairs);



                let poly = new Phaser.Geom.Polygon(vertices1D);
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

                    this.vertexSprites.add(vertexSprite);
                }
            }
        }.bind(this));



        // Update the thumbnail
        let thumbnail = document.getElementById('thumb-object' + object.id);
        if (thumbnail !== null) {
            let thumbnailCtx = thumbnail.getContext('2d');
            thumbnailCtx.clearRect(0, 0, thumbnail.width, thumbnail.height);

            object.fixtures.forEach(function(fixture) {
                if (fixture.vertices !== undefined) {
                    let vertexPairs = PolyDecompUtilties.convertVerticesToArrayPairs(fixture.vertices);
                    
                    decomp.makeCCW(vertexPairs);

                    let vertices1D = PolyDecompUtilties.convertArrayPairsTo1DArray(vertexPairs);

                    let poly = new Phaser.Geom.Polygon(vertices1D);

                    thumbnailCtx.save();
                    thumbnailCtx.fillStyle = '#0000ff';
                    thumbnailCtx.beginPath();
                    for (let i = 0; i < poly.points.length; i++) {
                        if (i === 0) {
                            thumbnailCtx.moveTo(poly.points[i].x, poly.points[i].y);
                        }
                        else if (i > 0) {
                            thumbnailCtx.lineTo(poly.points[i].x, poly.points[i].y);
                        }
                    }
                    thumbnailCtx.closePath();
                    thumbnailCtx.fill();
                    thumbnailCtx.stroke();
                    thumbnailCtx.restore();
                }
            }.bind(this));
        }

    }

    loadObject(id) {
        this.openObjectId = id;

        let object = this.getObject(this.openObjectId);

        this.renderObjectWithOverlays(object);
    }

    createObject(fixtures) {
        let object = new EditorObject();
        object.id = this.objectIdIterator;
        this.objectIdIterator++;

        if (fixtures !== undefined && fixtures !== null) {
            object.fixtures = fixtures;
        }
        else {
            object.fixtures = [];
        }
        this.objects.push(object);

        object.fixtures.forEach(function(fixture) {
            for (let i = 0; i < fixture.vertices.length; i++) {
                let vertex = fixture.vertices[i];

                if (vertex.editor === undefined) {
                    vertex.editor = {
                        isDragging: false
                    };
                }
            }
        });

        this.loadObject(object.id);


        let objectSelectionRibbonFlex = document.getElementsByClassName('object-selection-ribbon-flex')[0];
        let objectThumbnail = document.createElement('canvas');
        if (document.getElementsByClassName('thumb-object').length === 0) {
            objectThumbnail.setAttribute('class', 'thumb-object selected');
        }
        else {
            objectThumbnail.setAttribute('class', 'thumb-object');
        }
        objectThumbnail.setAttribute('id', 'thumb-object' + object.id);
        objectThumbnail.width = 640;
        objectThumbnail.height = 480;
        objectThumbnail.style.width = '64px';
        objectThumbnail.style.height = '48px';
        objectThumbnail.addEventListener('click', function() {
            let objectThumbnails = document.getElementsByClassName('thumb-object');
            for (let i = 0; i < objectThumbnails.length; i++) {
                objectThumbnails[i].setAttribute('class', 'thumb-object');
            }

            objectThumbnail.setAttribute('class', 'thumb-object selected');

            let objectId = Number(objectThumbnail.id.replace('thumb-object', ''));

            this.loadObject(objectId);
        }.bind(this));

        objectSelectionRibbonFlex.appendChild(objectThumbnail);

        return object;
    }

    createFixture(args) {
        let fixture = new EditorFixture({
            object: args.object,
            label: 'untitled fixture',
            isSensor: false,
            vertices: []
        });
        fixture.id = this.fixtureIdIterator;
        this.fixtureIdIterator++;
        
        if (args.vertices !== undefined && args.vertices !== null) {
            fixture.vertices = args.vertices;
        }

        fixture.object.fixtures.push(fixture);

        return fixture;
    }

    createVertex(args) {
        let vertex = new EditorVertex({
            fixture: args.fixture,
            x: args.x,
            y: args.y
        });

        if (args.insertAt === undefined) {
            args.fixture.vertices.push(vertex);
        }
        else {
            args.fixture.vertices.splice(args.insertAt, 0, vertex);
        }

        return vertex;
    }

    makeVerticesCCW(vertices) {
        let vertexPairsCCW = PolyDecompUtilties.convertVerticesToArrayPairs(vertices);
        let verticesCCW = [];

        // Find the vertex class instances and put them in CCW order
        for (let i = 0; i < vertexPairsCCW.length; i++) {
            let vertexPairCCW = vertexPairsCCW[i];

            vertices.forEach(function(fixtureVertex) {
                if (fixtureVertex.x === vertexPairCCW[0] && fixtureVertex.y === vertexPairCCW[1]) {
                    verticesCCW.push(fixtureVertex);
                }
            });
        }

        return verticesCCW;
    }

    getWorkspaceData() {
        let workspaceData = {
            objects: this.objects
        };

        return workspaceData;
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

        if (!this.scene.isMouseDown) {
            if (this.openObjectId !== null) {
                let object = this.getObject(this.openObjectId);
    
                object.fixtures.forEach(function(fixture) {
                    for (let i = 0; i < fixture.vertices.length; i++) {
                        let vertex = fixture.vertices[i];

                        vertex.editor.isDragging = false;
                    }
                });
            }
        }

        let pointerCircle = new Phaser.Geom.Circle(
            this.scene.input.activePointer.worldX,
            this.scene.input.activePointer.worldY,
            10 / this.scene.cameras.main.zoom
        );

        if (this.openObjectId !== null) {
            let object = this.getObject(this.openObjectId);

            object.fixtures.forEach(function(fixture) {

                fixture.vertices = this.makeVerticesCCW(fixture.vertices);


                let vertices1d = this.convertVertexVectorsTo1DArray(fixture.vertices);
                
                let poly = new Phaser.Geom.Polygon(vertices1d);
                this.overlayGraphics.lineStyle(2 / this.scene.cameras.main.zoom, 0x000000);
                this.overlayGraphics.beginPath();
                for (let i = 0; i < poly.points.length; i++) {
                    let insertAt = null;

                    let createVertexArgs = {
                        fixture: fixture,
                        x: this.scene.input.activePointer.worldX,
                        y: this.scene.input.activePointer.worldY
                    };

                    if (i - 1 >= 0) {
                        insertAt = i;
                        createVertexArgs.insertAt = i;
                    }

                    if (i >= 0) {
                        let line = null;

                        if (i > 0) {
                            line = new Phaser.Geom.Line(poly.points[i - 1].x, poly.points[i - 1].y, poly.points[i].x, poly.points[i].y);
                        }
                        else if (i === 0) {
                            line = new Phaser.Geom.Line(poly.points[poly.points.length - 1].x, poly.points[poly.points.length - 1].y, poly.points[i].x, poly.points[i].y);
                        }

                        if (Phaser.Geom.Intersects.LineToCircle(line, pointerCircle)) {
                            if (this.scene.hasMouseDoubleClicked) {
                                this.createVertex(createVertexArgs);
                            }
                        }
                    }
                }



                for (let i = 0; i < fixture.vertices.length; i++) {
                    let vertex = fixture.vertices[i];

                    let dist = Phaser.Math.Distance.Between(vertex.x, vertex.y, this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);
                    if (dist < 16) {
                        this.amountVerticesHoveredOver++;

                        if (this.scene.isMouseDown) {
                            this.isDraggingVertex = true;
                            vertex.editor.isDragging = true;
                        }
                    }
                }
            }.bind(this));


            object.fixtures.forEach(function(fixture) {
                for (let i = 0; i < fixture.vertices.length; i++) {
                    let vertex = fixture.vertices[i];

                    if (vertex.editor.isDragging) {
                        vertex.x = this.scene.input.activePointer.worldX;
                        vertex.y = this.scene.input.activePointer.worldY;
                    }
                }
            }.bind(this));

            this.renderObjectWithOverlays(object);
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
        this.editorWorkspace.resetWorkspace();

        this.cameraDragging = false;
        this.cameraDragSpeed = 1;
        this.lastCameraDragOrigin = new Phaser.Math.Vector2(0, 0);
        this.cameraDragOrigin = new Phaser.Math.Vector2(
            this.cameras.main.originX,
            this.cameras.main.originY
        );
        this.lastIsMouseDown = false;
        this.isMouseDown = false;
        this.hasMouseDoubleClicked = false;
        this.elapsedTicksSinceLastClick = 0;
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
        this.editorWorkspace.renderObjectWithOverlays(object);
    }

    update() {
        this.lastIsMouseDown = this.isMouseDown;
        this.isMouseDown = this.input.activePointer.isDown;
        this.hasMouseDoubleClicked = false;

        this.elapsedTicksSinceLastClick++;

        this.lastCameraDragOrigin = this.cameraDragOrigin;

        let cameraCenterX = this.cameras.main.worldView.x + (this.cameras.main.worldView.width * 0.5);
        let cameraCenterY = this.cameras.main.worldView.y + (this.cameras.main.worldView.height * 0.5);

        if (!this.lastIsMouseDown && this.isMouseDown && !this.editorWorkspace.isHoveringOverVertex) {
            this.cameraDragging = true;
            this.cameraDragOrigin = new Phaser.Math.Vector2(
                this.input.activePointer.x,
                this.input.activePointer.y
            );

            if (this.elapsedTicksSinceLastClick < 15) {
                this.hasMouseDoubleClicked = true;
            }

            this.elapsedTicksSinceLastClick = 0;
        }
        else if (this.lastIsMouseDown && !this.isMouseDown) {
            this.cameraDragOrigin = new Phaser.Math.Vector2(
                this.input.activePointer.x,
                this.input.activePointer.y
            );
            this.cameraDragging = false;
        }

        this.editorWorkspace.update();

        console.log(this.elapsedTicksSinceLastClick, this.hasMouseDoubleClicked);


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
            this.game.scene.scenes[1].editorWorkspace.resetWorkspace();
        }.bind(this);

        this.menuBar.onClick.file.openWorkspace = function() {
            let openWorkspace = document.getElementById('file-open-workspace');
            let mouseEvent = new MouseEvent('click', {
                bubble: true,
                cancelable: true,
                view: window
            });
            let canceled = !openWorkspace.dispatchEvent(mouseEvent);
        };

        this.menuBar.onClick.file.saveWorkspace = function() {
            let saveWorkspace = document.getElementById('file-save-workspace');
            let mouseEvent = new MouseEvent('click', {
                bubble: true,
                cancelable: true,
                view: window
            });
            let canceled = !saveWorkspace.dispatchEvent(mouseEvent);
        };

        this.menuBar.onClick.file.exportObject = function() {

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
            label: 'Save Workspace',
            click: editor.menuBar.onClick.file.saveWorkspace
        }));
        this.submenuFile.append(new nw.MenuItem({ type: 'separator' }));
        this.submenuFile.append(new nw.MenuItem({
            label: 'Export Object',
            click: editor.menuBar.onClick.file.exportObject
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

    document.getElementById('btn-new-object').addEventListener('click', function() {
        let editorWorkspace = editor.game.scene.scenes[1].editorWorkspace;

        editorWorkspace.createObject();
        editorWorkspace.openObjectId = editorWorkspace.objects.length - 1;
        let object = editorWorkspace.getObject(editorWorkspace.openObjectId);
        let fixture = editorWorkspace.createFixture({
            object: object
        });

        editorWorkspace.createVertex({
            fixture: fixture,
            x: 256,
            y: 256
        });

        editorWorkspace.createVertex({
            fixture: fixture,
            x: 320,
            y: 320
        });

        editorWorkspace.createVertex({
            fixture: fixture,
            x: 200,
            y: 420
        });

        editorWorkspace.loadObject(object.id);

        console.log('create object');
    });

    document.getElementById('btn-add-fixture').addEventListener('click', function() {
        let editorWorkspace = editor.game.scene.scenes[1].editorWorkspace;

        let object = editorWorkspace.getObject(editorWorkspace.openObjectId);

        let fixture = editorWorkspace.createFixture({
            object: object
        });

        editorWorkspace.createVertex({
            fixture: fixture,
            x: 256,
            y: 256
        });

        editorWorkspace.createVertex({
            fixture: fixture,
            x: 320,
            y: 320
        });

        editorWorkspace.createVertex({
            fixture: fixture,
            x: 200,
            y: 420
        });
    });

    document.getElementById('file-save-workspace').addEventListener('change', function() {
        let filePath = document.getElementById('file-save-workspace').value;

        if (filePath !== '') {
            let fs = require('fs');

            let workspaceData = Object.assign({}, editor.game.scene.scenes[1].editorWorkspace.getWorkspaceData());
            workspaceData.objects.forEach(function(object) {
                for (let i = 0; i < object.fixtures.length; i++) {
                    let fixture = object.fixtures[i];

                    for (let j = 0; j < fixture.vertices.length; j++) {
                        let vertex = fixture.vertices[j];

                        delete vertex.fixture;
                    }

                    delete fixture.object;
                }
            });

            fs.writeFile(filePath, JSON.stringify(workspaceData), function(err) {
                if (err) {
                    alert('unable to save file');
                }
                else {
                    alert('saved');
                }
            });
        }
        else {
            // user canceled
        }
    });

    document.getElementById('file-open-workspace').addEventListener('change', function() {
        let filePath = document.getElementById('file-open-workspace').value;

        let fs = require('fs');
        fs.readFile(filePath, 'utf8', function(err, data) {
            if (err) {
                alert(err);
            }

            editor.game.scene.scenes[1].editorWorkspace.openWorkspace(JSON.parse(data));
        });
    });
});

// PREVENT CONTEXT MENU FROM OPENING
document.addEventListener("contextmenu", function(evt){
    evt.preventDefault();
}, false);

function onWheelScroll(e) {
    var evt = window.event || e;
    var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta;
  
    editor.game.scene.scenes[1].editorWorkspace.onScrollWheelChanged(delta);
  
}
  
var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";

if (document.attachEvent) //if IE (and Opera depending on user setting)
    document.attachEvent("on"+mousewheelevt, onWheelScroll);
else if (document.addEventListener) //WC3 browsers
    document.addEventListener(mousewheelevt, onWheelScroll, false);

