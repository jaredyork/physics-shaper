class EditorWindow {
    constructor(args) {
        this.args = args === undefined ? {} : args;
        this.args.titleBar = this.args.titleBar === undefined ? {} : this.args.titleBar;
        this.args.titleBarPadding = this.args.titleBarPadding === undefined ? {} : this.args.titleBarPadding;
    }

    baseCreate(editorWindowManager) {
        this.editorWindowManager = editorWindowManager;

        this.container = document.createElement('div');
        this.container.setAttribute('class', 'win-container');

        this.titleBar = document.createElement('div');
        this.titleBar.setAttribute('class', 'win-title-bar');

        this.titleBarFlex = document.createElement('div');
        this.titleBarFlex.setAttribute('class', 'win-title-bar-flex');

        this.titleBarPadding = document.createElement('div');
        this.titleBarPadding.setAttribute('class', 'win-title-bar-padding');

        this.title = document.createElement('p');
        this.title.setAttribute('class', 'win-title');

        this.titleBarPadding.appendChild(this.title);

        this.titleBarFlex.appendChild(this.titleBarPadding);


        this.titleBarWindowControls = document.createElement('div');
        this.titleBarWindowControls.setAttribute('class', 'win-title-bar-window-controls');

        this.btnClose = document.createElement('span');
        this.btnClose.setAttribute('class', 'win-btn win-btn-close');
        this.btnClose.innerHTML = '&#10006;';
        this.btnClose.addEventListener('click', function() {
            this.editorWindowManager.close(this);
        }.bind(this));
        this.titleBarWindowControls.appendChild(this.btnClose);

        this.titleBarFlex.append(this.titleBarWindowControls);

        this.titleBar.appendChild(this.titleBarFlex);
        this.container.appendChild(this.titleBar);


        this.containerContent = document.createElement('div');
        this.containerContent.setAttribute('class', 'win-container-content');

        this.containerContentPadding = document.createElement('div');
        this.containerContentPadding.setAttribute('class', 'win-container-content-padding');
        this.containerContent.appendChild(this.containerContentPadding);
        
        this.container.appendChild(this.containerContent);
        document.body.appendChild(this.container);
    }

    removeContainer() {
        this.container.remove();
    }

    appendChild(element) {
        this.containerContentPadding.appendChild(element);
    }
}

class EditorAboutWindow extends EditorWindow {
    constructor() {
        super({
            title: 'About'
        });
    }

    create() {
        let title = document.createElement('h1');
        title.setAttribute('class', 'win-heading centered');
        title.innerHTML = 'About Physics Shaper';
        this.appendChild(title);

        let description = document.createElement('p');
        description.setAttribute('class', 'centered');
        description.innerHTML = '&copy; 2020 Jared York<br />Physics Shaper is developed by Jared York.';
        this.appendChild(description);

        let btnClose = document.createElement('span');
        btnClose.setAttribute('class', 'btn-primary centered');
        btnClose.innerHTML = 'Close';
        btnClose.addEventListener('click', function() {
            this.editorWindowManager.close(this);
        }.bind(this));
        this.appendChild(btnClose);
    }
}

class EditorWindowManager {
    constructor() {
        this.windowIdIterator = 0;
        this.windows = [];
        this.lastWindowInFocus = null;
        this.windowInFocus = null;
        this.windowDepthCounter = 0;
        this.defaultStyles = {
            titleBar: {
                backgroundColor: '#333333'
            },
            titleBarPadding: {
                paddingTop: 4,
                paddingRight: 4,
                paddingBottom: 6,
                paddingLeft: 4,
            },
            title: {
                color: '#e9e9e9',
                textAlign: 'center',
                fontWeight: 'bold'
            },
            container: {
                backgroundColor: '#ffffff',
                borderColor: '#333333',
                borderStyle: 'solid',
                borderWidth: 2
            }
        };

        this.inner = {
            top: 32
        };

        this.isMouseDown = false;
        this.windowDragged = null;
        this.windowDragOffset = { x: 0, y: 0 };

        this.setupWindowManager();
    }

