var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

var socket = require("socket.io-client").connect(window.location.href);

var grid = require("./grid");

var particles = [];
var players = require("./players")(ctx,particles);
var food = require("./food")(ctx);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.font = "40px Lucida Console";
ctx.translate(canvas.width/2,canvas.height/2);

function addParticle(player) {
    if (player) {
        var text = +(Math.random()>.5);

        var angle = (Math.random()*Math.PI*2)-(Math.PI);

        var xPos = player.radius*Math.cos(angle);
        var yPos = player.radius*Math.sin(angle);

        if (!particles[player.id]) particles[player.id] = [];

        particles[player.id].push({
            text: text,
            position: {x:xPos,y:yPos},
            initialPosition: {x:xPos,y:yPos},
            opacity: 1
        });
    }
}

document.onkeydown = function(e) {
    socket.emit('keydown', e.keyCode);
}
document.onkeyup = function(e) {
    socket.emit('keyup', e.keyCode);
}

var playerID;
socket.on('player-id', function(id) {
    playerID = id;
});
var shiftID = false;
socket.on('shift-id', function() {
    shiftID = true;
});
var data = require('./data');
socket.on('packet-data', function(d) {
    var newData = data.decompress(d);
    players.temp = newData.players;
    food.all = newData.food;
});

var prevTime = performance.now();
function render() {
    requestAnimationFrame(render);

    var time = performance.now();
    var delta = (time-prevTime)/17;
    
    var player = players.all[playerID];
    
    if (player) {
        ctx.translate(player.position.x,player.position.y);
        ctx.clearRect(-canvas.width/2,-canvas.height/2,canvas.width,canvas.height);

        grid.draw(ctx,player,80);
    }

    if (shiftID) {
        playerID--;
        socket.emit('shift-id');
        shiftID = false;
    }
    
    players.all = players.temp;
    player = players.all[playerID];

    if (player) {
        ctx.translate(-player.position.x,-player.position.y);
    }

    ctx.fillStyle = "#fff";
    ctx.fillRect(-100,-100,200,200);

    for (var i=0;i<players.all.length;i++) {
        var player = players.all[i];
        if (player) players.drawPlayer(player,delta);
        
        var particle = Math.random()>.9;
        if (particle) addParticle(player);
    }
    for (var i=0;i<food.all.length;i++) {
        var thisFood = food.all[i];
        if (thisFood) food.draw(thisFood);
    }

    prevTime = time;
}

render();