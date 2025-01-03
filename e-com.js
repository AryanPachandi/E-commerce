const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");

const mongoose = require("mongoose");
const { usersINFOModel, OrdersModel, ProductINFOModel } = require("./e-comDB");
const {authforSELLER, authforCONSUMER} = require("./middelwares.js")

const app = express();
app.use(express.json());

app.use(cors());
dotenv.config();



mongoose.connect(process.env.MONGO_URL);

// signup and sign-in will be same for seller and consumer
//  the diff will be role {seller || consumer}

app.post("/sign-up", async (req, res) => {
  const name = req.body.name;
  const emailID = req.body.emailID;
  const password = req.body.password;
  const role = req.body.role;

  await usersINFOModel.create({
    name: name,
    emailID: emailID,
    password: password,
    role: role,
  });

  res.json({
    msg: " u r signed in successfully",
  });
});

app.post("/sign-in", async (req, res) => {
  
  const emailID = req.body.emailID;
  const password = req.body.password;

  const response = await usersINFOModel.findOne({
    emailID: emailID,
    password: password,
  });
  if (response) {
    const token = jwt.sign(
      { id: response._id.toString() },
      process.env.JWT_SECRET
    );
    res.json({
      authentication_token: token,
    });
  } else {
    res.send(403).json({
      msg: "email or password incorrect ",
    });
  }
});
//sign up signin working


app.post('/sell-products',authforSELLER,async (req,res)=>{
  try {

    const name = req.body.name;
  const description = req.body.description;
  const price = req.body.price;
  const seller_id = req.seller_id;
  const is_available = req.body.is_available;


   await ProductINFOModel.create({
    name,
    description,
    price,
    seller_id,
    is_available
  })
  res.json({
    msg : "product listed successfully"
  })

  } catch (error) {
    console.log(error)
    res.send(401).json({
      msg : "input invalid or enter all inputs"
    })
  }
  
})

app.get('/seller-personal-products',authforSELLER,async (req,res)=>{
  try {
    const seller_id = req.seller_id
  const products = await ProductINFOModel.find({seller_id}).populate("seller_id", "name emailID role");

  res.json({
    products,
  });
  } catch (error) {
    console.log(error)
    res.send(404).json({
      msg : "backend or database crashed!!!"
    })
  }
  
})

// seller side of selling progucts and getting list is working 
// error handling try catch meethod json msgs remaining 

app.delete('/delete-products/:id', authforSELLER, async(req,res)=>{
  const deleteID = req.params.id;

  // const query = {_id : new ObjectId('products').deleteOne(query)}

  try{

    const result = await ProductINFOModel.deleteOne({_id :new  mongoose.Types.ObjectId(deleteID)} );
  if(result.deletedCount === 1){
    res.json({
      msg : "seller product  deleted successfully "
    })
  }else {
    res.status(404).json({
      msg : " user not found"
    })
  }
  }catch (err){
    console.log (err)
    res.status(500).json({
      msg : "error deleting user "
    })
  }
})

app.post('/order',authforCONSUMER,async(req,res)=>{
  try{
  const consumer_id = req.consumer_id;
  // const seller_id = req.body.seller_id;
  const product_id = req.body.product_id
  
  const product = await ProductINFOModel.findById(product_id)
  
    if (!product || !product.is_available) {
    return res.status(404).json({ msg: 'Product not found or unavailable' });
  }
  const price =  product.price;
  const seller_id = product.seller_id;

  const order = await OrdersModel.create({
   
    consumer_id,
    products :[
      {
      product_id : product_id,
      seller_id : seller_id,
      price : price,
      }
    ],
    total_price : price
  });
  
  
  res.json({ msg: 'Order placed successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error placing order' });
  }
   
})

app.get('/consumer-orders',authforCONSUMER,async (req,res)=>{
   try{
  const consumer_id = req.consumer_id;

  const response = await OrdersModel.find({consumer_id}).populate("consumer_id", "name")
  .populate("products.product_id", "name description price")
  .populate("products.seller_id", "name emailID") 

  

  res.json({
    msg : "your all orders",
    response,
  })
   }catch(err){
    res.send(401).json({
      msg : "invalid consumer id "
    })
    console.log(err);
   }

})


app.get('/consumer-dashboard',authforCONSUMER,async(req,res)=>{
  try{
  const response = await ProductINFOModel.find().populate('seller_id' , 'name  emailID' )
  res.json({
    response,
  })
}catch(err){
    res.json({
      msg : "backend or database crashed"
    })
}
});

app.listen(3000, () => {
  console.log(">>working on localhost:3000");
});


// {    
//   "name" : "sony headphones",
//   "description" : "45db etc etc",
//   "price" : "2000$",
//   "is_available" : true
// }