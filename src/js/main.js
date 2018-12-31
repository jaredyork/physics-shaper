
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
        
        console.log("Loaded " + theFile.name);
        app.scene.scenes[0].textures.addBase64("loadedImage" + amountLoadedImages, image);

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

var btnNew = document.getElementById("btn-new");
btnNew.addEventListener("click", function() {
  editor.restartScene();
});

var btnLoadImage = document.getElementById("btn-load-image");
btnLoadImage.addEventListener("click", function() {
  showLoadImageDialog();
});

var inputLoadImage = document.getElementById("input-load-image");
inputLoadImage.addEventListener("change", handleFileSelect, false);

var btnExport = document.getElementById("btn-export");
btnExport.addEventListener("click", function() {
  editor.exportJSON(Editor.getExportFormats().PHASER_3);
});

var btnClearLastPoint = document.getElementById("btn-clear-last-point");
btnClearLastPoint.addEventListener("click", function() {
  editor.clearLastPoint();
});

var btnClearPoints = document.getElementById("btn-clear-points");
btnClearPoints.addEventListener("click", function() {
  editor.clearAllPoints();
});

var btnMenuItems = document.getElementsByClassName("btn-menuitem");
for (var i = 0; i < btnMenuItems.length; i++) {
  var btn = btnMenuItems[i];

  btn.addEventListener("click", function() {

    // Show the menuitem-content which is a sibling of btn-menuitem
    var siblings = this.parentNode.childNodes;
    for (var j = 0; j < siblings.length; j++) {
      var sibling = siblings[j];
      if (sibling.className == "menuitem-content") {

        if (sibling.style.display == "none") {
          sibling.style.position = "absolute";
          sibling.style.display = "flex";
          sibling.style.flexDirection = "column";
          sibling.style.top = "32px";
          sibling.style.border = "1px solid #333";
          console.log("set menuitem-content display to block");
        }
        else if (sibling.style.display == "flex") {
          sibling.style.display = "none";
        }
      }
    }

  });
}

window.addEventListener("click", function(evt) {
  
  if (!evt.target.className == "btn-menustrip") {
    // Hide all elements with menuitem-content classes
    var menuItemContents = document.getElementsByClassName("menuitem-content");
    for (var i = 0; i < menuItemContents.length; i++) {
      menuItemContents[i].style.display = "none";
    }
  }
  else {

    var siblings = evt.target.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i];
      if (sibling.className == "menuitem-content") {

        // Hide all elements with menuitem-content classes
        var menuItemContents = document.getElementsByClassName("menuitem-content");
        for (var j = 0; j < menuItemContents.length; j++) {
          if (!menuItemContents[j].isEqualNode(sibling)) {
            menuItemContents[j].style.display = "none";
            console.log("set menuitemcontent to none");
          }
        }

      }
    }

  }

});

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