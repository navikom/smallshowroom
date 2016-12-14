// extend object (supports deep)
function extend ( obj ) {
    Array.prototype.slice.call( arguments, 1 ).forEach( function ( source ) {

        if ( source ) {
            for ( var prop in source ) {
                if ( source[ prop ] && source[ prop ].constructor === Object ) {
                    if ( !obj[ prop ] || obj[ prop ].constructor === Object ) {
                        obj[ prop ] = obj[ prop ] || {};
                        extend( obj[ prop ], source[ prop ] );
                    } else {
                        obj[ prop ] = source[ prop ];
                    }
                } else {
                    obj[ prop ] = source[ prop ];
                }
            }

            if ( typeof source !== 'object' )
                obj = source;
        }


    } );
    return obj;
}

var _eventHandlers = {};

function addListener ( node, event, handler, capture ) {
    if ( !(node in _eventHandlers) ) {
        _eventHandlers[ node ] = {};
    }
    if ( !(event in _eventHandlers[ node ]) ) {
        _eventHandlers[ node ][ event ] = [];
    }

    _eventHandlers[ node ][ event ].push( [ handler, capture ] );
    node.addEventListener( event, handler, capture );
}

function removeAllListeners ( node, event ) {
    if ( node in _eventHandlers ) {
        var handlers = _eventHandlers[ node ];
        if ( event in handlers ) {
            var eventHandlers = handlers[ event ];
            for ( var i = eventHandlers.length; i--; ) {
                var handler = eventHandlers[ i ];
                node.removeEventListener( event, handler[ 0 ], handler[ 1 ] );
            }
        }
    }
}

function isMobile() {
    if( navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    ){
        return true;
    }
    else {
        return false;
    }
}

function intersectObject( object, raycaster, intersects, recursive ) {

    object.raycast( raycaster, intersects );

    if ( recursive === true ) {

        var children = object.children;

        for ( var i = 0, l = children.length; i < l; i ++ ) {

            intersectObject( children[ i ], raycaster, intersects, true );

        }

    }

}

// Cubic easing in/out function
// http://gsgd.co.uk/sandbox/jquery/easing/
// b: beginning value, c: change (delta), d: duration
function easeInOutCubic ( t, b, c, d ) {
    if ( (t /= d / 2) < 1 ) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
}

function easeOutQuad ( t, b, c, d ) {
    return -c * (t /= d) * (t - 2) + b;
}

function easeOutSine ( t, b, c, d ) {
    return c * Math.sin( t / d * (Math.PI / 2) ) + b;
}

function easeOutCubic ( t, b, c, d ) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
}

function easeInOutQuint ( t, b, c, d ) {
    if ( (t /= d / 2) < 1 ) return c / 2 * t * t * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
}

function easeInOutCirc ( t, b, c, d ) {
    if ( (t /= d / 2) < 1 ) return -c / 2 * (Math.sqrt( 1 - t * t ) - 1) + b;
    return c / 2 * (Math.sqrt( 1 - (t -= 2) * t ) + 1) + b;
}

function easeOutCirc ( t, b, c, d ) {
    return c * Math.sqrt( 1 - (t = t / d - 1) * t ) + b;
}

function getCurve ( key ) {
    if( key === null) return key;
    return window[key];
}

function getDiffArgument ( argument, object ) {

    if ( argument.indexOf( '.' ) > -1 ) {
        var array = argument.split( '.' );

        if ( array.length == 2 ) {
            return object[ array[ 0 ] ][ array[ 1 ] ];
        } else if ( array.length == 3 ) {
            return object[ array[ 0 ] ][ array[ 1 ] ][ array[ 2 ] ];
        } else if ( array.length == 4 ) {
            return object[ array[ 0 ] ][ array[ 1 ] ][ array[ 2 ] ][ array[ 3 ] ];
        } else if ( array.length == 5 ) {
            return object[ array[ 0 ] ][ array[ 1 ] ][ array[ 2 ] ][ array[ 3 ] ][ array[ 4 ] ];
        }
    }

    return object[ argument ];
}

