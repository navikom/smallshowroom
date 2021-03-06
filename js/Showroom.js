function Showroom(options) {
    var options = options || {};


    this.options = options;

    this.animations = {};
    this.clock = new THREE.Clock();
    this.keys = {LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, SPACE: 32, A: 65, W: 87, D: 68, S: 83};
    this.move = {forward: false, left: false, right: false, backward: false, jump: false};
    this.velocity = new THREE.Vector3();
    this.controlsEnabled = false;

    this.objects = [];
    this.walls = [];
    this.init();
}

Showroom.prototype = {
    constructor: Showroom,

    init: function () {
        this.initContainer();
        this.initScene();
        this.initCamera();
        this.initControls();
        this.initRenderer();
        this.loadScene();
    },

    loadScene: function (callback) {
        var scope = this;

        var loader = new THREE.XHRLoader();
        if(this.options.data[0]){
            var path = (isMobile() ? this.options.data[0] + '_mob' : this.options.data[0]) + '.json';
            loader.load(path, function (json) {

                var loader = new THREE.ObjectLoader();
                loader.setTexturePath(scope.options.texturePath);
                loader.setCrossOrigin('');
                loader.parse(JSON.parse(json), function (result) {
                    scope.scene.add(result);
                    removeTransparent(result);
                    fillObjects(result);
                    scope.start();

                });
                if (scope.options.data[1]){
                    var path = (isMobile() ? scope.options.data[1] + '_mob' : scope.options.data[1]) + '.json';
                    loader.load(path, function (result) {
                        scope.lamp = result;
                        scope.lamp.scale.set(3,3,3);
                        scope.initLights();
                        addWire();
                        scope.requestRender();
                    });
                }
            });
        }


        this.setCollisionObjects();

        function removeTransparent(obj) {
            obj.traverse(function (child) {
                if (child.material
                    && ['1159E14C-9496-4D83-A669-1355E1E141EE', '8FB3DF1D-C188-4390-B6E9-A5A0D7A75D67'].indexOf(child.material.uuid) > -1
                    && child.material.transparent) {
                    child.material.transparent = false;
                    child.material.needsUpdate = true;
                }
            });
        }

        function fillObjects(object) {
            object.traverse(function (child) {
                if (scope.objects.indexOf(child) == -1) {
                    scope.objects.push(child);
                }
            });
        }

        function addWire(){
            var wire = new THREE.GridHelper(3050, 100, 0x888888, 0x888888);
            wire.material.linewidth = 1.5;
            wire.position.y = 570;
            scope.scene.add( wire );
        }

        loader.manager.onStart = function(){
            scope.switchSpinner( true );
        };

        loader.manager.onLoad = function (  ){
            scope.switchSpinner( false );
        };

        var spinnerData = this.options.spinner.data;
        loader.manager.onProgress = function( url, loaded, total ){
            if(url.indexOf('data') == -1){
                var maxLength = 15;
                var u = url.split('/');
                var name = u[u.length - 1];
                name = scope.aspect.width < 380 && name.length > maxLength
                    ? '..' + name.substr(name.length - maxLength , name.length - (name.length - maxLength)) : name;
                spinnerData.innerHTML = Math.round(loaded / total * 100) + '%' + '  ' + name;
            }
        };

    },

    switchSpinner: function( on ){
        var wrapper = this.options.spinner.wrapper;
        var spinner = this.options.spinner.spinner;
        var progressData = this.options.spinner.data;

        if( on ) {
            wrapper.style.display = 'block';
            var width = spinner.offsetHeight;
            wrapper.style.top = ((this.aspect.height - width) / 2) + 'px';
            wrapper.style.left = ((this.aspect.width - width) / 2) + 'px';
            progressData.style.width = (this.aspect.width / 2 * 0.95) + 'px';
            spinner.classList.add( 'fa-spin' );
        } else {
            wrapper.style.display = 'none';
            wrapper.classList.remove( 'fa-spin' );
        }
    },

    setCollisionObjects: function(){
        var scope = this;
        this.seat = new THREE.Mesh(new THREE.CubeGeometry(1300, 3000, 850),
            new THREE.MeshBasicMaterial({color: 0xCC7407}));
        this.seat.position.set(0, 300, 0);
        this.seat.visible = false;
        this.scene.add(this.seat);

        createWall(
            this.options.borders.x * 2,
            new THREE.Vector3(0, 1000, this.options.borders.z),
            new THREE.Euler()
        );

        createWall(
            this.options.borders.x * 2,
            new THREE.Vector3(0, 1000, -this.options.borders.z),
            new THREE.Euler()
        );

        createWall(
            this.options.borders.z * 2,
            new THREE.Vector3(this.options.borders.x, 1000, 0),
            new THREE.Euler(0, Math.PI / 2, 0 )
        );

        createWall(
            this.options.borders.z * 2,
            new THREE.Vector3(-this.options.borders.x, 1000, 0),
            new THREE.Euler(0, Math.PI / 2, 0 )
        );

        function createWall(width, position, rotation){
            var mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, 3000), new THREE.MeshBasicMaterial({color: 0xCC7407, side:THREE.DoubleSide}));
            mesh.position.copy(position);
            mesh.rotation.copy(rotation);
            mesh.visible = false;
            scope.scene.add(mesh);
            scope.walls.push(mesh)
        }
    },

    initScene: function () {

        this.scene = new THREE.Scene();

    },

    initLights: function () {

        var scope = this;
        this.scene.add(createLight(0xF5FFFA, new THREE.Vector3(-this.options.lights.width, this.options.lights.height, -this.options.lights.width)));
        this.scene.add(createLight(0xFFFFFF, new THREE.Vector3(this.options.lights.width, this.options.lights.height, -this.options.lights.width)));
        this.scene.add(createLight(0xF5FFFA, new THREE.Vector3(this.options.lights.width, this.options.lights.height, this.options.lights.width)));
        this.scene.add(createLight(0xFFFFFF, new THREE.Vector3(-this.options.lights.width, this.options.lights.height, this.options.lights.width)));
        //

        function createLight(color, position) {

            var pointLight = new THREE.PointLight(color, scope.options.lights.intensity, scope.options.lights.distance);

            var geometry = new THREE.CircleGeometry(115, 128);
            var material = new THREE.MeshBasicMaterial({color: 0xffffff});
            var sphere = new THREE.Mesh(geometry, material);
            sphere.rotation.x = Math.PI / 2;
            pointLight.add(sphere);

            var lamp = scope.lamp.clone();
            lamp.position.y = -10;
            lamp.position.x = -24;

            pointLight.add(lamp);

            pointLight.position.copy(position);
            return pointLight;

        }
    },

    initContainer: function () {
        this.container = this.options.container;
        this.updateAspect();
        this.switchSpinner( true );
    },

    initCamera: function () {

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20000);

    },

    initControls: function () {
        var scope = this;

        this.controls = new THREE.PointerLockControls(
            this.camera,
            new THREE.Vector3(-2729, this.options.userHeight, 2197),
            this.container
        );
        this.scene.add(this.controls.getObject());

        if(this.options.pointerlock){
            this.pointerLockControls();
        }else{
            this.mouseControls();
        }

        var onKeyDown = function (event) {
            if( scope.hasMovement()) return;
            switch (event.keyCode) {

                case scope.keys.UP:
                case scope.keys.W:
                    scope.move.forward = true;
                    scope.controlsEnabled = true;
                    scope.controls.enabled = true;
                    break;

                case scope.keys.LEFT:
                case scope.keys.A:
                    scope.move.left = true;
                    scope.controlsEnabled = true;
                    scope.controls.enabled = true;

                    break;
                case scope.keys.DOWN:
                case scope.keys.S:
                    scope.move.backward = true;
                    scope.controlsEnabled = true;
                    scope.controls.enabled = true;
                    break;

                case scope.keys.RIGHT:
                case scope.keys.D:
                    scope.move.right = true;
                    scope.controlsEnabled = true;
                    scope.controls.enabled = true;

                    break;

                case scope.keys.SPACE:
                    if(scope.options.pointerlock)
                        scope.pointerLockSwitcher();
                    break;

            }
            scope.selectButton();

        };

        var onKeyUp = function (event) {

            switch (event.keyCode) {

                case scope.keys.UP:
                case scope.keys.W:
                    scope.move.forward = false;
                    scope.controlsEnabled = false;
                    scope.controls.enabled = false;
                    break;

                case scope.keys.LEFT:
                case scope.keys.A:
                    scope.move.left = false;
                    scope.controlsEnabled = false;
                    scope.controls.enabled = false;
                    break;

                case scope.keys.DOWN:
                case scope.keys.S:
                    scope.move.backward = false;
                    scope.controlsEnabled = false;
                    scope.controls.enabled = false;
                    break;

                case scope.keys.RIGHT:
                case scope.keys.D:
                    scope.move.right = false;
                    scope.controlsEnabled = false;
                    scope.controls.enabled = false;
                    break;

            }
            scope.selectButton();
        };

        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);

        this.buttonControls();

    },

    hasMovement: function(){
        var scope = this;
        var has = false;
        ['forward', 'backward', 'left', 'right'].map(function(name){
            if(scope.move[name]){
                has = true;
                return false;
            }
        });

        return has;
    },

    selectButton: function( ){
        var scope = this;
        ['forward', 'backward', 'left', 'right'].map(function(name){
            if(scope.move[name]){
                scope.options.buttons[name].classList.add( 'selected' );
            } else {
                scope.options.buttons[name].classList.remove( 'selected');
            }
        });
    },

    buttonControls: function(){

        var scope = this;
        var forward = this.options.buttons.forward;
        var backward = this.options.buttons.backward;
        var left = this.options.buttons.left;
        var right = this.options.buttons.right;

        function onStart( object, endEventName ){
            var key = object.key;
            if( scope.hasMovement()) return;
            scope.move[key] = true;
            scope.controlsEnabled = true;
            scope.controls.enabled = true;
            scope.selectButton();
            object.elem.addEventListener( endEventName, onEnd.bind( this, object, endEventName), false );
        }

        function onEnd( object, endEventName ){
            scope.move[object.key] = false;
            scope.controlsEnabled = false;
            scope.controls.enabled = false;
            scope.selectButton();
            object.elem.removeEventListener( endEventName, onEnd.bind( this, object, endEventName), false );
        }


        [{elem: forward, key: 'forward'}, {elem: backward, key: 'backward'}, {elem: left, key: 'left'}, {elem: right, key: 'right'}]
            .map(function(object){
                if(isMobile()){
                    addListener( object.elem, 'touchstart', onStart.bind( this, object, 'touchend' ), false );
                } else {
                    addListener( object.elem, 'mousedown', onStart.bind( this, object, 'mouseup' ), false );
                }

            });

    },


    mouseControls: function(){
        var scope = this;

        // var element = document.getElementById('instructionsText');
        // element.innerText = '( W, S, Up, Down = Move, MOUSE = Look around)';

        function onMouseDown( event ) {

            event.preventDefault();

            scope.controlsEnabled = true;
            scope.controls.enabled = true;

            document.addEventListener( 'mouseup', onMouseUp, false );
        }

        function onMouseUp( event ) {
            scope.controlsEnabled = false;
            scope.controls.enabled = false;
            document.removeEventListener( 'mouseup', onMouseUp, false );

        }
        this.container.addEventListener( 'mousedown', onMouseDown, false );
        this.container.addEventListener( 'touchstart', onMouseDown, false );
    },

    pointerLockSwitcher: function(){
        var element = document.body;
        if (this.controlsEnabled) {
            document.exitPointerLock = document.exitPointerLock ||
                document.mozExitPointerLock ||
                document.webkitExitPointerLock;

            // Attempt to unlock
            document.exitPointerLock();
            this.controlsEnabled = false;
            this.controls.enabled = false;
        } else {
            //instructions.style.display = 'none';

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

            element.requestPointerLock();
        }
    },

    pointerLockControls: function(){
        var scope = this;
        var instructions = document.getElementById('instructions');
        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

        if (havePointerLock) {

            var element = document.body;

            var pointerlockchange = function (event) {

                if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {

                    scope.controlsEnabled = true;
                    scope.controls.enabled = true;
                    //instructions.style.display = 'none';

                } else {

                    scope.controls.enabled = false;

                    //instructions.style.display = '';
                }

            };

            var pointerlockerror = function (event) {

                instructions.style.display = '';

            };

            // Hook pointer lock state change events
            document.addEventListener('pointerlockchange', pointerlockchange, false);
            document.addEventListener('mozpointerlockchange', pointerlockchange, false);
            document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

            document.addEventListener('pointerlockerror', pointerlockerror, false);
            document.addEventListener('mozpointerlockerror', pointerlockerror, false);
            document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

        } else {

            instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

        }
    },

    updateAspect: function () {
        var wrapper = document.getElementById('container');
        this.container.style.maxWidth = wrapper.style.maxWidth = Math.min(this.container.clientWidth, window.innerWidth) + 'px';
        this.container.style.maxHeight = wrapper.style.maxHeight = Math.min(this.container.clientHeight, window.innerHeight) + 'px';
        this.aspect = {
            width: this.container.clientWidth,
            height: this.container.clientHeight
        }
    },

    updateCameraAspect: function () {
        if (this.renderer == null) return;

        this.updateAspect();
        this.camera.aspect = this.aspect.width / this.aspect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.aspect.width, this.aspect.height);
        this.requestRender();
    },

    initRenderer: function () {
        var _this = this;

        // renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.container.appendChild(this.renderer.domElement);

        this.updateCameraAspect();
        this.render();
    },

    start: function () {
        var scope = this;

        window.addEventListener('resize', function () {
            scope.updateCameraAspect();
        });

        this.animate();

        new THREE.AnimationsHelper(
            this,
            function (name, arguments, duration, delay, easing, callback, endCallback) {

                scope.animateParamTo(name, arguments, duration, delay, easing, callback, endCallback);


            });

    },

    requestRender: function () {
        this.needRender = true;
    },

    animateParamTo: function (name, arguments, duration, delay, easing, callback, callbackEnd) {

        this.animations[name] = {
            args: {},
            callback: callback,
            callbackEnd: callbackEnd,
            duration: duration,
            easing: easing || easeOutCubic,
            started: (+new Date) + delay
        };

        for (var argument in arguments) {

            if (arguments[argument].obj instanceof Object) {
                var obj = {};

                var end = {};

                for (var key in arguments[argument].obj) {
                    if (['x', 'y', 'z', 'w', 'r', 'g', 'b'].indexOf(key) >= 0) {
                        obj[key] = arguments[argument].obj[key];
                        end[key] = arguments[argument].end[key];
                    }
                }

                var start = extend({}, end);
                var delta = extend({}, end);

                for (var param in end) {
                    start[param] = obj[param];
                    delta[param] = end[param] - obj[param];
                }
            } else {

                var obj = arguments[argument].obj;
                var end = arguments[argument].end;
                var start = obj;
                var delta = end - obj;
            }


            this.animations[name].args[argument] = {obj: obj, start: start, delta: delta};
        }

    },

    animate: function (t) {
        var _this = this;
        requestAnimationFrame(function (t) {
            _this.animate(t)
        }, this.renderer.domElement);

        this.processAnimations();
        this.update();

        if (this.needRender) {
            this.render(t);
            this.needRender = false;
        }


    },

    update: function () {
        if (this.controlsEnabled) {
            var scope = this;
            var moveAction = false;
            var delta = this.clock.getDelta();
            if(delta > 0.03){
                delta = 0.03;
            }

            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;

            this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            if (this.move.forward && inBorders(new THREE.Vector3(0, 0, -1), this.velocity.z - this.options.speed * delta)) {
                this.velocity.z -= this.options.speed * delta;
                moveAction = true;
            }
            if (this.move.backward && inBorders(new THREE.Vector3(0, 0, 1), this.velocity.z + this.options.speed * delta)) {
                this.velocity.z += this.options.speed * delta;
                moveAction = true;
            }

            if (this.move.left && inBorders(new THREE.Vector3(-1, 0, 0), this.velocity.x - this.options.speed * delta)) {

                this.velocity.x -= this.options.speed * delta;
                moveAction = true;
            }
            if (this.move.right && inBorders(new THREE.Vector3(1, 0, 0), this.velocity.x + this.options.speed * delta)) {
                this.velocity.x += this.options.speed * delta;
                moveAction = true;
            }

            if (moveAction) {
                this.controls.getObject().translateX(this.velocity.x * delta);
                this.controls.getObject().translateY(this.velocity.y * delta);
                this.controls.getObject().translateZ(this.velocity.z * delta);
            }


            if (this.controls.getObject().position.y < this.options.userHeight) {

                this.velocity.y = 0;
                this.controls.getObject().position.y = this.options.userHeight;

            }
            this.requestRender();
        }

        function inBorders(axis, shift) {
            var v = new THREE.Vector3();
            v.copy(axis).applyQuaternion(scope.controls.getObject().quaternion);

            var collisions,
                distance = 100;
            var mesh = scope.controls.getObject();
            var position = mesh.position.clone();
            v.y = 0;
            var caster = new THREE.Raycaster(position, v);
            collisions = caster.intersectObjects(scope.walls);

            if(collisions.length > 0 && collisions[0].distance){
                for (var i = 0; i < collisions.length; i++){
                    if(collisions[i].distance < distance){
                        return false;
                    }
                }
            }

            collisions = caster.intersectObjects([scope.seat]);

            if(collisions.length > 0 && collisions[0].distance < distance){
                return false;
            }

            return true;

        }
    },

    processAnimations: function () {

        var event = false;

        for (var name in this.animations) {

            var anim = this.animations[name],
                arguments = anim.args,
                timer = (+new Date) - anim.started;

            if (anim.started > (+new Date)) continue;

            if (anim.easing && anim.easing != null)
                for (var argument in arguments) {

                    var start = arguments[argument].start;
                    var delta = arguments[argument].delta;

                    if (arguments[argument].obj instanceof Object) {

                        for (var param in start) {
                            var startValue = start[param],
                                deltaValue = delta[param],
                                newValue = anim.easing(timer, startValue, deltaValue, anim.duration);

                            arguments[argument].obj[param] = newValue;
                        }

                    } else {

                        var newValue = anim.easing(timer, start, delta, anim.duration);
                        arguments[argument].obj = newValue;
                    }


                }

            if (anim.callback) {

                anim.callback.call(this, arguments);
            }

            if (timer > anim.duration) {

                if (anim.callbackEnd) {
                    anim.callbackEnd.call(this, arguments);
                }
                delete this.animations[name];
            }

            event = true;
        }


        if (event) this.requestRender();

    },

    render: function (t) {

        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
    }
};