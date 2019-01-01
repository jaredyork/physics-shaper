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

    this.windowWidth = properties.width;
    this.windowHeight = properties.height;
    var safePadding = properties.safePadding !== undefined ? properties.safePadding : 128;

    // Create the 'Window' itself
    this.window = document.createElement("div");
    this.window.inAppWindowInstance = this;
    this.window.setAttribute("class", "in-app-window");
    this.window.setAttribute("id", this.id);
    this.window.style.position = "fixed";

    this.window.style.top = randInt(safePadding, window.innerHeight - this.windowHeight - safePadding) + "px";
    this.window.style.left = randInt(safePadding, window.innerWidth - this.windowWidth - safePadding) + "px";
    this.window.style.width = this.windowWidth + "px";
    this.window.style.height = this.windowHeight + "px";

    this.window.displayWidth = this.windowWidth;
    this.window.displayHeight = this.windowHeight;

    // Create the titlebar
    this.titleBar = document.createElement("div");
    this.titleBar.setAttribute("class", "in-app-window-titlebar");
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
    this.window.appendChild(this.windowContentWrapper);

    this.windowContentPadding = document.createElement("div");
    this.windowContentPadding.setAttribute("class", "in-app-window-content-padding");
    this.windowContentWrapper.appendChild(this.windowContentPadding);

    var body = document.getElementsByTagName("body")[0];
    
    body.appendChild(this.window);
  }

  addToWindowContent(element) {
    this.windowContentPadding.append(element);
  }
}

class FixtureSelectorWindow extends InAppWindow {
  constructor() {
    super({
      id: "window-view-fixture-selector",
      titleCaption: "Fixture Selector",
      width: 180,
      height: 600
    });

    var heading = document.createElement("h3");
    heading.innerHTML = "Fixtures";
    heading.setAttribute("class", "heading-s");
    heading.style.textAlign = "center";
    this.addToWindowContent(heading);

    var iframe = document.createElement("iframe");
    iframe.style.background = "#e9e9e9";
    iframe.style.display = "block";
    iframe.style.width = "100%";
    iframe.style.height = (this.windowHeight - 128) + "px";
    iframe.style.border = "1px solid #000000";
    
    var fixtureSelectorContainer = document.createElement("div");
    iframe.appendChild(fixtureSelectorContainer);

    this.addToWindowContent(iframe);
  }
}

class ImageEditorWindow extends InAppWindow {
  constructor() {
    super({
      id: "window-view-image-editor",
      titleCaption: "Image Editor",
      width: 320,
      height: 400
    });

    var heading = document.createElement("h3");
    heading.innerHTML = "Image";
    heading.setAttribute("class", "heading-s");
    heading.style.textAlign = "center";
    this.addToWindowContent(heading);

    var tbWidth = createTextbox("Width", "tb_width");
    this.addToWindowContent(tbWidth);
    var tbHeight = createTextbox("Height", "tb_height");
    this.addToWindowContent(tbHeight);
    var tbOriginPixelX = createTextbox("Origin (pixel) X", "tb_origin_pixel_x");
    this.addToWindowContent(tbOriginPixelX);
    var tbOriginPixelY = createTextbox("Origin (pixel) Y", "tb_origin_pixel_y");
    this.addToWindowContent(tbOriginPixelY);
  }
}

