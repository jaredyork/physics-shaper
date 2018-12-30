
var config = {
  type: Phaser.AUTO,
  parent: 'app-canvas',
  width: window.innerWidth,
  height: window.innerHeight - 32,
  transparent: true,
  roundPixels: false,
  pixelArt: true,
  scene: [SceneMain]
};

var app = new Phaser.Game(config);

var amountLoadedImages = 0;

function showLoadImageDialog() {
  document.getElementById("input-load-image").click();
}

function handleFileSelect(evt) {
  var file = evt.target.files[0];

  if (file !== undefined) {
    console.log("handleFileSelect called");

    if (!file.type.match('image.*')) {
      console.log("File uploaded is not an image!  Aborted.");
    }

    var reader = new FileReader();

    reader.onload = (function(theFile) {
      return function(e) {
        var image = e.target.result;
        
        console.log(image);

        console.log("Loaded " + theFile.name);
        app.scene.scenes[0].textures.addBase64("loadedImage" + amountLoadedImages, image);
        console.log(app.scene.scenes[0].textures.addBase64);

        amountLoadedImages++;
      }
    })(file);

    reader.readAsDataURL(file);
  }
}

window.addEventListener("resize", function() {
  var canvas = document.getElementsByTagName("canvas")[0];

  canvas.setAttribute("id", "app-canvas");

  canvas.style.width = window.innerWidth;
  canvas.style.height = window.innerHeight - 32;


  console.log("resized");
});

var btnLoadImage = document.getElementById("btn-load-image");
btnLoadImage.addEventListener("click", function() {
  showLoadImageDialog();
});

var inputLoadImage = document.getElementById("input-load-image");
inputLoadImage.addEventListener("change", handleFileSelect, false);

function onWheelScroll(e) {

  var evt = window.event || e;
  var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta;

  app.scene.scenes[0].onScrollWheelChanged(delta);

}

var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";

if (document.attachEvent) //if IE (and Opera depending on user setting)
    document.attachEvent("on"+mousewheelevt, onWheelScroll);
else if (document.addEventListener) //WC3 browsers
    document.addEventListener(mousewheelevt, onWheelScroll, false);