    close(window) {
        for (let i = 0; i < this.windows.length; i++) {
            console.log('is ' + this.windows[i].args.id + ' == ' + window.args.id);
            if (this.windows[i].args.id === window.args.id) {
                this.windows[i].removeContainer();
                this.windows.splice(i, 1);
            }
        }
    }

    append(editorWindow) {
        editorWindow.args.id = this.windowIdIterator;
        this.windowIdIterator++;
        this.windowDepthCounter++;

        editorWindow.baseCreate(this);
        editorWindow.create();

        editorWindow.container.style.zIndex = this.windowDepthCounter;

        if (editorWindow.args.titleBar.backgroundColor === undefined) {
            editorWindow.titleBar.style.backgroundColor = this.defaultStyles.titleBar.backgroundColor;
        }


        if (editorWindow.args.titleBarPadding.paddingTop === undefined) {
            editorWindow.titleBarPadding.style.paddingTop = this.defaultStyles.titleBarPadding.paddingTop + 'px';
        }
        else {
            editorWindow.titleBarPadding.style.paddingTop = editorWindow.args.titleBarPadding.paddingTop + 'px';
        }
        if (editorWindow.args.titleBarPadding.paddingRight === undefined) {
            editorWindow.titleBarPadding.style.paddingRight = this.defaultStyles.titleBarPadding.paddingRight + 'px';
        }
        else {
            editorWindow.titleBarPadding.style.paddingRight = editorWindow.args.titleBarPadding.paddingRight + 'px';
        }
        if (editorWindow.args.titleBarPadding.paddingBottom === undefined) {
            editorWindow.titleBarPadding.style.paddingBottom = this.defaultStyles.titleBarPadding.paddingBottom + 'px';
        }
        else {
            editorWindow.titleBarPadding.style.paddingBottom = editorWindow.args.titleBarPadding.paddingBottom + 'px';
        }
        if (editorWindow.args.titleBarPadding.paddingLeft === undefined) {
            editorWindow.titleBarPadding.style.paddingLeft = this.defaultStyles.titleBarPadding.paddingLeft + 'px';
        }
        else {
            editorWindow.titleBarPadding.style.paddingLeft = editorWindow.args.titleBarPadding.paddingLeft + 'px';
        }

        if (editorWindow.args.titleBarPadding.padding === undefined) {
            editorWindow.titleBarPadding.style.paddingTop = this.defaultStyles.titleBarPadding.paddingTop + 'px';
            editorWindow.titleBarPadding.style.paddingRight = this.defaultStyles.titleBarPadding.paddingRight + 'px';
            editorWindow.titleBarPadding.style.paddingBottom = this.defaultStyles.titleBarPadding.paddingBottom + 'px';
            editorWindow.titleBarPadding.style.paddingLeft = this.defaultStyles.titleBarPadding.paddingLeft + 'px';
        }
        else {
            editorWindow.titleBarPadding.style.paddingTop = editorWindow.args.titleBarPadding.padding + 'px';
            editorWindow.titleBarPadding.style.paddingRight = editorWindow.args.titleBarPadding.padding + 'px';
            editorWindow.titleBarPadding.style.paddingBottom = editorWindow.args.titleBarPadding.padding + 'px';
            editorWindow.titleBarPadding.style.paddingLeft = editorWindow.args.titleBarPadding.padding + 'px';
        }


        if (editorWindow.args.title.color === undefined) {
            editorWindow.title.style.color = this.defaultStyles.title.color;
        }
        else {
            editorWindow.title.style.color = editorWindow.args.title.color;
        }

        if (editorWindow.args.title.textAlign === undefined) {
            editorWindow.title.style.textAlign = this.defaultStyles.title.textAlign;
        }
        else {
            editorWindow.title.style.textAlign = editorWindow.args.title.textAlign;
        }

        if (editorWindow.args.title.fontWeight === undefined) {
            editorWindow.title.style.fontWeight = this.defaultStyles.title.fontWeight;
        }
        else {
            editorWindow.title.style.fontWeight = editorWindow.args.title.fontWeight;
        }


        editorWindow.title.innerHTML = editorWindow.args.title;

        if (editorWindow.args.borderColor === undefined) {
            editorWindow.container.style.borderColor = this.defaultStyles.container.borderColor;
        }
        else {
            editorWindow.container.style.borderColor = editorWindow.args.container.borderColor;
        }

        if (editorWindow.args.borderStyle === undefined) {
            editorWindow.container.style.borderStyle = this.defaultStyles.container.borderStyle;
        }
        else {
            editorWindow.container.style.borderStyle = editorWindow.args.container.borderStyle;
        }

        if (editorWindow.args.borderWidth === undefined) {
            editorWindow.container.style.borderWidth = this.defaultStyles.container.borderWidth + 'px';
        }
        else {
            editorWindow.container.style.borderWidth = editorWindow.args.container.borderWidth + 'px';
        }

        editorWindow.container.style.position = 'absolute';

        editorWindow.container.style.left = getRandomInt(128 - 32, 128 + 32) + 'px';
        editorWindow.container.style.top = getRandomInt(128 - 32, 128 + 32) + 'px';

        if (editorWindow.args.backgroundColor === undefined) {
            editorWindow.container.style.backgroundColor = this.defaultStyles.container.backgroundColor;
        }

        if (editorWindow.args.width !== undefined) {
            editorWindow.container.style.width = editorWindow.args.width + 'px';
        }

        if (editorWindow.args.height !== undefined) {
            editorWindow.container.style.height = editorWindow.args.height + 'px';
        }

        this.windows.push(editorWindow);
    }

