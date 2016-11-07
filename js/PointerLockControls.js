/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera, position ) {

	var scope = this;

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );
	pitchObject.rotation.x = -0.24;

	var yawObject = new THREE.Object3D();
	yawObject.position.copy(position);
	yawObject.add( pitchObject );
	//yawObject.rotation.y = -Math.PI;

	var PI_2 = Math.PI / 2;
	var lastPt = null;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y += movementX * 0.002;
		pitchObject.rotation.x += movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
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

	var onTouchEnd = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		lastPt = null;
	};

	this.dispose = function() {

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'touchmove', onTouchMove, false );
	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'touchmove', onTouchMove, false );
	document.addEventListener( 'touchend', onTouchEnd, false);

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
