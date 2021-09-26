var win = nw.Window.get();
var gui = require('nw.gui');
var fs = require('fs');
const { exit } = require('process');
const { exception } = require('console');



const clone = require('rfdc')({ proto: true, circles: true });

console.log('functions');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function arrayMove(arr, old_index, new_index) {
    while (old_index < 0) {
        old_index += arr.length;
    }
    while (new_index < 0) {
        new_index += arr.length;
    }
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing purposes
};

class PolyDecompUtilties {
    static convert1DArrayToArrayPairs(array1d) {
        let arrayPairs = [];

        for (let i = 0; i < array1d.length; i += 2) {
            let x = array1d[i];
            let y = array1d[i + 1];
            arrayPairs.push([x, y]);
        }

        return arrayPairs;
    }

    static convertArrayPairsTo1DArray(arrayPairs) {
        let array1d = [];

        for (let i = 0; i < arrayPairs.length; i++) {
            let arrayPair = arrayPairs[i];

            array1d.push(arrayPair[0]);
            array1d.push(arrayPair[1]);
        }

        return array1d;
    }

    static convertVerticesToArrayPairs(vertices) {
        let arrayPairs = [];

        for (let i = 0; i < vertices.length; i++) {
            arrayPairs.push([vertices[i].x, vertices[i].y]);
        }

        return arrayPairs;
    }
}



class EditorObject {
    constructor() {
        this.imageKey = '';
        this.imageBase64 = '';
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
        this.id = args.id;
        this.label = args.label;
        this.isSensor = args.isSensor;
        this.vertices = null;
        this.circle = null;
    }
}

class EditorCircle {
    constructor(args) {
        this.fixture = args.fixture;
        this.id = args.id;
        this.x = args.x;
        this.y = args.y;
        this.radius = args.radius;
        this.editor = {
            isDragging: false
        };
    }
}

class EditorVertex {
    constructor(args) {
        this.fixture = args.fixture;
        this.id = args.id;
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
        this.vertexIdIterator = 0;
        this.objects = []; // an array of object data, one element per object
        this.openObjectId = 0;

        this.imageOverlay = null;
        this.originOverlayGraphics = this.scene.add.graphics();
        this.originOverlayGraphics.setAlpha(0.5);
        this.fixtureOverlayGraphics = this.scene.add.graphics();
        this.fixtureOverlayGraphics.setAlpha(0.5);
        this.fixtureDebugGraphics = this.scene.add.graphics();
        this.fixtureDebugGraphics.setAlpha(0.5);
        this.vertexSprites = this.scene.add.group();

        this.showPolyDecomposition = false;
        this.amountVerticesHoveredOver = 0;
        this.vertexDragging = null;
        this.isHoveringOverVertex = false;
    }

    clearWorkspace() {
        this.objectIdIterator = 0;
        this.fixtureIdIterator = 0;
        this.vertexIdIterator = 0;
        this.objects.length = 0;
        this.openObjectId = 0;

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
        console.log('');
        console.log('***OPEN WORKSPACE CALLED');
        this.clearWorkspace();
        console.log('clearWorkspace called');

        this.objectIdIterator = data.objectIdIterator;
        this.fixtureIdIterator = data.fixtureIdIterator;
        this.vertexIdIterator = data.vertexIdIterator;
        this.openObjectId = data.openObjectId;

        // Copy objects from data to the array in this class instance
        console.log('OBJECTS FOUND: ', data.objects);
        for (let i = 0; i < data.objects.length; i++) {
            let objectJson = data.objects[i];

            let object = new EditorObject();

            for (const [key, value] of Object.entries(objectJson)) {
                console.log('copying object prop ', key, value);
                object[key] = value;
            }

            if (object.imageKey !== undefined && object.imageBase64 !== undefined) {
                console.log('ATTEMPTING TO LOAD NEW IMAGE', object.imageKey, object.imageBase64);
                this.scene.textures.addBase64(object.imageKey, object.imageBase64);
            }

            console.log('PUSHING OBJECT', object);

            this.objects.push(object);
        }
        console.log('LOADED OBJECTS', this.objects);


        // Re-link object references
        for (var i = 0; i < this.objects.length; i++) {
            var object = this.objects[i];

            for (var j = 0; j < object.fixtures.length; j++) {
                var fixtureJson = object.fixtures[j];

                var fixture = new EditorFixture({
                    object: object,
                    id: fixtureJson.id,
                    label: fixtureJson.label,
                    isSensor: fixtureJson.isSensor,
                    vertices: fixtureJson.vertices
                });

                object.fixtures.push(fixture);

                if (fixtureJson.vertices !== null) {
                    console.log('fixtureJson', fixtureJson);
                    for (var k = 0; k < fixtureJson.vertices.length; k++) {
                        var vertexJson = fixtureJson.vertices[k];

                        var vertex = new EditorVertex({
                            fixture: fixture,
                            id: vertexJson.id,
                            x: vertexJson.x,
                            y: vertexJson.y
                        });

                        fixture.vertices.push(vertex);
                    }
                }
            }
        }



        this.regenerateThumbnails();

        this.openObjectId = this.objects[this.objects.length - 1].id;
        this.loadObject(this.openObjectId);

        console.log('***FINISHED OPEN WORKSPACE');
        console.log('');
    }

