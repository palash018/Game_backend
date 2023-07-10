const express = require("express");
var bodyParser = require("body-parser");
const path = require("path");
const Cors = require("cors");
const app = express();
const randomstring=require("randomstring")
// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(Cors());
mp=new Map();
const http=require('http').createServer(app);
const io=require('socket.io')(http,{
    cors:{
        origin:'*',
    }
});
function checkWinner(a,b){
    console.log(a,b);
    let move1=a.play;
    let move2=b.play;
    if(move1=="rock"){
        if(move2=="scissor"){
            return 1;
        }
        if(move2=="paper"){
            return 2;
        }
        return 0;
    }
    if(move1=="scissor"){
        if(move2=="rock"){
            return 2;
        }
        if(move2=="paper"){
            return 1;
        }
        return 0;
    }
    if(move1=="paper"){
        if(move2=="scissor"){
            return 2;
        }
        if(move2=="rock"){
            return 1;
        }
        return 0;
    }

}
require("dotenv").config();
io.on('connection', function(socket){
//    socket.join("room-"+roomno);
   //Send this event to everyone in the room.
   try{
    socket.on("create",function(room){
        const val=randomstring.generate(26);
        socket.join(val);
        mp.set(val,[{player:socket.id,ready:false,score:0,play:""}]);
        console.log(socket.id);
        io.to(val).emit("event",{room_id:val});
    })
    socket.on("join",function(room){
        if(mp.get(room)===undefined||mp.get(room).length===2){
            socket.emit("event",{error:"room is either full or doesn't exists"});
            console.log("room invalid");
        }
        else{
        socket.join(room);
        let arr=mp.get(room);
        
        mp.set(room,[...arr,{player:socket.id,ready:false,score:0,play:""}]);
        socket.emit("event",{room_id:room});
        }
        console.log(room);
    })
    socket.on("ready",function(ready){
        try{
        let current_room=Array.from(socket.rooms)[1];
        let arr=mp.get(current_room);
        let not_ready=false
        for(let i=0;i<arr.length;i++){
            if(arr[i].player===socket.id){
                arr[i].ready=true;
            }
            if(arr[i].ready==false){
                not_ready=true;
            }
        }
        if(!not_ready&&arr.length===2){
            console.log('both ready');
            let a=[]
            for(let i=0;i<arr.length;i++){
                let value=arr[i];
                arr[i].ready=false;
                a=[...a,value];
            }
            mp.set(current_room,a);
            io.sockets.in(current_room).emit('ready',arr);
        }
        }
        catch{
            console.log("errenous input");
        }
    })
    socket.on("move",function(move){
        try {
        let current_room=Array.from(socket.rooms)[1];
        let arr=mp.get(current_room);
        let not_ready=false
        for(let i=0;i<arr.length;i++){
            if(arr[i].player===socket.id){
                arr[i].ready=true;
                arr[i].play=move;
            }
            if(arr[i].ready==false){
                not_ready=true;
            }
        }
        if(!not_ready&&arr.length===2){
            console.log('both ready');
            let a=[]
            let player1=arr[0];
            let player2=arr[1];
            let win=checkWinner(player1,player2);
            console.log(win);
            if(win===1) arr[0].score++;
            if(win===2) arr[1].score++;

            if(arr[0].score==3){
                io.sockets.in(arr[0].player).emit('over',true);
                io.sockets.in(arr[1].player).emit('over',false);
                mp.delete(current_room);
            }
            if(arr[1].score==3){
                io.sockets.in(arr[1].player).emit('over',true);
                io.sockets.in(arr[0].player).emit('over',false);
                mp.delete(current_room);
            }
            else{
            for(let i=0;i<arr.length;i++){
                let value=arr[i];
                arr[i].ready=false;
                arr[i].move="";
                a=[...a,value];
            }
            mp.set(current_room,a);
            io.sockets.in(current_room).emit('ready',arr);
            }
        }
    }
        catch {
            console.log("errenous input");
        }
    })
   socket.on("disconnect",function (reason){
    console.log(socket.id);
    for(let [key,value] of mp.entries()){
        let arr=value;
        for(let i=0;i<value.length;i++){
            if(value[i].player===socket.id){
                io.sockets.in(key).emit('over',true);
            }
        }
    }  

   })
}
finally{ 

}
//    io.sockets.in("room-"+roomno).emit('connectToRoom', "You are in room no. "+roomno);
})
const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
