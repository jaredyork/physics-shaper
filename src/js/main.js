class InAppWindowManager {
  constructor() {
    this.amountInAppWindows = 0;

    this.inAppWindows = [];
  }

  add(win) {
    win.window.style.zIndex = 2 + this.amountInAppWindows;
    this.inAppWindows.push(win);
    this.amountInAppWindows++;
  }

  remove(win) {
    for (var i = 0; i < this.inAppWindows.length; i++) {
      if (this.inAppWindows[i].id == win.id) {
        this.inAppWindows = this.inAppWindows.splice(i, 1);
      }
    }

    this.amountInAppWindows--;
  }
}

class InAppWindow {
  constructor(properties) {
    this.id = properties.id;
    this.titleCaption = properties.titleCaption;

    var windowWidth = properties.width;
    var windowHeight = properties.height;
    var safePadding = properties.safePadding !== undefined ? properties.safePadding : 128;

    // Create the 'Window' itself
    this.window = document.createElement("div");
    this.window.inAppWindowInstance = this;
    this.window.setAttribute("class", "in-app-window");
    this.window.setAttribute("id", this.id);
    this.window.style.position = "fixed";

    this.window.style.top = randInt(safePadding, window.innerHeight - windowHeight - safePadding) + "px";
    this.window.style.left = randInt(safePadding, window.innerWidth - windowWidth - safePadding) + "px";
    this.window.style.width = windowWidth + "px";
    this.window.style.height = windowHeight + "px";

    this.window.displayWidth = windowWidth;
    this.window.displayHeight = windowHeight;

    // Create the titlebar
    this.titleBar = document.createElement("div");
    this.titleBar.setAttribute("class", "in-app-window-titlebar");
    this.titleBar.style.borderRight = "2px solid #333";
    this.titleBar.style.borderLeft = "2px solid #333";
    this.window.appendChild(this.titleBar);

    // Create the title
    this.title = document.createElement("p");
    this.title.innerHTML = this.titleCaption;
    this.title.setAttribute("class", "in-app-window-title");
    this.title.style.position = "relative";
    this.title.style.top = "25%";
    this.title.style.color = "white";
    this.titleBar.appendChild(this.title);

    // Create close button
    this.btnClose = document.createElement("a");
    this.btnClose.innerHTML = "✕";
    this.btnClose.setAttribute("class", "btn-in-app-window-close");
    this.titleBar.appendChild(this.btnClose);

    // Create the content wrapper
    this.windowContentWrapper = document.createElement("div");
    this.windowContentWrapper.setAttribute("class", "in-app-window-content-wrapper");
    this.windowContentWrapper.style.position = "relative";
    this.windowContentWrapper.style.width = "100%";
    this.windowContentWrapper.style.height = "100%";
    this.windowContentWrapper.style.padding = "32px;"
    this.windowContentWrapper.style.borderRight = "2px solid #222";
    this.windowContentWrapper.style.borderBottom = "2px solid #222";
    this.windowContentWrapper.style.borderLeft = "2px solid #222";
    this.window.appendChild(this.windowContentWrapper);


    var body = document.getElementsByTagName("body")[0];
    
    body.appendChild(this.window);
  }

  addToWindowContent(element) {
    this.windowContentWrapper.append(element);
  }
}

class AboutWindow extends InAppWindow {
  constructor() {
    super({
      id: "window-help-about",
      titleCaption: "About",
      width: 400,
      height: 140
    });

    // Create a heading to display 'Physics Shaper'
    var heading = document.createElement("h1");
    heading.innerHTML = "Physics Shaper";
    heading.setAttribute("class", "heading-l");
    heading.style.textAlign = "center";
    this.addToWindowContent(heading);

    var version = document.createElement("p");
    version.innerHTML = "Version: v1.0";
    version.style.textAlign = "center";
    this.addToWindowContent(version);
  }
}

function randInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


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

var inAppWindowManager = new InAppWindowManager();

var isMouseDown = false;
var windowDragged = null;

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

var btnHelpAbout = document.getElementById("btn-help-about");
btnHelpAbout.addEventListener("click", function() {
  var help = new AboutWindow();
  inAppWindowManager.add(help);
});

window.addEventListener("click", function(evt) {

  console.log(evt.target);
  
  if (evt.target.className == "btn-menuitem" || evt.target.className == "fake-checkbox") {
    // If the user clicked a menuitem, stop displaying other menuitem dropdowns
    var siblings = evt.target.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i];
      if (sibling.className == "menuitem-content") {

        // Hide all elements with menuitem-content classes
        var menuItemContents = document.getElementsByClassName("menuitem-content");
        for (var j = 0; j < menuItemContents.length; j++) {
          if (!menuItemContents[j].isEqualNode(sibling)) {
            menuItemContents[j].style.display = "none";
          }
        }

      }
    }
  }
  else {
    // Hide all elements with menuitem-content classes
    var menuItemContents = document.getElementsByClassName("menuitem-content");
    for (var i = 0; i < menuItemContents.length; i++) {
      console.log(i);
      menuItemContents[i].style.display = "none";
    }

    if (evt.target.className == "btn-in-app-window-close") {
      var win = evt.target.parentNode.parentNode;

      inAppWindowManager.remove(win.inAppWindowInstance);

      console.log(win);

      document.getElementsByTagName("body")[0].removeChild(win);
    }
  }

});

window.addEventListener("mousedown", function(evt) {
  isMouseDown = true;

  if (evt.target.className == "in-app-window-titlebar") {
    var win = evt.target.parentNode;

    windowDragged = win;
  }
  else if (evt.target.className == "in-app-window-title") {
    var win = evt.target.parentNode.parentNode;

    windowDragged = win;
  }
});

window.addEventListener("mouseup", function() {
  isMouseDown = false;

  windowDragged = null;
});

window.addEventListener("mousemove", function(evt) {
  
  if (isMouseDown) {
    console.log("mouse down " + evt.x + "," + evt.y);
      
    if (windowDragged !== null) {
      windowDragged.style.top = (evt.y - (16)) + "px";
      windowDragged.style.left = (evt.x - (windowDragged.displayWidth * 0.5)) + "px";
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