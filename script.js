var canvas = document.getElementById("draw")
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
var player;
var currentSecond = 0, frameCount = 0, framesLastSecond = 0, lastFrameTime = 0
var ctx = document.getElementById("draw").getContext("2d");
class Player { //all player variables
  constructor(x,y,z,p,l,d) {
    //define and store camera position
    this.x = x
    this.y = y
    this.z = z
    //define and store camera rotation
    this.xRot = 0
    this.yRot = 0
    this.zRot = 0
    this.perspective = p //perspective is used to calculate the effect of distance (z) on size of objects. smaller p is bigger effect on distance
    this.light = l //brightness of light at the center of the player.
    
    this.maxViewDis = d //blocks disappear if they are further away than this
    
    this.speed = 3
    
    this.selectedBlock = false; //stores the block the player is currently looking at
    
    this.pointerLock = false; //stores if the game is in pointerLock mode
    
    this.inventory = {maxSlots: 9, maxStackSize:99, slots:[]}
  }
  addItem(type, qty) {
    const i = this.inventory.slots.find(o => o.type === type && o.qty < this.inventory.maxStackSize);
    if (i) {
      const toAdd = Math.min(i.qty + qty, this.inventory.maxStackSize);
      const toInsert = Math.max(i.qty + qty - this.inventory.maxStackSize, 0);
  
      i.qty += toAdd-i.qty;

      if (toInsert) {
        this.inventory.slots.push({ type, qty: toInsert });
      }
    } else {
      let remaining = qty;

      while (remaining > 0) {
        const toSubtract = Math.min(remaining, this.inventory.maxStackSize);

        this.inventory.slots.push({ type, qty: toSubtract });

        remaining -= toSubtract;
      }
    }
    return void (this.inventory.slots = this.inventory.slots.slice(0, this.inventory.maxSlots));
  }
  drawInv() {
    ctx.font = "bold 16px sans-serif";
    for (let i = 0; i < this.inventory.maxSlots; i++) {
      const slot = this.inventory.slots[i];
      ctx.fillStyle = "rgb(155, 155, 155, 0.8)";
      ctx.fillRect(25 + i * 85, canvas.height - 100, 75, 75);
      if (slot) {
        ctx.fillStyle = blockTypes[slot.type].color;
        ctx.fillRect(35 + i * 85, canvas.height - 90, 55, 55);
        ctx.fillStyle = "#ff0000";
        ctx.fillText(slot.qty, 35 + i * 85, canvas.height - 30);
      }
    }
  }
}

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
  let move = false;
  
  // KEY HANDLER
  if(keysDown[87]) { //w key
    player.x += -player.speed * Math.sin(player.yRot)
    player.z +=  player.speed * Math.cos(player.yRot)
    move = true;
  }
  if(keysDown[65]) { //a key
    player.x -=  player.speed * Math.cos(player.yRot)
    player.z -=  player.speed * Math.sin(player.yRot)
    move = true;
  }
  if(keysDown[83]) { //s key
    player.x -= -player.speed * Math.sin(player.yRot)
    player.z -=  player.speed * Math.cos(player.yRot)
    move = true;
  }
  if(keysDown[68]) { //d key
    player.x +=  player.speed * Math.cos(player.yRot)
    player.z +=  player.speed * Math.sin(player.yRot)
    move = true;
  }
  if(keysDown[16]) { //shift key
    player.y += player.speed
    move = true;
  }
  if(keysDown[32]) { //space key
    player.y -= player.speed
    move = true;
  }
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



window.addEventListener("keydown", function(e) { //when keys are pressed add them to the list of pressed keys
  keysDown[e.keyCode] = true;
})

window.addEventListener("keyup", function(e) { //when keys are released remove them from the list of pressed keys
  keysDown[e.keyCode] = false;
})

window.addEventListener("mousedown", function(e) {
  if(!player.pointerLock) return;
  if(!player.selectedBlock) return;
  let index = objects.indexOf(player.selectedBlock)
  world[player.selectedBlock.mx][player.selectedBlock.my][player.selectedBlock.mz] = null
  player.addItem(objects[index].type,1)
  objects.splice(index, 1)
  
})

