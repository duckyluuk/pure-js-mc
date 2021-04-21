/*
  Main functions and setup
*/

var canvas = document.getElementById("draw")
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
var player;
var currentSecond = 0, frameCount = 0, framesLastSecond = 0, lastFrameTime = 0
var ctx = document.getElementById("draw").getContext("2d");


//this can easily be changed
var worldSize = 64

//grid offset starts at center of screen
var xc = window.innerWidth / 2
var yc = window.innerHeight / 2

var objects = []
var keysDown = {} //stores clicked keyboard keys

var world = Array(worldSize)

window.onload = function(e) {
  
  player = new Player(0.5*worldSize*25,-250,0.5*worldSize*25,1000,0.8,400)
  
  // Attempt to unlock
  document.exitPointerLock();

  document.addEventListener('pointerlockchange', lockChangeAlert, false);
  document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
  
  for(let i=0; i<worldSize; i++) { 
    world[i] = new Array(worldSize)
    for(let j=0; j<worldSize; j++) {
      world[i][j] = new Array(worldSize)
    }
  }

  for(let i=0; i<worldSize; i++) {
    for(let j=0; j<worldSize; j++) {
      let rand = Math.ceil(Math.random()*3)
      for(var k=0; k<rand+5; k++) {
        world[i][j][k] = 1
        if(k<rand+2) {
          objects.push(new Cube(i*25, -k*25, j*25, 25, 25, 25, i, j, k,1))
        } else if(k<rand+4) {
          objects.push(new Cube(i*25, -k*25, j*25, 25, 25, 25, i, j, k,2))
        } else objects.push(new Cube(i*25, -k*25, j*25, 25, 25, 25, i, j, k,3))
      }
      if(i > 0 && i < worldSize-1 && j > 0 && j < worldSize-1 && Math.random() < 0.03) { //spawn trees above grass
        let rand2 = Math.floor(Math.random()*2+3)
        for(var l=0; l<rand2; l++) {
          objects.push(new Cube(i*25, -k*25-l*25, j*25, 25, 25, 25, i, j, k+l,4))
          world[i][j][k+l] = 1
        }
        objects.push(new Cube(i*25, (-k-l)*25, j*25, 25, 25, 25, i, j, k+l,5))
        world[i][j][k+l] = 1
        
        objects.push(new Cube((i+1)*25, (-k-l+1)*25, j*25, 25, 25, 25, i+1, j, k+l-1,5))
        world[i+1][j][k+l-1] = 1
        objects.push(new Cube((i-1)*25, (-k-l+1)*25, j*25, 25, 25, 25, i-1, j, k+l-1,5))
        world[i-1][j][k+l-1] = 1
        objects.push(new Cube(i*25, (-k-l+1)*25, (j+1)*25, 25, 25, 25, i, j+1, k+l-1,5))
        world[i][j+1][k+l-1] = 1
        objects.push(new Cube(i*25, (-k-l+1)*25, (j-1)*25, 25, 25, 25, i, j-1, k+l-1,5))
        world[i][j-1][k+l-1] = 1
      } else if(Math.random() < 0.05) {
        objects.push(new Cube(i*25, (-k)*25, j*25, 25, 25, 25, i, j, k,5))
        world[i][j][k] = 1
      }
    }
  }
  
  
  update()
  
}

var blockTypes = {
  0: {color:"#000000",name:"void"},
  1: {color:"#555555",name:"stone"},
  2: {color:"#885511",name:"dirt"},
  3: {color:"#006500",name:"grass"},
  4: {color:"#654321",name:"log"},
  5: {color:"#004500",name:"leaves"}
}

function update() { //update the screen
  // reset screen
  ctx.clearRect(0,0,window.innerWidth,window.innerHeight)
  var currentFrameTime = Date.now();
	var timeElapsed = currentFrameTime - lastFrameTime;

	var sec = Math.floor(Date.now()/1000);
	if(sec!=currentSecond)
	{
		currentSecond = sec;
		framesLastSecond = frameCount;
		frameCount = 1;
  } else { frameCount++; }
  let move = checkControls()
  //sort objects in the correct drawing order
  objects.sort(sortObjOrder)
  
  player.selectedBlock = false;
  //draw the cubes
  for(let i = 0; i < objects.length; i++) {
    if(objects[i].action) {
      objects[i].action(objects[i])
    }
    objects[i].draw(move)
  }
  
  //drawInventory
  player.drawInv()
  
  //draw pointer
  ctx.fillStyle = "#000000"
  ctx.fillRect(xc-2,yc-2,4,4)
  ctx.fillStyle = "#ff0000"
  ctx.fillText("FPS: "+framesLastSecond,25,25)
  if(player.pointerLock) {
    requestAnimationFrame(update)
  } else {
    //pause the game
    ctx.fillStyle = "rgb(0,0,0,0.5)"
    ctx.fillRect(0,0,canvas.width,canvas.height)
   ctx.globalAlpha = 1
  }
}
//function to rotate an object
function rotate(o, x, y, z) {
  o.rotatex(x)
  o.rotatey(y)
  o.rotatez(z)
}

