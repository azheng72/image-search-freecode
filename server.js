var express=require("express");
var app=express();
var mongo=require("mongodb").MongoClient;
var db={};
var dburl=process.env.MONGODB_URI || 'mongodb://localhost:27017/image-search';
var request=require("request");
var bingoptions={
    url:'https://api.cognitive.microsoft.com/bing/v5.0/images/search?mkt=en-us HTTP/1.1',
    headers:{
        'Ocp-Apim-Subscription-Key': process.env.MS_KEY,
        'User-Agent':'',
        'X-Search-ClientIP':'',
        'X-MSEdge-ClientID':''
    }
};

mongo.connect(dburl,function(err,database){
    if(err) console.error("db error: "+err);
    else console.log('db connect success!')
    db=database;
});

function parseApiRes(data){
    if(JSON.parse(data)['_type']!=="Images") return JSON.parse(data);//return error
    
    var newdata=JSON.parse(data).value;//we need the "value" from image api
    
    for(var i=0;i<newdata.length;i++){
        newdata[i]={name:newdata[i].name, thumbnailUrl:newdata[i].thumbnailUrl, contentUrl:newdata[i].contentUrl};
    }
    return newdata;
}

app.get('/api/imagesearch/:q',function(req,res){
    var copyoptions = Object.assign({}, bingoptions);//copy object to a new object
    
    copyoptions.headers['User-Agent']=req.get('User-Agent');
    copyoptions.url+= '&q='+req.params.q;
    if(req.query.offset) copyoptions.url+= '&offset='+req.query.offset;
    
    
    request(copyoptions,function(err,response,body){
        if(err || response.statusCode !== 200){console.error("Error: "+err+" Response-statusCode: "+res.statusCode +" Response: "+body);}
        res.json(parseApiRes(body));
        res.end();
        
        if(JSON.parse(body)['_type']==="Images")// if api response is "correct":only need image api
            db.collection('latest').insert( //db insertion
                {term:req.params.q,when:Date()},
                function(err,data){
                    if(err) {console.error('db error: '+err)}
                    else {console.log('db insert success: '+JSON.stringify(data.ops[0]))}
                }
            );
        
        
    })

});

app.get('/api/latest/imagesearch/',function(req,res){
    db.collection('latest').find({},{_id: 0}).toArray(
        function (err,docs) {
            if(err) {console.error('db error: '+err)}
            else {console.log('db find success.')}
            res.json(docs.reverse());
            res.end();
        }
        
        
    );
   
});

app.get('/',function(req,res){
   res.send("<h1>Usage:</h1><h2>Search Image: " +req.protocol + "://" +req.get('host')+"/api/imagesearch/&ltYour-Request&gt</h2><h2>Search History: " +req.protocol + "://" +req.get('host')+"/api/latest/imagesearch/</h2>");
   res.end();
});
app.listen(process.env.PORT || 8080, function(err){
    if(err) throw err;
    console.log("listen to port : process.env.PORT ||8080");
});