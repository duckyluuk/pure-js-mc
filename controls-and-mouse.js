/* 
  game controls
*/


function checkControls() {
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
  return move;
}

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