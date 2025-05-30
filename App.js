const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path");
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
const methodOverride=require("method-override");
app.use(express.static(path.join(__dirname,"/public")));
app.use(methodOverride("_method"));
const engine=require("ejs-mate");
app.engine("ejs",engine);
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const{listingSchema}=require("./schema.js");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";
const PORT = process.env.PORT || 8080;



main()
.then(()=>{
    console.log("connected to db");
})
.catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect(MONGO_URL);
}

app.get("/",(req,res)=>{
    res.send("working");
});

const validateListing=(req,res,next)=>{
    let{error}=listingSchema.validate(req.body);
    if(error){
        throw new ExpressError(400,error);
    }else{
        next();
    }
}
// app.get("/testListing",async(req,res)=>{
//     let sampleList=new Listing({
//         title:"My New Villa",
//         description:"Buy The Beach",
//         price:1200,
//         location:"Goa",
//         country:"India",

//     });
//     await sampleList.save();
//     console.log("Data was saved");
//     res.send("Data saves successful");
// });

app.get("/listings",wrapAsync(async(req,res)=>{
    // Listing.find({}).then(res=>{
    //     console.log(res);
    // })
    let allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}));
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs");
})
app.get("/listings/:id",wrapAsync(async(req,res)=>{
let{id}=req.params;
const listing=await Listing.findById(id);
res.render("listings/show.ejs",{listing});
}));

app.post("/listings",validateListing,wrapAsync(async(req,res,next)=>{
//    let result=listingSchema.validate(req.body);
//    console.log(result);
    const newListing=new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
})
);
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
}));
app.put("/listings/:id",validateListing,wrapAsync(async(req,res)=>{
    let {id}=req.params;
    await  Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect("/listings");

}));
app.delete("/listings/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));
app.all("*",(req,res,next)=>{
   next(new ExpressError(404,"Page Not Found!"));
});

app.use((err,req,res,next)=>{
    let{statusCode=500,message="Something went wrong"}=err;
    // res.status(statusCode).send(message);
    res.render("error.ejs",{message});
})
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

