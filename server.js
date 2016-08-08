var express=require("express");
var app=express();

app.get('/',function(req,res){
   res.send("Hello");
   res.end();
});
app.listen(process.env.PORT || 8080, function(err){
    if(err) throw err;
    console.log("listen to port : process.env.PORT ||8080");
});