function get3dto2d(x,y,z) { //get a 2d point on a canvas out of a point in 3d space  
  //move the object to the camera, so the rotation works as it should
  let xTemp= x- player.x
  let yTemp= y- player.y
  let zTemp= z- player.z
  
  if(Math.hypot(xTemp,yTemp,zTemp) > player.maxViewDis) {
    return false;
  }
  
  //take camera rotation into consideration
  let nx =  xTemp * Math.cos(player.yRot) + zTemp * Math.sin(player.yRot)
  let ny =  yTemp
  let nz = -xTemp * Math.sin(player.yRot) + zTemp * Math.cos(player.yRot)
  
  nx =  nx
  ny =  ny * Math.cos(player.xRot) + nz * Math.sin(player.xRot)
  nz = -yTemp * Math.sin(player.xRot) + nz * Math.cos(player.xRot)
  
  
  //move it back to its original position
  x = nx+ player.x
  y = ny+ player.y
  z = nz+ player.z
  
  //do not draw it if it is behind the camera
  if(z < player.z ) return false;
  
  //do some math to convert the rotated 3d point into a 2d point
  let updateX = (x-player.x) / ((z-player.z)/player.perspective)
  let updateY = (y-player.y) / ((z-player.z)/player.perspective)

  //0,0,0 is at the center of the start screen
  updateX += xc
  updateY += yc
  
  return [updateX, updateY]
}

function sortObjOrder(a, b) {
  let avgXA = 0; let avgYA = 0; let avgZA = 0 //starting variables to find the sum of all values
  
  for(var i = 0; i < a.points.length; i++) { //add each value
    avgXA += a.points[i].x
    avgYA += a.points[i].y
    avgZA += a.points[i].z
  }
  //divide total value by amount of points to get average
  avgXA /= i
  avgYA /= i
  avgZA /= i
  
  let avgXB = 0; let avgYB = 0; let avgZB = 0 //starting variables to find the sum of all values
  
  for(var j = 0; j < b.points.length; j++) { //add each value
    avgXB += b.points[j].x
    avgYB += b.points[j].y
    avgZB += b.points[j].z
  }  
  //divide total value by amount of points to get average
  avgXB /= j
  avgYB /= j
  avgZB /= j  
  
  //substract camera position from all points to get the difference
  let xDisA = Math.abs(avgXA - player.x)
  let yDisA = Math.abs(avgYA - player.y)
  let zDisA = Math.abs(avgZA - player.z)
  
  let xDisB = Math.abs(avgXB - player.x)
  let yDisB = Math.abs(avgYB - player.y)
  let zDisB = Math.abs(avgZB - player.z)
  
  //put the furthest item first in the array, so that gets drawn first and thus behind objects that are closer to the player.
  if(xDisA + yDisA + zDisA > xDisB + yDisB + zDisB) {
    return -1;
  }
  if(xDisA + yDisA + zDisA < xDisB + yDisB + zDisB) {
    return 1;
  }
  
  return 0;
}

function sortFaces(points, faces) {
  
  faces.sort(function (a, b) {
    let avgXA = 0; let avgYA = 0; let avgZA = 0;
    for(var i=0; i<a.length-1;i++) {
      avgXA += points[a[i]].x
      avgYA += points[a[i]].y
      avgZA += points[a[i]].z
    }
    
    avgXA /= i
    avgYA /= i
    avgZA /= i
    
    let avgXB = 0; let avgYB = 0; let avgZB = 0;
    for(var j=0; j<b.length-1;j++) {
      avgXB += points[b[j]].x
      avgYB += points[b[j]].y
      avgZB += points[b[j]].z
    }
    avgXB /= j
    avgYB /= j
    avgZB /= j
    
    //substract camera position from all points to get the difference
    let xDisA = Math.abs(avgXA - player.x)
    let yDisA = Math.abs(avgYA - player.y)
    let zDisA = Math.abs(avgZA - player.z)

    let xDisB = Math.abs(avgXB - player.x)
    let yDisB = Math.abs(avgYB - player.y)
    let zDisB = Math.abs(avgZB - player.z)
    
    //put the furthest item first in the array, so that gets drawn first and thus behind objects that are closer to the player.
    if(xDisA + yDisA + zDisA > xDisB + yDisB + zDisB) {
      return -1;
    }
    if(xDisA + yDisA + zDisA < xDisB + yDisB + zDisB) {
      return 1;
    }

    return 0;    
  })
  
  return faces;
}

// function to change luminocity of a color, used for lighting 
function ColorLuminance(hex, lum) {

	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}

	return rgb;
}
//check if a point is inside a polygon
function inside(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    
    var x = point[0], y = point[1];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};