class Cube { //cube class
  constructor(x,y,z,w,h,d,mx,my,mz,t,a) {
    this.type = t
    //set location
    this.x = x
    this.y = y
    this.z = z
    this.action = a
    //set size
    this.w = w
    this.h = h
    this.d = d
    //position in world array
    this.mx = mx
    this.my = my
    this.mz = mz
    //cube color
    this.color = blockTypes[this.type].color
    //all of the cube's points
    this.points = [
      {x: x, y: y, z: z},
      {x: x+w, y: y, z: z},
      {x: x+w, y: y+h, z: z},
      {x: x, y: y+h, z: z},
      
      {x: x, y: y, z: z+d},
      {x: x+w, y: y, z: z+d},
      {x: x+w, y: y+h, z: z+d},
      {x: x, y: y+h, z: z+d}
    ]
    //all of the cube faces, using the points above
    this.faces = [[0,1,2,3,1],
                  [4,5,6,7,2],
                  [0,3,7,4,3],
                  [0,1,5,4,4],
                  [1,2,6,5,5],
                  [2,3,7,6,6]]
  }
  //function to draw the cube
  draw(m,s) {
    ctx.lineWidth = 0.3
    if(this.mx > 0 && this.mx < worldSize-1 && this.my > 0 && this.my < worldSize-1 && this.mz > 0 && this.mz < 8) {
      if(world[this.mx-1][this.my][this.mz] == 1 && world[this.mx+1][this.my][this.mz] == 1 &&
         world[this.mx][this.my-1][this.mz] == 1 && world[this.mx][this.my+1][this.mz] == 1 &&
         world[this.mx][this.my][this.mz-1] == 1 && world[this.mx][this.my][this.mz+1] == 1) {
            return;
      }
    }
    //put the faces in the correct order for distance drawing
    this.faces = sortFaces(this.points, this.faces)

    for(let i = 3; i<this.faces.length; i++) { //draw each face inidvidually, but only the 3 closest to the camera to reduce lag
      
      // if a face is covered by another cube, do not draw it.
      if(this.faces[i][4] == 1 && this.my > 0 && world[this.mx][this.my-1][this.mz] == 1) continue;
      if(this.faces[i][4] == 2 && this.my < worldSize-1 && world[this.mx][this.my+1][this.mz] == 1) continue;
      if(this.faces[i][4] == 3 && this.mx > 0 && world[this.mx-1][this.my][this.mz] == 1) continue;
      if(this.faces[i][4] == 5 && this.mx < worldSize-1 && world[this.mx+1][this.my][this.mz] == 1) continue;
      if(this.faces[i][4] == 4 && this.mz >= 0 && world[this.mx][this.my][this.mz+1] == 1) continue;
      if(this.faces[i][4] == 6 && this.mz < worldSize-1 && world[this.mx][this.my][this.mz-1] == 1) continue;
      
        //check if the player is currently looking at this face
        let point1 = get3dto2d(this.points[this.faces[i][0]].x, this.points[this.faces[i][0]].y, this.points[this.faces[i][0]].z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        let point2 = get3dto2d(this.points[this.faces[i][1]].x, this.points[this.faces[i][1]].y, this.points[this.faces[i][1]].z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        let point3 = get3dto2d(this.points[this.faces[i][2]].x, this.points[this.faces[i][2]].y, this.points[this.faces[i][2]].z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        let point4 = get3dto2d(this.points[this.faces[i][3]].x, this.points[this.faces[i][3]].y, this.points[this.faces[i][3]].z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        let polyPoints = [point1, point2, point3, point4]
        if(inside([xc, yc], polyPoints) && player.selectedBlock != this) {
          player.selectedBlock = this;
          i=0;
        }
      
      ctx.beginPath()
      let point3d = this.points[this.faces[i][0]]
      //transform the 3d point to a 2d point
      let point2d = get3dto2d(point3d.x, point3d.y, point3d.z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
      if(!point2d) continue;
      ctx.moveTo(point2d[0], point2d[1]) //go to the location of the first point
      for(let j = 1; j<this.faces[i].length-1; j++) { //draw a line to each point of the current face
        let point3d = this.points[this.faces[i][j]]
        //transform the 3d point to a 2d point
        let point2d = get3dto2d(point3d.x, point3d.y, point3d.z, (this.x + this.w/2),(this.y + this.h/2),(this.z + this.d/2))
        if(!point2d) {ctx.beginPath(); break;};
        ctx.lineTo(point2d[0], point2d[1])
      }
      ctx.closePath() //finish at the line off at its start
      let gradient = ctx.createRadialGradient(window.innerWidth/2,window.innerHeight/2,30,window.innerWidth/2,window.innerHeight/2,750);
      gradient.addColorStop(0.1,ColorLuminance(this.color, player.light))
      gradient.addColorStop(1,this.color)
      ctx.fillStyle = gradient
      if(!m && player.selectedBlock == this) {
        ctx.fillStyle = ColorLuminance(this.color, 1)
      }
      ctx.fill() //actually draw the lines
      ctx.strokeStyle = "#000000"
      ctx.stroke() //draw the lines around the face
      
    }
  }
  //function to move the cube
  move(dx,dy,dz) {
    //update cube position
    this.x += dx
    this.y += dy
    this.z += dz
    
    //update individual points
    for(let i = 0; i<this.points.length; i++) {
      this.points[i].x += dx
      this.points[i].y += dy
      this.points[i].z += dz
    }
  }
  //function to rotate the cube around its x axis
  rotatex(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dy = this.points[i].y - (this.y + this.h/2)
      let dz = this.points[i].z - (this.z + this.d/2)
      let ny = dy * Math.cos(a) - dz * Math.sin(a)
      let nz = dy * Math.sin(a) + dz * Math.cos(a)
      this.points[i].y = ny + (this.y + this.h/2)
      this.points[i].z = nz + (this.z + this.d/2)
    }
  }
  //function to rotate the cube around its y axis
  rotatey(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dx = this.points[i].x - (this.x + this.w/2)
      let dz = this.points[i].z - (this.z + this.d/2)
      let nx = dx * Math.cos(a) - dz * Math.sin(a)
      let nz = dx * Math.sin(a) + dz * Math.cos(a)
      this.points[i].x = nx + (this.x + this.w/2)
      this.points[i].z = nz + (this.z + this.d/2)
    }
  }
  //function to rotate the cube around its z axis
  rotatez(a) {
    for(let i = 0; i<this.points.length; i++) {
      let dx = this.points[i].x - (this.x + this.w/2)
      let dy = this.points[i].y - (this.y + this.h/2)
      let nx = dx * Math.cos(a) - dy * Math.sin(a)
      let ny = dx * Math.sin(a) + dy * Math.cos(a)
      this.points[i].x = nx + (this.x + this.w/2)
      this.points[i].y = ny + (this.y + this.h/2)
    }
  }
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



//for mouse movement detection
canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;

canvas.requestPointerLock()

document.exitPointerLock = document.exitPointerLock    ||
                           document.mozExitPointerLock;

canvas.onclick = function() {
  canvas.requestPointerLock();
}


function lockChangeAlert() {
  if (document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas) {
    console.log(player.pointerLock)
    if(!player.pointerLock) {
      player.pointerLock = true;
      update()
      console.log("hi")
      document.addEventListener("mousemove", updatePosition, false);
    }
  } else {
    player.pointerLock = false;
    console.log("bye")
    document.removeEventListener("mousemove", updatePosition, false);
  }
}

function updatePosition(e) {
  player.yRot -= e.movementX/2000;
  if(player.yRot >= 2*Math.PI) player.yRot -= 2*Math.PI
  if(player.yRot <= -2*Math.PI) player.yRot += 2*Math.PI
  if(player.xRot < 0.5*Math.PI && e.movementY < 0) player.xRot -= e.movementY/2000;
  if(player.xRot > -0.5*Math.PI && e.movementY > 0) player.xRot -= e.movementY/2000;
}