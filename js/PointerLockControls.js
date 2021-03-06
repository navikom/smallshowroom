/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera, position, container ) {

	var scope = this;

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );
	pitchObject.rotation.x = -0.13;

	var yawObject = new THREE.Object3D();
	yawObject.position.copy(position);
	yawObject.add( pitchObject );
	yawObject.rotation.y = -0.68;

	var PI_2 = Math.PI / 2;
	var lastPt = null;

	var onMouseMove = function ( event ) {


		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		if(navigator.userAgent.match(/Safari/i) && lastPt != null){
			movementX = event.pageX - lastPt.x;
			movementY = event.pageY - lastPt.y;
		}

		yawObject.rotation.y += movementX * 0.002;
		pitchObject.rotation.x += movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

		lastPt = {x: event.pageX, y: event.pageY};
		
	};


	var onTouchMove = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( scope.enabled === false ) return;

		if(lastPt != null){
			var movementX = event.touches[0].pageX - lastPt.x || 0;
			var movementY = event.touches[0].pageY - lastPt.y || 0;

			yawObject.rotation.y += movementX * 0.002;
			pitchObject.rotation.x += movementY * 0.002;
			pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
		}

		lastPt = {x: event.touches[0].pageX, y: event.touches[0].pageY};

	};

	var onEnd = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		lastPt = null;
	};

	this.dispose = function() {

		container.removeEventListener( 'mousemove', onMouseMove, false );
		container.removeEventListener( 'touchmove', onTouchMove, false );
	};

	container.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'mouseup', onEnd, false );
	container.addEventListener( 'touchmove', onTouchMove, false );
	document.addEventListener( 'touchend', onEnd, false);

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		};

	}();

};