class FixtureEditorWindow extends InAppWindow {
  constructor() {
    super({
      id: "window-view-fixture-editor",
      titleCaption: "Fixture Editor",
      width: 320,
      height: 400
    });

    var heading = document.createElement("h3");
    heading.innerHTML = "Fixture";
    heading.setAttribute("class", "heading-s");
    heading.style.textAlign = "center";
    this.addToWindowContent(heading);

    var tbDensity = createTextbox("Density", "tb_density");
    this.addToWindowContent(tbDensity);
    var tbFriction = createTextbox("Friction", "tb_friction");
    this.addToWindowContent(tbFriction);
    var tbRestitution = createTextbox("Restitution", "tb_restitution");
    this.addToWindowContent(tbRestitution);
    var cbIsSensor = createCheckbox("Is Sensor", "cb_is_sensor");
    this.addToWindowContent(cbIsSensor);
    var tbGroup = createTextbox("Group", "tb_group");
    this.addToWindowContent(tbGroup);
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

function createTextbox(labelName, id) {
  var p = document.createElement("p");
  p.setAttribute("class", "input-form");

  var label = document.createElement("label");
  label.innerHTML = labelName;
  p.appendChild(label);

  var tb = document.createElement("input");
  tb.setAttribute("class", "txtfield");
  tb.setAttribute("id", id);
  tb.setAttribute("type", "text");
  p.appendChild(tb);

  return p;
}

function createCheckbox(labelName, id) {
  var p = document.createElement("p");

  var label = document.createElement("label");
  label.setAttribute("class", "input-form-checkbox");
  label.innerHTML = labelName;
  p.appendChild(label);

  var cb = document.createElement("input");
  cb.setAttribute("id", id);
  cb.setAttribute("type", "checkbox");
  p.appendChild(cb);

  return p;
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

function setTheme(folderName) {

  // Remove the existing linked theme first
  document.getElementById("theme-file").remove();

  // Add the theme link
  var link = document.createElement("link");
  link.setAttribute("id", "theme-file");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");
  link.setAttribute("href", "css/themes/theme_" + folderName + "/styles.css");
  document.getElementsByTagName("head")[0].appendChild(link);

  // Save the folder name to localStorage
  window.localStorage.setItem("theme", folderName);

}

function addThemeButton(name, folderName) {

  var a = document.createElement("a");
  a.innerHTML = name;
  a.href = "#";
  a.addEventListener("click", function() {
    setTheme(folderName);
  });

  return a;
}

function loadThemes() {
  
  var themeList = document.getElementById("theme-list");

  themeList.appendChild(addThemeButton("Light", "light"));
  themeList.appendChild(addThemeButton("Dark", "dark"));

  // Load existing theme stored in localStorage, if one exists
  if (window.localStorage.getItem("theme") !== undefined) {
    setTheme(window.localStorage.getItem("theme"));
  }
}

window.addEventListener("DOMContentLoaded", function() {
  loadThemes();
});

function showLoadImageDialog() {
  document.getElementById("input-load-image").click();
}

function handleFileSelect(evt) {
  var file = evt.target.files[0];

  if (file !== undefined) {

    if (!file.type.match('image.*')) {
      console.warn("File uploaded is not an image!  Aborted loading.");
    }

    var reader = new FileReader();

    reader.onload = (function(theFile) {
      return function(e) {
        var image = e.target.result;
        
        app.scene.scenes[0].textures.addBase64("loadedImage" + amountLoadedImages, image);

      }
    })(file);

    reader.readAsDataURL(file);
  }
}

window.addEventListener("resize", function() {
  app.resize(window.innerWidth, window.innerHeight - 32);
  app.scene.scenes[0].cameras.resize(window.innerWidth, window.innerHeight - 32);
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
        }
        else if (sibling.style.display == "flex") {
          sibling.style.display = "none";
        }
      }
    }

  });
}

var btnViewFixtureSelector = document.getElementById("btn-view-fixture-selector");
btnViewFixtureSelector.addEventListener("click", function() {
  var selector = new FixtureSelectorWindow();
  inAppWindowManager.add(selector);
});

var btnViewImageEditor = document.getElementById("btn-view-image-editor");
btnViewImageEditor.addEventListener("click", function() {
  var editor = new ImageEditorWindow();
  inAppWindowManager.add(editor);
});

var btnViewFixtureEditor = document.getElementById("btn-view-fixture-editor");
btnViewFixtureEditor.addEventListener("click", function() {
  var editor = new FixtureEditorWindow();
  inAppWindowManager.add(editor);
});

var btnHelpAbout = document.getElementById("btn-help-about");
btnHelpAbout.addEventListener("click", function() {
  var help = new AboutWindow();
  inAppWindowManager.add(help);
});

window.addEventListener("click", function(evt) {
  
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
      menuItemContents[i].style.display = "none";
    }

    if (evt.target.className == "btn-in-app-window-close") {
      var win = evt.target.parentNode.parentNode;

      inAppWindowManager.remove(win.inAppWindowInstance);

      document.getElementsByTagName("body")[0].removeChild(win);
    }
  }

});

window.addEventListener("mousedown", function(evt) {
  isMouseDown = true;

  if (evt.target.className == "in-app-window-content-wrapper") {
    var win = evt.target.parentNode;

    for (var i = 0; i < inAppWindowManager.inAppWindows.length; i++) {
      var w = inAppWindowManager.inAppWindows[i];

      w.window.style.zIndex = i;
    }

    win.style.zIndex = 100;
  }
  else if (evt.target.className == "in-app-window-titlebar") {
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