    loadNewImage(key, base64) {
        console.log('attempting to load new texture to key: ', key);
        editor.game.scene.scenes[1].textures.addBase64(key, base64);

        this.clearWorkspace();

        this.createObject();
        this.openObjectId = this.objects.length;
        console.log('attempting to load new image to new object (' + this.openObjectId + ')');
        let object = this.getObject(this.openObjectId);
        object.imageKey = key;
        object.imageBase64 = base64;

        this.loadObject(object.id);
    }

    getObjectExportData() {
        return clone({
            objects: this.objects
        });
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

                if (object.imageBase64 !== '') {
                    let imageBase64 = new Image();
                    imageBase64.src = object.imageBase64;
                    thumbnailCtx.drawImage(imageBase64, 0, 0);
                }

                object.fixtures.forEach(function(fixture) {
                    if (fixture.circle !== null) {
                        thumbnailCtx.save();
                        thumbnailCtx.globalAlpha = 0.5;
                        thumbnailCtx.arc(fixture.circle.x, fixture.circle.y, fixture.circle.radius, 0, 2 * Math.PI, false);
                        thumbnailCtx.fillStyle = '#0000ff';
                        thumbnailCtx.fill();
                        thumbnailCtx.restore();
                    }

                    if (fixture.vertices !== null) {
                        let vertexPairs = PolyDecompUtilties.convertVerticesToArrayPairs(fixture.vertices);

                        let isPolySimple = true;
                        if (decomp.isSimple(vertexPairs)) {
                            decomp.makeCCW(vertexPairs);
                        }

                        let vertices1D = PolyDecompUtilties.convertArrayPairsTo1DArray(vertexPairs);

                        let poly = new Phaser.Geom.Polygon(vertices1D);

                        thumbnailCtx.save();
                        if (isPolySimple) {
                            thumbnailCtx.fillStyle = '#0000ff';
                        }
                        else {
                            thumbnailCtx.fillStyle = '#ff0000';
                        }
                        thumbnailCtx.globalAlpha = 0.5;
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

    togglePolyDecompOverlay() {
        this.showPolyDecomposition = !this.showPolyDecomposition;
    }

    flushGraphics() {
        if (this.imageOverlay !== null) {
            this.imageOverlay.destroy();
        }
        this.fixtureOverlayGraphics.clear();
        this.fixtureDebugGraphics.clear();
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
        //console.log( 'OBJECTS', this.objects );
        for (let i = 0; i < this.objects.length; i++) {
            if (this.objects[i].id === id) {
                return this.objects[i];
            }
        }
        return null;
    }

    renderObjectWithOverlays(object) {
        this.flushGraphics();

        //console.log('RENDER OBJECT IMAGE KEY: ', object.imageKey);

        if (object.imageKey !== '') {
            this.imageOverlay = this.scene.add.image(0, 0, object.imageKey).setOrigin(0);
            this.imageOverlay.setDepth(-1);
        }

        object.fixtures.forEach(function(fixture) {
            if (fixture.circle !== undefined && fixture.circle !== null) {
                let circle = new Phaser.Geom.Circle(fixture.circle.x, fixture.circle.y, fixture.circle.radius);
                
                this.fixtureOverlayGraphics.lineStyle(2 * (1 / this.scene.cameras.main.zoom), 0x000000);
                this.fixtureOverlayGraphics.strokeCircleShape(circle);

                this.fixtureOverlayGraphics.fillStyle(0x0000ff);
                this.fixtureOverlayGraphics.fillCircleShape(circle);
            }

            if (fixture.vertices !== undefined && fixture.vertices !== null) {
                let vertexPairs = PolyDecompUtilties.convertVerticesToArrayPairs(fixture.vertices);

                if (decomp.isSimple(vertexPairs)) {
                    decomp.makeCCW(vertexPairs);
                }

                let convexPolygons = null;
                if (this.showPolyDecomposition) {
                    convexPolygons = decomp.quickDecomp(vertexPairs);
                }

                let vertices1D = PolyDecompUtilties.convertArrayPairsTo1DArray(vertexPairs);


                let poly = new Phaser.Geom.Polygon(vertices1D);
                if (decomp.isSimple(vertexPairs)) {
                    this.fixtureOverlayGraphics.fillStyle(0x0000ff);
                }
                else {
                    this.fixtureOverlayGraphics.fillStyle(0xff0000);
                }
                this.fixtureOverlayGraphics.fillPoints(poly.points, true);        


                this.fixtureOverlayGraphics.lineStyle(1 / this.scene.cameras.main.zoom, 0x000000);
                this.fixtureOverlayGraphics.beginPath();
                for (let i = 0; i < poly.points.length; i++) {
                    this.fixtureOverlayGraphics.lineTo(poly.points[i].x, poly.points[i].y);

                    let vertexSprite = this.scene.add.sprite(poly.points[i].x, poly.points[i].y, 'imgVertex').setOrigin(0.5);
                    vertexSprite.setScale(1 / this.scene.cameras.main.zoom);
                    vertexSprite.setInteractive();

                    let dist = Phaser.Math.Distance.Between(
                        this.scene.input.activePointer.worldX,
                        this.scene.input.activePointer.worldY,
                        poly.points[i].x,
                        poly.points[i].y
                    );

                    /*
                    let circle = new Phaser.Geom.Circle(poly.points[i].x, poly.points[i].y, dist);
                
                    this.fixtureDebugGraphics.lineStyle(2 * (1 / this.scene.cameras.main.zoom), 0x000000);
                    this.fixtureDebugGraphics.strokeCircleShape(circle);
    
                    this.fixtureDebugGraphics.fillStyle(0x00ffff);
                    this.fixtureDebugGraphics.fillCircleShape(circle);
                    */

                    if (dist < 16 * (1 / this.scene.cameras.main.zoom)) {
                        vertexSprite.setTint(0xff0000);
                    }

                    this.vertexSprites.add(vertexSprite);
                }
                this.fixtureOverlayGraphics.closePath();
                this.fixtureOverlayGraphics.strokePath();


                if (!this.isHoveringOverVertex) {
                    let pointerCircle = new Phaser.Geom.Circle(
                        this.scene.input.activePointer.worldX,
                        this.scene.input.activePointer.worldY,
                        8 / this.scene.cameras.main.zoom
                    );
                    for (let i = 0; i < poly.points.length; i++) {
                        if (i >= 0) {
                            let line = null;

                            if (i > 0) {
                                line = new Phaser.Geom.Line(poly.points[i - 1].x, poly.points[i - 1].y, poly.points[i].x, poly.points[i].y);
                            }
                            else if (i === 0) {
                                line = new Phaser.Geom.Line(poly.points[poly.points.length - 1].x, poly.points[poly.points.length - 1].y, poly.points[i].x, poly.points[i].y);
                            }

                            if (Phaser.Geom.Intersects.LineToCircle(line, pointerCircle)) {
                                this.fixtureOverlayGraphics.lineStyle(2 * (1 / this.scene.cameras.main.zoom), 0x000000);
                                this.fixtureOverlayGraphics.strokeCircleShape(pointerCircle);
                            }
                        }
                    }
                }


                if (convexPolygons !== null) {
                    for (let i = 0; i < convexPolygons.length; i++) {
                        let convexPolygon = convexPolygons[i];

                        if (decomp.isSimple(convexPolygon)) {
                            decomp.makeCCW(convexPolygon);
                        }

                        let convexPolygonArray1D = PolyDecompUtilties.convertArrayPairsTo1DArray(convexPolygon);
                        let convexPolygonGeom = new Phaser.Geom.Polygon(convexPolygonArray1D);
                        
                        this.fixtureOverlayGraphics.lineStyle(1 / this.scene.cameras.main.zoom, 0x000000);
                        this.fixtureOverlayGraphics.beginPath();
                        for (let j = 0; j < convexPolygonGeom.points.length; j++) {
                            this.fixtureOverlayGraphics.lineTo(convexPolygonGeom.points[j].x, convexPolygonGeom.points[j].y);
                        }
                        this.fixtureOverlayGraphics.closePath();
                        this.fixtureOverlayGraphics.strokePath();
                    }
                }

            }
        }.bind(this));



        // Update the thumbnail
        let thumbnail = document.getElementById('thumb-object' + object.id);
        if (thumbnail !== null) {
            let thumbnailCtx = thumbnail.getContext('2d');
            thumbnailCtx.clearRect(0, 0, thumbnail.width, thumbnail.height);

            if (object.imageBase64 !== '') {
                let imageBase64 = new Image();
                imageBase64.src = object.imageBase64;
                thumbnailCtx.drawImage(imageBase64, 0, 0);
            }

            object.fixtures.forEach(function(fixture) {
                if (fixture.circle !== null) {
                    thumbnailCtx.save();
                    thumbnailCtx.globalAlpha = 0.5;
                    thumbnailCtx.arc(fixture.circle.x, fixture.circle.y, fixture.circle.radius, 0, 2 * Math.PI, false);
                    thumbnailCtx.fillStyle = '#0000ff';
                    thumbnailCtx.fill();
                    thumbnailCtx.restore();
                }

                if (fixture.vertices !== null) {
                    let vertexPairs = PolyDecompUtilties.convertVerticesToArrayPairs(fixture.vertices);
                    
                    let isPolySimple = true;
                    if (decomp.isSimple(vertexPairs)) {
                        decomp.makeCCW(vertexPairs);
                    }
                    else {
                        isPolySimple = false;
                    }

                    let vertices1D = PolyDecompUtilties.convertArrayPairsTo1DArray(vertexPairs);

                    let poly = new Phaser.Geom.Polygon(vertices1D);

                    thumbnailCtx.save();
                    if (isPolySimple) {
                        thumbnailCtx.fillStyle = '#0000ff';
                    }
                    else {
                        thumbnailCtx.fillStyle = '#ff0000';
                    }
                    thumbnailCtx.globalAlpha = 0.5;
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

        
        // Set properties fields
        let objectProperties = [
            ['object-label', object.label],
            ['object-is-static', object.isStatic],
            ['object-density', object.density],
            ['object-restitution', object.restitution],
            ['object-friction', object.friction],
            ['object-friction-air', object.frictionAir],
            ['object-friction-static', object.frictionStatic]
        ];

        for (let i = 0; i < objectProperties.length; i++) {
            let objectProperty = objectProperties[i];

            if (objectProperties[1] === true || objectProperty[1] === false) {
                if (objectProperty[1] === true) {
                    document.getElementById(objectProperty[0]).checked = true;
                }
                else if (objectProperty[1] === false) {
                    document.getElementById(objectProperty[0]).checked = false;
                }
            }
            else {
                document.getElementById(objectProperty[0]).value = objectProperty[1];
            }
        }
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
            if (fixture.vertices !== null) {
                for (let i = 0; i < fixture.vertices.length; i++) {
                    let vertex = fixture.vertices[i];

                    if (vertex.editor === undefined) {
                        vertex.editor = {
                            isDragging: false
                        };
                    }
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
            id: this.fixtureIdIterator,
            label: 'untitled fixture',
            isSensor: false,
            vertices: []
        });
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
            id: this.vertexIdIterator,
            x: args.x,
            y: args.y
        });
        this.vertexIdIterator++;

        if (args.fixture.vertices === null) {
            args.fixture.vertices = [];
        }

        if (args.insertAt === undefined) {
            args.fixture.vertices.push(vertex);
        }
        else {
            args.fixture.vertices.splice(args.insertAt, 0, vertex);
        }

        return vertex;
    }

    createCircle(args) {
        let circle = new EditorCircle({
            fixture: args.fixture,
            id: this.vertexIdIterator,
            x: args.x,
            y: args.y,
            radius: args.radius
        });
        this.vertexIdIterator++;

        args.fixture.circle = circle;

        return circle;
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

    renderOrigin() {
        this.originOverlayGraphics.clear(true, true);

        this.originOverlayGraphics.lineStyle(1 / this.scene.cameras.main.zoom, 0x000000);

        this.originOverlayGraphics.beginPath();
        this.originOverlayGraphics.moveTo(0, 0);
        this.originOverlayGraphics.lineTo(32 * (1 / this.scene.cameras.main.zoom), 0);
        this.originOverlayGraphics.closePath();
        this.originOverlayGraphics.strokePath();

        this.originOverlayGraphics.beginPath();
        this.originOverlayGraphics.moveTo(0, 0);
        this.originOverlayGraphics.lineTo(0, 32 * (1 / this.scene.cameras.main.zoom));
        this.originOverlayGraphics.closePath();
        this.originOverlayGraphics.strokePath();
    }

    getWorkspaceData() {
        let workspaceData = {
            objectIdIterator: this.objectIdIterator,
            fixtureIdIterator: this.fixtureIdIterator,
            openObjectId: this.openObjectId,
            objects: this.objects
        };

        return clone(workspaceData);
    }

    onScrollWheelChanged(delta) {

        this.scene.cameras.main.setZoom(this.scene.cameras.main.zoom + (delta  * 0.001));
    
        if (this.scene.cameras.main.zoom < 0.1) {
          this.scene.cameras.main.setZoom(0.1);
        }
    
        //this.origin.setScale(1 / this.cameras.main.zoom);

        let object = this.getObject(this.openObjectId);

        this.renderOrigin();

        this.renderObjectWithOverlays(object);
    }

    update() {
        //console.log('START UPDATE');
        this.amountVerticesHoveredOver = 0;
        this.isHoveringOverVertex = false;

        if (!this.scene.isMouseDown) {
            if (this.openObjectId !== null) {
                //console.log('(UDPATE) OPEN OBJECT ID: ', this.openObjectId);
                let object = this.getObject(this.openObjectId);
    
                if (object !== null) {
                    object.fixtures.forEach(function(fixture) {
                        if (fixture.vertices !== null) {
                            for (let i = 0; i < fixture.vertices.length; i++) {
                                let vertex = fixture.vertices[i];

                                vertex.editor.isDragging = false;
                            }
                        }
                    });
                }
            }

            this.vertexDragging = null;
        }

        let pointerCircle = new Phaser.Geom.Circle(
            this.scene.input.activePointer.worldX,
            this.scene.input.activePointer.worldY,
            10 / this.scene.cameras.main.zoom
        );

        if (this.openObjectId !== null) {
            let object = this.getObject(this.openObjectId);

            if (object !== null) {
                object.fixtures.forEach(function(fixture) {

                    if (fixture.vertices !== null) {
                        fixture.vertices = this.makeVerticesCCW(fixture.vertices);

                        let vertices1d = this.convertVertexVectorsTo1DArray(fixture.vertices);
                        
                        let poly = new Phaser.Geom.Polygon(vertices1d);
                        this.fixtureOverlayGraphics.lineStyle(2 * (1 / this.scene.cameras.main.zoom), 0x000000);
                        this.fixtureOverlayGraphics.beginPath();
                        for (let i = 0; i < poly.points.length; i++) {
                            let createVertexArgs = {
                                fixture: fixture,
                                x: this.scene.input.activePointer.worldX,
                                y: this.scene.input.activePointer.worldY
                            };

                            if (i - 1 >= 0) {
                                createVertexArgs.insertAt = i;
                            }

                            if (i >= 0) {
                                let line = null;

                                let lastVertex = poly.points[i - 1];

                                if (i > 0) {
                                    line = new Phaser.Geom.Line(poly.points[i - 1].x, poly.points[i - 1].y, poly.points[i].x, poly.points[i].y);
                                }
                                else if (i === 0) {
                                    line = new Phaser.Geom.Line(poly.points[poly.points.length - 1].x, poly.points[poly.points.length - 1].y, poly.points[i].x, poly.points[i].y);
                                    lastVertex = poly.points[poly.points.length - 1];
                                }

                                if (Phaser.Geom.Intersects.LineToCircle(line, pointerCircle)) {
                                    if (this.scene.hasMouseDoubleClicked) {
                                        let distanceToIMinus1 = Phaser.Math.Distance.Between(
                                            this.scene.input.activePointer.worldX,
                                            this.scene.input.activePointer.worldY,
                                            lastVertex.x,
                                            lastVertex.y
                                        );
                                        let distanceToI = Phaser.Math.Distance.Between(
                                            this.scene.input.activePointer.worldX,
                                            this.scene.input.activePointer.worldY,
                                            poly.points[i].x,
                                            poly.points[i].y
                                        );
                                        if (distanceToIMinus1 > 16 * (1 / this.scene.cameras.main.zoom) &&
                                            distanceToI > 16 * (1 / this.scene.cameras.main.zoom)) {
                                            this.createVertex(createVertexArgs);
                                        }
                                    }
                                }
                            }
                        }

                        for (let i = 0; i < fixture.vertices.length; i++) {
                            let vertex = fixture.vertices[i];

                            let dist = Phaser.Math.Distance.Between(vertex.x, vertex.y, this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);
                            if (dist < 16 * (1 / this.scene.cameras.main.zoom)) {
                                this.amountVerticesHoveredOver++;

                                if (this.scene.isMouseDown && this.vertexDragging === null) {
                                    this.vertexDragging = vertex.id;
                                    vertex.editor.isDragging = true;
                                }
                            }
                        }
                    }
                }.bind(this));

                if (this.amountVerticesHoveredOver > 0) {
                    this.isHoveringOverVertex = true;
                }


                object.fixtures.forEach(function(fixture) {
                    if (fixture.vertices !== null) {
                        for (let i = 0; i < fixture.vertices.length; i++) {
                            let vertex = fixture.vertices[i];

                            if (vertex.editor.isDragging) {
                                vertex.x = this.scene.input.activePointer.worldX;
                                vertex.y = this.scene.input.activePointer.worldY;
                            }
                        }
                    }
                }.bind(this));


                this.renderOrigin();
                if (object !== null) {
                    this.renderObjectWithOverlays(object);
                }
            }
        }

        //console.log('END UPDATE');
        //console.log('');
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

        this.textures.on("addtexture", function(key) {
        }, this);

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

        // This resize call is necessary to prevent weird pointer pos offset from DOM elements
        this.scale.resize(this.scale.width, this.scale.height);
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
        }
        else if (this.lastIsMouseDown && !this.isMouseDown) {
            this.cameraDragOrigin = new Phaser.Math.Vector2(
                this.input.activePointer.x,
                this.input.activePointer.y
            );
            this.cameraDragging = false;

            if (this.elapsedTicksSinceLastClick < 15) {
                this.hasMouseDoubleClicked = true;
            }

            this.elapsedTicksSinceLastClick = 0;
        }

        this.editorWorkspace.update();

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
                width: window.innerWidth,
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

        this.menuBar.onClick.file.exportObjects = function() {
            let exportObjects = document.getElementById('file-export-objects');
            let mouseEvent = new MouseEvent('click', {
                bubble: true,
                cancelable: true,
                view: window
            });
            let canceled = !exportObjects.dispatchEvent(mouseEvent);
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

        this.menuBar.onClick.view.togglePolyDecompOverlay = function() {
            this.game.scene.scenes[1].editorWorkspace.togglePolyDecompOverlay();
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

class EditorMenuBarMenu {
    constructor() {
        this.menuItems = [];
    }

    append(menuItem) {
        this.menuItems.push(menuItem);
    }
}

class EditorMenuBarItem {
    constructor(args) {
        this.label = args.label;
        this.click = args.click;
        this.type = args.type;
        this.submenu = args.submenu;
    }
}

class MenuBar {
    constructor() {
        this.menuItems = [];
    }

    setup(editor) {
        this.submenuFile = new EditorMenuBarMenu();
        this.submenuFile.append(new EditorMenuBarItem({
            label: 'New Workspace',
            click: editor.menuBar.onClick.file.newWorkspace
        }));
        this.submenuFile.append(new EditorMenuBarItem({
            label: 'Open Workspace',
            click: editor.menuBar.onClick.file.openWorkspace
        }));
        this.submenuFile.append(new EditorMenuBarItem({ type: 'separator' }));
        this.submenuFile.append(new EditorMenuBarItem({
            label: 'Save Workspace',
            click: editor.menuBar.onClick.file.saveWorkspace
        }));
        this.submenuFile.append(new EditorMenuBarItem({ type: 'separator' }));
        this.submenuFile.append(new EditorMenuBarItem({
            label: 'Export Objects',
            click: editor.menuBar.onClick.file.exportObjects
        }));
        this.submenuFile.append(new EditorMenuBarItem({ type: 'separator' }));
        this.submenuFile.append(new EditorMenuBarItem({
            label: 'Exit',
            click: editor.menuBar.onClick.file.exit
        }));


        this.submenuView = new EditorMenuBarMenu();
        this.submenuView.append(new EditorMenuBarItem({
            label: 'Recenter View',
            click: editor.menuBar.onClick.view.recenterView
        }));
        this.submenuView.append(new EditorMenuBarItem({
            label: 'Reset Zoom',
            click: editor.menuBar.onClick.view.resetZoom
        }));
        this.submenuView.append(new EditorMenuBarItem({
            label: 'Toggle Poly Decomposition Overlay',
            click: editor.menuBar.onClick.view.togglePolyDecompOverlay
        }));



        this.submenuThemes = new EditorMenuBarMenu();
        let themesDir = 'styles/themes/';
        let themeDirs = fs.readdirSync(themesDir).filter(function(file) {
            return fs.statSync(themesDir + file).isDirectory();
        });

        console.log('THEME DIRS: ', themeDirs);


        for (let i = 0; i < themeDirs.length; i++) {
            let themeDir = themeDirs[i];

            fs.readFile(themesDir + themeDir + '/styles.css', 'utf8', (err, data) => {
                if (err) {
                    console.log(err);
                }

                let headerComment = data.match(/\/\*[\s\S]*\*\//gm)[0];
                console.log('headerComment', headerComment);
                let headerCommentArray = headerComment.split(/\r?\n/);

                for (let j = 0; j < headerCommentArray.length; j++) {
                    headerCommentArray[j] = headerCommentArray[j].replace('*', '');
                    headerCommentArray[j] = headerCommentArray[j].replace('/', '');
                    headerCommentArray[j] = headerCommentArray[j].replace("\\", '');
                    headerCommentArray[j] = headerCommentArray[j].trim();

                    if (headerCommentArray[j] === '') {
                        headerCommentArray.splice(j, 1);
                        j--;
                    }

                    
                }


                console.log('HEADER COMMENT: ', headerCommentArray);

                console.log('theme data', data);
            });
        }



        this.submenuHelp = new EditorMenuBarMenu();
        this.submenuHelp.append(new EditorMenuBarItem({
            label: 'About Physics Shaper',
            click: editor.menuBar.onClick.help.aboutPhysicsShaper
        }));

        this.submenuHelp.append(new EditorMenuBarItem({
            label: 'Find Us on GitHub',
            icon: 'assets/imgIconGitHubMark.png',
            click: editor.menuBar.onClick.help.findUsOnGithub
        }));

        
        
        this.append(new EditorMenuBarItem({
            label: 'File',
            submenu: this.submenuFile
        }));

        this.append(new EditorMenuBarItem({
            label: 'View',
            submenu: this.submenuView
        }));

        this.append(new EditorMenuBarItem({
            label: 'Themes',
            submenu: this.submenuThemes
        }));

        this.append(new EditorMenuBarItem({
            label: 'Help',
            submenu: this.submenuHelp
        }));


        let menuBar = document.getElementsByClassName('menuBar')[0];

        this.menuItems.forEach(function(menuItem) {
            let btnTrigger = document.createElement('div');
            let btnTriggerSpan = document.createElement('span');
            btnTriggerSpan.setAttribute('class', 'btn-menuBar-menu');
            btnTriggerSpan.innerHTML = menuItem.label;
            if (menuItem.click !== undefined) {
                btnTrigger.addEventListener('click', menuItem.click);
            }
            btnTrigger.appendChild(btnTriggerSpan);

            let list = null;

            if (menuItem.submenu !== undefined) {
                list = document.createElement('ul');
                list.setAttribute('class', 'menuBar-dropdown');

                if (menuItem.click === undefined) {
                    btnTrigger.addEventListener('click', function() {
                        let menuBarGroups = menuBar.childNodes;

                        for (let i = 0; i < menuBarGroups.length; i++) {
                            let closeDropdownMenuItem = menuBarGroups[i];

                            let closeDropdownMenuItemDropdown = closeDropdownMenuItem.childNodes[1];

                            closeDropdownMenuItemDropdown.removeAttribute('data-open');
                        }

                        if (list.getAttribute('data-open')) {
                            list.removeAttribute('data-open');
                        }
                        else {
                            list.setAttribute('data-open', true);
                        }
                    }.bind(this));
                }

                for (let i = 0; i < menuItem.submenu.menuItems.length; i++) {
                    let submenuMenuItem = menuItem.submenu.menuItems[i];

                    if (submenuMenuItem.type === undefined) {
                        let li = document.createElement('li');
                    
                        let a = document.createElement('a');
                        a.setAttribute('class', 'btn-submenu-item');
                        a.innerHTML = submenuMenuItem.label;
    
                        li.appendChild(a);
                        
                        if (submenuMenuItem.click !== undefined) {
                            li.addEventListener('click', submenuMenuItem.click);
                        }
    
                        list.appendChild(li);
                    }
                    else {
                        switch (submenuMenuItem.type) {
                            case 'separator': {
                                let li = document.createElement('li');

                                let hr = document.createElement('hr');

                                li.appendChild(hr);

                                list.appendChild(li);
                                break;
                            }
                        }
                    }

                }
            }

            let menuBarDropdownGroup = document.createElement('div');
            menuBarDropdownGroup.setAttribute('class', 'menuBar-dropdown-group');

            menuBarDropdownGroup.appendChild(btnTrigger);
            menuBarDropdownGroup.appendChild(list);

            menuBar.appendChild(menuBarDropdownGroup);
        }.bind(this));
    }

    append(menuItem) {
        this.menuItems.push(menuItem);
    }
}

let editor = null;

function handleFileSelect(evt) {
    for (let i = 0; i < evt.target.files.length; i++) {
        var file = evt.target.files[i];
    
        if (file !== undefined) {
            console.log("handleFileSelect called");

            if (!file.type.match('image.*')) {
            console.log("File uploaded is not an image!  Aborted.");
            }

            var reader = new FileReader();

            reader.onload = (function(theFile) {
                return function(e) {
                    var image = e.target.result;
                    
                    editor.game.scene.scenes[1].editorWorkspace.loadNewImage("loadedImage" + (editor.game.scene.scenes[1].editorWorkspace.objectIdIterator), image);
                }
            })(file);

            reader.readAsDataURL(file);
        }
    }
}

window.addEventListener('DOMContentLoaded', function() {
    editor = new Editor();
    let menuBar = new MenuBar();
    menuBar.setup(editor);

    document.addEventListener('click', function(evt) {
        // if the click wasn't on a menu item, close any open menu dropdowns
        let menuDropdowns = document.querySelectorAll('.menuBar .menuBar-dropdown[data-open="true"]');
        let clickedOnMenuDropdown = false;
        for (let i = 0; i < menuDropdowns.length; i++) {
            let menuDropdown = menuDropdowns[i];

            let btnTrigger = menuDropdown.parentNode.childNodes[0].childNodes[0];

            if (Object.is(menuDropdown, evt.target) || Object.is(btnTrigger, evt.target)) {
                clickedOnMenuDropdown = true;
            }
        }

        if (!clickedOnMenuDropdown) {
            for (let i = 0; i < menuDropdowns.length; i++) {
                let menuDropdown = menuDropdowns[i];

                menuDropdown.removeAttribute('data-open');
            }
        }
    });

    let isMaximized = false;
    let isMinimized = false;

    win.on('restore', () => {
        isMinimized = false;
        isMaximized = false;
    });
    win.on('minimize', () => isMinimized = false);
    win.on('maximize', () => isMaximized = true);

    document.getElementsByClassName('btn-minimize')[0].addEventListener('click', function() {
        if (isMaximized) {
            win.restore();
        }
        else {
            win.minimize();
        }
    });

    document.getElementsByClassName('btn-maximize')[0].addEventListener('click', function() {
        if (isMinimized) {
            win.restore();
        }
        else {
            win.maximize();
        }
    });

    document.getElementsByClassName('btn-close')[0].addEventListener('click', function() {
        nw.App.closeAllWindows();
    });

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

    document.getElementById('btn-new-image').addEventListener('click', function() {
        let openWorkspace = document.getElementById('file-open-image');
        let mouseEvent = new MouseEvent('click', {
            bubble: true,
            cancelable: true,
            view: window
        });
        let canceled = !openWorkspace.dispatchEvent(mouseEvent);
    });

    document.getElementById('file-open-image').addEventListener('change', handleFileSelect, false);

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

    document.getElementById('btn-add-circle').addEventListener('click', function() {
        let editorWorkspace = editor.game.scene.scenes[1].editorWorkspace;

        let object = editorWorkspace.getObject(editorWorkspace.openObjectId);

        let fixture = editorWorkspace.createFixture({
            object: object
        });

        editorWorkspace.createCircle({
            fixture: fixture,
            x: 64,
            y: 64,
            radius: 30
        });
    });



    document.getElementById('file-save-workspace').addEventListener('change', function() {
        let filePath = document.getElementById('file-save-workspace').value;

        if (filePath !== '') {
            let fs = require('fs');

            let workspaceData = editor.game.scene.scenes[1].editorWorkspace.getWorkspaceData();
            workspaceData.objects.forEach(function(object) {
                for (let i = 0; i < object.fixtures.length; i++) {
                    let fixture = object.fixtures[i];

                    if (fixture.circle === null) {
                        delete fixture.circle;
                    }
                    else {
                        delete fixture.circle.fixture;
                    }

                    if (fixture.vertices === null) {
                        delete fixture.vertices;
                    }
                    else {
                        for (let j = 0; j < fixture.vertices.length; j++) {
                            let vertex = fixture.vertices[j];

                            delete vertex.fixture;
                        }
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

    document.getElementById('file-export-objects').addEventListener('change', function() {
        let filePath = document.getElementById('file-export-objects').value;

        if (filePath !== '') {
            let fs = require('fs');

            let objectData = editor.game.scene.scenes[1].editorWorkspace.getObjectExportData();
            
            // Remove object references
            objectData.objects.forEach(function(object) {
                for (let i = 0; i < object.fixtures.length; i++) {
                    let fixture = object.fixtures[i];

                    if (fixture.circle === null) {
                        delete fixture.circle;
                    }
                    else {
                        delete fixture.circle.fixture;
                        delete fixture.circle.id;
                        delete fixture.circle.editor;
                    }

                    if (fixture.vertices === null) {
                        delete fixture.vertices;
                    }
                    else {
                        for (let j = 0; j < fixture.vertices.length; j++) {
                            let vertex = fixture.vertices[j];

                            delete vertex.fixture;
                            delete vertex.id;
                            delete vertex.editor;
                        }
                    }

                    delete fixture.object;
                    delete fixture.id;
                    delete fixture.editor;
                }
            });

            let exporters = {
                PHASER_3: 'PHASER_3'
            };
            let exporter = exporters.PHASER_3;

            let exportedFileObject = {};

            console.log('OBJECT DATA: ', objectData);

            switch (exporter) {
                case exporters.PHASER_3: {
                    exportedFileObject = {
                        'generator_info': 'Shape definitions generated with Physics Shaper.  Visit https://github.com/jaredyork/physics-shaper',
                    };

                    for (let i = 0; i < objectData.objects.length; i++) {
                        let object = objectData.objects[i];

                        exportedFileObject[object.label] = {
                            type: 'fromPhysicsShaper',
                            label: object.label,
                            isStatic: object.isStatic,
                            density: object.density,
                            restitution: object.restitution,
                            friction: object.friction,
                            frictionAir: object.frictionAir,
                            frictionStatic: object.frictionStatic,
                            collisionFilter: object.collisionFilter,
                            fixtures: object.fixtures
                        };
                    }

                    break;
                }
            }

            console.log('EXPORTED FILE OBJECT: ', exportedFileObject)


            fs.writeFile(filePath, JSON.stringify(exportedFileObject), function(err) {
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



    let objectPropertyFieldIds = [
        'object-label',
        'object-is-static',
        'object-density',
        'object-restitution',
        'object-friction',
        'object-friction-air',
        'object-friction-static',
    ];

    for (let i = 0; i < objectPropertyFieldIds.length; i++) {
        let objectPropertyFieldId = objectPropertyFieldIds[i];

        let thisField = document.getElementById(objectPropertyFieldId);

        thisField.addEventListener('keyup', function() {
            let object = editor.game.scene.scenes[1].editorWorkspace.getObject(editor.game.scene.scenes[1].editorWorkspace.openObjectId);

            switch (thisField.id) {
                case 'object-label': { object.label = thisField.value; break; }
                case 'object-is-static': { object.isStatic = thisField.checked; break; }
                case 'object-density': { object.density = thisField.value; break; }
                case 'object-restitution': { object.restitution = thisField.value; break; }
                case 'object-friction': { object.friction = thisField.value; break; }
                case 'object-friction-air': { object.frictionAir = thisField.value; break; }
                case 'object-friction-static': { object.frictionStatic = thisField.value; break; }
            }
        });
    }
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

