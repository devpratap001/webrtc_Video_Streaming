const express= require("express");
const {createServer}= require("http");
const Server= require("socket.io");
const { engine }= require("express-handlebars");

const app= express();
const server= createServer(app);
const io= Server(server);

app.engine("handlebars", engine());
app.set("view-engine", "handlebars");
app.set("views", "./views");
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.render("home.handlebars");
})

io.on("connection", socket => {
    socket.on("local-offer", offer => {
        socket.broadcast.emit("local-offer-server", offer)
    })
    socket.on("local-answer", data => {
        socket.broadcast.emit("local-answer-server", data)
    })
    socket.on("send-ice-candidate", data => {
        socket.broadcast.emit("send-ice-candidate-server", data)
    })
    socket.on("send-ice-candidate-remote", data => {
        socket.broadcast.emit("send-ice-candidate-remote-server", data)
    })
})

server.listen(5000, (err) => {
    if (!err){
        console.log("server started at port 5000");
    }
});