    setupWindowManager() {
        window.addEventListener("mousedown", function(evt) {
            this.isMouseDown = true;

            let titleBarWinElement = null;

            switch (evt.target.getAttribute('class')) {
                case 'win-title-bar-flex': { titleBarWinElement = evt.target.parentNode.parentNode; break; }
                case 'win-title-bar-padding': { titleBarWinElement = evt.target.parentNode.parentNode.parentNode; break; }
                case 'win-title': { titleBarWinElement = evt.target.parentNode.parentNode.parentNode.parentNode; break; }
            }

            if (titleBarWinElement !== null) {
                var winX = titleBarWinElement.style.left.split('px')[0];
                var winY = titleBarWinElement.style.top.split('px')[0];

                this.windowDragOffset = {
                    x: evt.x - winX,
                    y: evt.y - winY
                };

                this.windowDragged = titleBarWinElement;
            }
            
            let parentWindowContainer = evt.target.closest('.win-container');
            if (parentWindowContainer !== null) {
                
                if (this.windowInFocus !== null) {
                    this.lastWindowInFocus = this.windowInFocus;
                }

                this.windowInFocus = parentWindowContainer;
                if ( this.lastWindowInFocus !== null) {
                    this.windowInFocus.style.zIndex = this.windowDepthCounter;
                    this.windowDepthCounter++;
                }
            }
            
        }.bind(this));

        window.addEventListener("mouseup", function() {
            this.isMouseDown = false;

            this.windowDragOffset = { x: 0, y: 0 };

            this.windowDragged = null;
        }.bind(this));

        window.addEventListener("mousemove", function(evt) {
            if (this.isMouseDown) {      
                if (this.windowDragged !== null) {
                    var pos = {
                        x: (evt.x - this.windowDragOffset.x),
                        y: (evt.y - this.windowDragOffset.y)
                    };

                    this.windowDragged.style.top = pos.y + "px";
                    this.windowDragged.style.left = pos.x + "px";
                }
            }
        }.bind(this));
    }
}