function ascSort( a, b ) {

    return a.distance - b.distance;

}

THREE.Raycaster.prototype.intersectObjects = function ( objects, recursive ) {

    var intersects = [];

    if ( Array.isArray( objects ) === false ) {

        console.warn( 'THREE.Raycaster.intersectObjects: objects is not an Array.' );
        return intersects;

    }

    for ( var i = 0, l = objects.length; i < l; i ++ ) {

        intersectObject( objects[ i ], this, intersects, recursive );

    }

    intersects.sort( ascSort );

    return intersects;

};

THREE.AnimationsHelper = function ( viewer, callback ) {

    // main scene
    var container = viewer.container;
    var mainScene = viewer.scene;
    var mainCamera = viewer.camera;
    var mainObjects = [];
    var hoverObjects = [];
    var objectsLookAtCamera = [];
    var eventGroups = {};

    viewer.objectsLookAtCamera = objectsLookAtCamera;

    traverse( mainScene, mainObjects );


    function traverse ( scene, array ) {

        (function addObjects ( children, pad ) {

            for ( var i = 0, l = children.length; i < l; i++ ) {

                var object = children[ i ];

                if ( object.children.length > 0 )
                    addObjects( object.children );

                if ( object.userData.animations ) {

                    checkAvailabilityGroups( object, scene );

                    array.push( object );
                    object.objectsLink = array;
                }

                if ( object.userData.lookat_camera ) {
                    object.lookAtCamera = true;
                    objectsLookAtCamera.push( object );
                }



            }

        })( scene.children );

    }


    // object picking

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    // events

    function getIntersects ( point, objects, camera ) {

        mouse.set( ( point.x * 2 ) - 1, -( point.y * 2 ) + 1 );

        raycaster.setFromCamera( mouse, camera );

        return raycaster.intersectObjects( objects );

    }

    var onUpPosition = new THREE.Vector2();
    var onHoverPosition = new THREE.Vector2();

    function getMousePosition ( dom, x, y ) {

        var rect = dom.getBoundingClientRect();
        return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

    }

    function handleClick ( objects, camera ) {

        var intersects = getIntersects( onUpPosition, objects, camera );

        if ( intersects.length > 0 ) {

            var object = intersects[ 0 ].object;
            if ( object.userData.animations.click && !isDisabled( object ) ) {
                applyAnimations( object, 'click', 0 );

                checkReverse( object );

            }
            if ( object.userData.animations.singleClick && !isDisabled( object ) ) {
                applySingleClickAnimation( object, 'single_click', 0 );

            }

        }


    }

    function handleHover ( objects, camera ) {


        var intersects = getIntersects( onHoverPosition, objects, camera );

        if ( intersects.length > 0 ) {

            var object = intersects[ 0 ].object;

            if ( object.userData.animations.hover && !isDisabled( object ) ) {
                applyAnimations( object, 'hover', 0 );
                applyBackHoverAnimation( object );
            }


        } else {

            applyBackHoverAnimation();
        }

    }

    // events

    function onClick ( frame, event ) {

        var array = getMousePosition( frame.container, event.clientX, event.clientY );
        onUpPosition.fromArray( array );

        handleClick( frame.objects, frame.camera );


    }

    function onTouchEnd ( frame, event ) {

        var touch = event.changedTouches[ 0 ];

        var array = getMousePosition( frame.container, touch.clientX, touch.clientY );
        onUpPosition.fromArray( array );

        handleClick( frame.objects, frame.camera );

        //document.removeEventListener( 'touchend', onFrameTouchEnd.bind(this, frame), false );

    }

    function onMouseMove ( frame, event ) {

        var array = getMousePosition( frame.container, event.clientX, event.clientY );
        onHoverPosition.fromArray( array );
        handleHover( frame.objects, frame.camera );
    }

    var frame = { container : container, objects : mainObjects, camera : mainCamera };

    addListener( container, 'click', onClick.bind( this, frame ), false );
    addListener( container, 'touchstart', onTouchEnd.bind( this, frame ), false );
    addListener( container, 'mousemove', onMouseMove.bind( this, frame ), false );

    function checkAvailabilityGroups ( object, scene ) {

        var animations = object.userData.animations.click;

        if ( animations ) {

            for ( var i = 0; i < animations.length; i++ ) {

                if ( animations[ i ].event_id ) {

                    if ( !eventGroups[ animations[ i ].event_id ] ) {
                        eventGroups[ animations[ i ].event_id ] = [];
                    }

                    eventGroups[ animations[ i ].event_id ].push( scene.getObjectByProperty( 'name', animations[ i ].object, true ) );

                }

            }

        }

    }

    function checkReverse ( object ) {

        var reverse = object.userData.animations.reverse;

        if ( !reverse )
            object.userData.animations.reverse = true;
        else
            object.userData.animations.reverse = !object.userData.animations.reverse;

    }

    /*
     if click event array has some object with setting : sequence = true
     following object will be call by sequence
     example
     "click" :{
     {
     "object": "obj1",
     ...settings..
     },
     {
     "object": "obj2",
     ...settings..
     "sequence" : true
     },
     {
     "object": "obj3",
     ...settings..
     },
     {
     "object": "obj4",
     ...settings..
     },
     }
     obj1 and obj2 will be call at the same time
     obj3 and obj4 will be call at the same when obj2 has finished the animation (by duration)
     if for obj3 add setting: sequence = true obj4 will be call when that one has finished the animation (by duration)

     */

    function applyAnimations ( object, event, index ) {


        var animations = object.userData.animations[ event ];

        for ( var i = index; i < animations.length; i++ ) {

            var objs = getObj( animations[ i ].object );
            var sequenceBreak = false;

            objs.map( function ( obj ) {

                if ( !obj.userData[ event ] )
                    obj.userData[ event ] = {};
                obj.userData[ event ][ object.uuid + i ] = animations[ i ];


                switch ( event ) {
                    case 'click':
                        if ( animations[ i ].event === 'custom' ) {
                            obj.userData.animations.custom = animations[ i ];
                            applyCustomAnimation( obj );
                        } else if ( animations[ i ].event === 'autorotation' ) {
                            applyAutoRotation( obj );
                        } else if ( animations[ i ].event === 'camera_autorotate' ) {
                            applyControlsAutoRotation( animations[ i ].arguments );
                        } else if ( animations[ i ].event === 'scene_event' ) {
                            applySceneEvent( animations[ i ].arguments );
                        } else if ( animations[ i ].event === 'cycle_event' ) {
                            applyCycleEvent( obj, object.uuid + i );
                        } else if ( animations[ i ].event === 'single_change' ) {
                            applySingleChange( obj, object, i );
                        } else if ( animations[ i ].event === 'material_change' ) {
                            applyMaterialChange( obj, object.uuid + i );
                        } else if ( animations[ i ].event === 'toggle' ) {
                            applyToggle( obj, object.uuid + i );
                        } else if ( animations[ i ].event === 'reset' ) {
                            applyReset( obj, object.uuid + i );
                        } else if ( animations[ i ].event === 'data' ) {
                            applyData( obj, object.uuid + i );
                        } else
                            applyClickAnimation( obj, object.uuid + i );

                        break;
                    case 'hover':
                        applyHoverAnimation( obj, object.uuid + i );
                        break;
                }

                if ( animations[ i ].sequence ) {

                    obj.userData[ event ][ object.uuid + i ].sequence = {
                        callback : applyAnimations,
                        args : [ object, event, ++i ]
                    };
                    sequenceBreak = true;
                }

            } );


            if ( sequenceBreak )
                break;

        }

    }

    function getObj ( name ) {

        var objects = [];
        var objNames = name.split( ',' );

        objNames.map( function ( objName ) {

            objName = objName.trim();

            var obj = mainScene.getObjectByProperty( 'name', objName, true );

            objects.push( obj );

        } )

        return objects;
    }

    function isDisabled ( object ) {

        return object.userData.animations.disabled;


    }

    function applyCustomAnimation ( object ) {

        var group = eventGroups[ object.name ];
        var action = object.userData.animations.custom.event_action;

        for ( var i = 0; i < group.length; i++ ) {

            var animation = group[ i ].userData.click;


            if ( !animation ) continue;

            for ( var key in animation ) {

                var current = animation[ key ];
                switch ( action ) {
                    case 'on':

                        if ( !current.active && !current.clickOn )
                            applyClickAnimation( group[ i ], key );

                        break;
                    case 'off':
                        if ( !current.active && current.clickOn )
                            applyClickAnimation( group[ i ], key );

                        break;

                    case 'other':
                        break;
                }

            }

        }

    }

    function applyAutoRotation ( object ) {

        object.userData.autorotation.enabled = !object.userData.autorotation.enabled;

    }

    function applyControlsAutoRotation ( options ) {

        viewer.cameraAnimationHelper.applyAutorotate( options );
    }

    function applyCameraAnimations ( viewName ) {
        viewer.cameraAnimationHelper.applyAnimations( viewName );
    }

    function applySceneEvent ( options ) {

        for ( var key in options ) {
            switch ( key ) {
                case 'full_screen':

                    if ( options.full_screen.switch )
                        THREEx.FullScreen.switch();

                    break;
            }
        }

    }


    function applyCycleEvent ( object, uuid ) {

        if ( object.userData.click[ uuid ].active ) return;

        // for start make simple click animation by arguments
        applyClickAnimation( object, uuid );

        var enabled = object.userData.click[ uuid ].cycle.enabled;

        if ( enabled ) {

            delete object.userData.cycle[ uuid ];

        } else {

            var steps = object.userData.click[ uuid ].cycle.steps;
            var interval = object.userData.click[ uuid ].cycle.interval;
            var duration = object.userData.click[ uuid ].cycle.duration;
            var easing = object.userData.click[ uuid ].cycle.easing;

            if ( !object.userData.cycle ) object.userData.cycle = {};

            object.userData.cycle[ uuid ] = [];

            for ( var i = 0, j = steps.length; i < j; i++ ) {

                var uuidStep = THREE.Math.generateUUID();
                object.userData.cycle[ uuid ].push( {
                    uuid : uuidStep,
                    arguments : steps[ i ],
                    delay : interval,
                    duration : duration,
                    easing : easing
                } );

            }

            makeStep( object, uuid, 0 );

        }


        object.userData.click[ uuid ].cycle.enabled = !enabled;
    }

    function makeStep ( object, uuid, i ) {

        if ( !object.userData.cycle[ uuid ] ) return;

        var step = object.userData.cycle[ uuid ][ i ];

        var index = i == object.userData.cycle[ uuid ].length - 1 ? 0 : i + 1;


        step.sequence = { callback : makeStep, args : [ object, uuid, index ] };
        object.userData.click[ step.uuid ] = step;

        applyClickAnimation( object, step.uuid, function () {
            step.sequence = undefined;
        } );

    }


    function applySingleChange ( object, parent, index ) {

        applyClickAnimation( object, parent.uuid + index );
        var toggle = object.userData.click[ parent.uuid + index ].toggle;

        var toggleObjects = getObj( toggle );

        toggleObjects.map( function ( toggleObject ) {

            if ( !toggleObject.userData.animations.click ) {
                var arguments = {};

                for ( var key in object.userData.click[ parent.uuid + index ].backAnimation ) {
                    arguments[ key ] = object.userData.click[ parent.uuid + index ].backAnimation[ key ].end;
                }

                toggleObject.userData.animations.click = [ {
                    "object" : object.userData.click[ parent.uuid + index ].object,
                    "event" : "single_change",
                    "toggle" : parent.name,
                    "arguments" : arguments,
                    "delay" : object.userData.click[ parent.uuid + index ].delay,
                    "duration" : object.userData.click[ parent.uuid + index ].duration,
                    "easing" : object.userData.click[ parent.uuid + index ].easing
                } ];

                toggleObject.userData.animations.hover[ 0 ].disabled = false;
            }

            parent.objectsLink.splice( parent.objectsLink.indexOf( parent ), 1 );

            if ( toggleObject.objectsLink.indexOf( toggleObject ) == -1 )
                toggleObject.objectsLink.push( toggleObject );

        } )


    }

    function applyMaterialChange ( object, uuid ) {

        var key = object.userData.click[ uuid ].arguments.material;
        viewer.setMaterial( key, object );

    }

    function applyToggle ( object, uuid ) {

        object.userData.animations.disabled = object.userData.click[ uuid ].disabled;
    }

    function applyData( object, uuid ){

        var data = object.userData.click[ uuid].data;
        var annot = viewer.options.annotation;
        var rect = container.getBoundingClientRect();
        var ul = annot.content.children[0];
        var margin = 0;

        if(annot.title)
            annot.title.innerHTML = data.title;

        if(annot.content.children[0] && annot.content.children[0].tagName === 'P'){
            annot.content.removeChild( annot.content.children[0] );
        }

        if(data.description){
            var p = document.createElement('p');
            p.innerHTML = data.description;
            p.style.marginLeft = '22px';
            annot.content.insertBefore(p, annot.content.firstChild);
            margin += 5;
        }

        if(!annot.ul){
            var ul = document.createElement('ul');
            annot.content.appendChild(ul);
            annot.ul = ul;
        }

        var fc = annot.ul.firstChild;

        while( fc ) {
            annot.ul.removeChild( fc );
            fc = annot.ul.firstChild;
        }

        if(!annot.cache){
            annot.cache = {};
        }

        annot.ul.style.marginLeft = margin + 'px';

        for (var key in data.content){
            if(!annot.cache[key]){
                var li = document.createElement('li');
                var p = document.createElement('p');
                p.innerHTML = key;
                li.appendChild(p);
                if(data.content[key].length > 0){
                    for (var i = 0; i < data.content[key].length; i++){
                        var text = data.content[key][i];
                        var p = document.createElement('p');
                        p.innerHTML = text;
                        li.appendChild(p);
                    }
                }
                annot.cache[key] = li;
            }

            annot.ul.appendChild(annot.cache[key]);

        }


        var windowHeight = Math.min(window.innerHeight, rect.height);
        var height = windowHeight;

        var width = rect.width * 0.7;
        annot.wrapper.style.maxWidth = width + 'px';
        ul.style.maxHeight = (height - 200 - rect.top) + 'px';

        var top = rect.top + (windowHeight - annot.wrapper.offsetHeight) / 2;
        annot.wrapper.style.top = Math.max(5, top) + 'px';

        var offset = (rect.width - Math.min(width, annot.wrapper.offsetWidth)) / 2;
        annot.wrapper.style.left = offset  + 'px';

        annot.wrapper.style.zIndex = 999;
        annot.wrapper.style.opacity = 1;
        annot.wrapper.style.animationName = "show";

    }

    function applyReset ( object, uuid ) {

        object.userData.click[ uuid ].delay = 0;
        object.userData.click[ uuid ].duration = 0;
        object.userData.click[ uuid ].easing = null;

        applyClickAnimation( object, uuid );
    }


    function applyClickAnimation ( object, uuid, cycleCallback ) {

        if ( object.userData.click[ uuid ].active && cycleCallback === undefined ) return;

        var arguments = object.userData.click[ uuid ].arguments;
        var delay = object.userData.click[ uuid ].delay;
        var duration = object.userData.click[ uuid ].duration;
        var easing = getCurve( object.userData.click[ uuid ].easing );
        var visible = object.userData.click[ uuid ].visible;
        var lookAtCamera = object.userData.click[ uuid ].lookat_camera;
        var eventCamera = object.userData.click[ uuid ].event_cam;
        var easingCamera = object.userData.click[ uuid ].easing_cam;
        var durationCamera = object.userData.click[ uuid ].duration_cam;
        var toggle = object.userData.click[ uuid ].toggle || object.userData.click[ uuid ].oneWay;
        var eventCameraAnimations = object.userData.click[ uuid ].event_cam_animations;


        if ( object.userData.click[ uuid ].clickOn && cycleCallback === undefined ) {
            applyAnimation( 'clickOff' + object.uuid + uuid, object, object.userData.click[ uuid ].backAnimation, duration, delay, easing, function () {

                object.userData.click[ uuid ].active = false;
                object.userData.click[ uuid ].clickOn = false;

                if ( visible != undefined )
                    object.visible = !visible;

                if ( lookAtCamera != undefined )
                    object.lookAtCamera = !lookAtCamera;

                if ( object.userData.click[ uuid ].sequence ) {

                    var args = object.userData.click[ uuid ].sequence.args;
                    object.userData.click[ uuid ].sequence.callback( args[ 0 ], args[ 1 ], args[ 2 ] );

                }

            } );


        } else {

            var args = getArguments( arguments, object );
            object.userData.click[ uuid ].backAnimation = args.back;

            catchInHover( object, args.forward );

            applyAnimation( 'clickOn' + object.uuid + uuid, object, args.forward, duration, delay, easing, function () {

                object.userData.click[ uuid ].active = false;
                object.userData.click[ uuid ].clickOn = true;

                if ( visible != undefined )
                    object.visible = visible;

                if ( lookAtCamera != undefined ) {

                    object.lookAtCamera = lookAtCamera;
                    object.lookAt( mainCamera.position );
                    if ( objectsLookAtCamera.indexOf( object ) == -1 )
                        objectsLookAtCamera.push( object )

                }
                if ( object.userData.click[ uuid ].sequence ) {

                    var args = object.userData.click[ uuid ].sequence.args;
                    object.userData.click[ uuid ].sequence.callback( args[ 0 ], args[ 1 ], args[ 2 ] );

                }

                if ( cycleCallback ) cycleCallback();

                if ( toggle ) {
                    object.userData.click[ uuid ].clickOn = false;
                    delete object.userData.click[ uuid ];
                }


            } );
        }

        if ( eventCamera ) {

            viewer.switchCamera( eventCamera, durationCamera, easingCamera );

        }

        if ( eventCameraAnimations ) {
            applyCameraAnimations( eventCameraAnimations );
        }


        object.userData.click[ uuid ].active = true;
    }

    function catchInHover ( object, args ) {

        if ( object.userData.hover ) {

            for ( var uuid in object.userData.hover ) {
                if ( object.userData.hover[ uuid ].afterAnimation ) {
                    if ( object.name === 'sprite_obj13' )
                        checkAndApplyArgs( object.userData.hover[ uuid ] );

                }

            }

        }

        function checkAndApplyArgs ( arguments ) {

            for ( var key in args ) {

                if ( arguments.backAnimation[ key ] )
                    arguments.backAnimation[ key ].obj = arguments.backAnimation[ key ].end = extend( {}, args[ key ].end );

            }

        }

    }

    function applySingleClickAnimation ( object, event, index ) {

        var animations = object.userData.animations.singleClick;

        for ( var i = 0, j = animations.length; i < j; i++ ) {

            animations[ i ].oneWay = true;

        }

        object.userData.animations.click = animations;


        applyAnimations( object, 'click', 0 );

    }


    function applyHoverAnimation ( object, uuid ) {

        if ( object.userData.hover[ uuid ].disabled || object.userData.hover[ uuid ].active || object.userData.hover[ uuid ].afterAnimation ) return;

        var arguments = object.userData.hover[ uuid ].arguments;
        var delay = object.userData.hover[ uuid ].delay;
        var duration = object.userData.hover[ uuid ].duration;
        var easing = getCurve( object.userData.hover[ uuid ].easing );
        var visible = object.userData.hover[ uuid ].visible;
        var args = getArguments( arguments, object );

        object.userData.hover[ uuid ].backAnimation = args.back;


        applyAnimation( 'hover' + object.uuid, object, args.forward, duration, delay, easing, function () {

            object.userData.hover[ uuid ].active = false;
            object.userData.hover[ uuid ].afterAnimation = true;

            if ( visible != undefined )
                object.visible = visible;

        } );

        object.userData.hover[ uuid ].active = true;

        hoverObjects.push( object );

    }

    function getArguments ( arguments, object ) {

        var backArgs = {};

        var forwardArgs = {};

        for ( var argument in arguments ) {

            var objectArgument = getDiffArgument( argument, object );


            if ( arguments[ argument ] instanceof Object ) {

                var obj = {};
                var end = {};

                for ( var key in arguments[ argument ] ) {
                    if ( key === 'x' || key === 'y' || key === 'z' || key === 'r' || key === 'g' || key === 'b' ) {

                        obj[ key ] = objectArgument[ key ];
                        end[ key ] = arguments[ argument ][ key ];
                    }


                }

            } else {

                if ( typeof  arguments[ argument ] != 'function' ) {
                    var obj = objectArgument;
                    var end = arguments[ argument ];
                }

            }

            forwardArgs[ argument ] = { obj : obj, end : end };

            backArgs[ argument ] = { obj : end, end : obj };

        }

        return {
            forward : forwardArgs, back : backArgs
        }
    }

    function applyBackHoverAnimation ( hoverObject ) {

        if ( hoverObjects.length == 0 ) return;

        var interval = setInterval( function () {

            for ( var i = 0; i < hoverObjects.length; i++ ) {

                var object = hoverObjects[ i ];

                if ( hoverObject && hoverObject === object ) continue;

                if ( object.userData.hover ) {

                    for ( var uuid in object.userData.hover ) {
                        if ( object.userData.hover[ uuid ].afterAnimation ) {

                            backHoverAnimation( object, uuid );

                            hoverObjects.splice( hoverObjects.indexOf( object ), 1 );
                        }

                    }

                }

            }

            if ( hoverObjects.length == 0 ) clearInterval( interval );

        }, 200 );


        function backHoverAnimation ( object, uuid ) {

            var args = object.userData.hover[ uuid ];
            var visible = object.userData.hover[ uuid ].visible;

            applyAnimation( 'backHover' + object.uuid, object, args.backAnimation, args.duration, args.delay, getCurve( args.easing ), function () {

                object.userData.hover[ uuid ].afterAnimation = false;

                if ( visible != undefined )
                    object.visible = !visible;

            } );

        }

    }

    function applyAnimation ( name, object, args, duration, delay, easing, endCallback ) {

        if ( easing == null ) {
            callback( name, args, duration, delay, easing, undefined, function () {
                endCallback();

                if ( Object.keys( args ).length > 0 ) {
                    setArguments( args, object, 'end' );

                }
            } );
        } else
            callback( name, args, duration, delay, easing, animate, endCallback );

        function animate ( currentArgs ) {

            setArguments( currentArgs, object, 'obj' );

        }


    }

    function setArguments ( arguments, object, keyW ) {

        for ( var arg in arguments ) {

            var objectArgument = getDiffArgument( arg, object );

            if ( arguments[ arg ][ keyW ] instanceof Object ) {

                for ( var key in arguments[ arg ][ keyW ] ) {

                    objectArgument[ key ] = arguments[ arg ][ keyW ][ key ];

                }
            } else {

                setParameter( arg, object, arguments[ arg ][ keyW ] )
            }

        }

    }


    function setParameter ( key, object, value ) {

        var array = key.split( '.' );

        if ( array.length > 1 ) {
            if ( array.length == 2 )
                object[ array[ 0 ] ][ array[ 1 ] ] = value;
            else if ( array.length == 3 )
                object[ array[ 0 ] ][ array[ 1 ] ][ array[ 2 ] ] = value;
            else if ( array.length == 4 )
                object[ array[ 0 ] ][ array[ 1 ] ][ array[ 2 ] ][ array[ 3 ] ] = value;
            else if ( array.length == 5 )
                object[ array[ 0 ] ][ array[ 1 ] ][ array[ 2 ] ][ array[ 3 ] ][ array[ 4 ] ] = value;


        } else {
            object[ key ] = value;
        }

    }


};