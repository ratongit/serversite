const express = require('express')
const app = express();

const jwt =require('jsonwebtoken')
const cors = require ('cors')
const port = process.env.PORT || 5000
require('dotenv').config()

const stripe = require("stripe")(process.env.DB_PAYMENT_KEY)




app.use(cors())
app.use(express.json())




const verifyJWT=(req,res,next)=>{

const authorization= req.headers.authorization;
//  console.log( 'look at this', authorization)
if(!authorization){
  return res.status(401).send({error : true, message:'Unauthorization assess'})
}

const token= authorization.split(' ')[1]
// console.log('this is token of req ', token)
jwt.verify(token,process.env.ASSES_TOEKEN_SECRET,(err,decoded)=>{
  if(err){
    return res.status(401).send({error : true, message:'Unauthorization assess'})
  }
  req.decoded = decoded
  next()
})
// next()
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vboitvz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting inv4.7)
     client.connect();



const addclassCollection = client.db('musicdb').collection('addclass');

const allclassCollection = client.db('musicdb').collection('allclass');
const favoritesCollection = client.db('musicdb').collection('favorite');
const paymentCollection = client.db('musicdb').collection('payment');

const userCollection = client.db('musicdb').collection('users');
const subceibeClassCollection = client.db('musicdb').collection('subcribeClass');



app.post('/jwt',(req,res)=>{
  const user = req.body;
  const token = jwt.sign(user,process.env.ASSES_TOEKEN_SECRET,{expiresIn:'10h'})

  res.send({ token })
})



const varifyAdmin = async(req,res,next)=>{
const email =req.decoded.jwtEmail
// const email =req.decoded.email
const query ={email:email}
const user = await userCollection.findOne(query);
if(user?.role !=='admin'){
  return res.status(403).send({error:true,message:"forbaden use"})
}
next()
}



app.post('/users',async(req,res)=>{
  const user =req.body;
  const result= await userCollection.insertOne(user)
  res.send(result)

})







app.get('/user/admin/:email', async(req,res)=>{

const email= req.params.email

// console.log(email)

const query = {email:email}
const user =await userCollection.findOne(query)
const result = {admin: user?.role === "admin"}
res.send(result);
// console.log(result)

})

app.get('/users',verifyJWT, async(req,res)=>{
  const result=await userCollection.find().toArray();
  res.send(result)

})


app.patch('/users/admin/:id',async(req,res)=>{
const id = req.params.id
const filter= {_id: new ObjectId(id)}
const updatedoc= {
  $set:{
    role: 'admin'
  },
}
const result =await userCollection.updateOne(filter,updatedoc)
res.send(result)

// consile.log(result)
})


// new code start 
//  it for update favorites list //

app.patch('/users/favorites/:id',async(req,res)=>{
  const id = req.params.id
  const filter= {_id: new ObjectId(id)}
  // console.log(filter)

  // Define the filter to identify the document to update

  // Define the update operation using $inc to decrement the totalSets field by 1
  const update = { $inc: { totalSets: -1 } };

  // Perform the update operation

  const result = await allclassCollection.updateOne(filter, update);

  res.send(result)


// console.log(result)
})
//new code end





app.get('/music',async(req,res)=>{
//  const result =await musicCollection.find().toArray();
 const result =await allclassCollection.find().toArray();
res.send(result)
})



app.get('/postclass',async(req,res)=>{
//  const result =await musicCollection.find().toArray();
 const result =await addclassCollection.find().toArray();
res.send(result)
})


app.get('/couseholder',async(req,res)=>{
//  const result =await musicCollection.find().toArray();
 const result =await paymentCollection.find().toArray();
res.send(result)
})








app.post('/create-payment-intent',  async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card']
  });

  res.send({
    clientSecret: paymentIntent.client_secret
  })
})

    // payment related api
    app.post('/payment', async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send({ result });
    })
    
    
    
    app.delete('/payment/delete', async (req, res) => {
      const { itemsID } = req.body;
      const query = { _id: { $in: itemsID.map(id => new ObjectId(id)) } };
      const result = await favoritesCollection.deleteMany(query);
      
      // new code 
      // const subceibeClass = await subceibeClassCollection.find(query).toArray()
      
      // subceibeClasses.push(...subceibeClass)
      
      res.send(result);
    });
    


    //  app.post('payment/classes', async (req, res) => {
    //   const classes = req.body;
    //   const result = await subceibeClassCollection.insertOne(classes);
    //   const classes = req.body;
    //   res.send({ result });
    // })

    
    //  new code 
    //  new code 
    //  new code 

    //  app.post('payment/classes', async (req, res) => ){

    // subceibeClassCollection.insertOne({ file: filePath }, (err, result) => {
    //   if (err) {
    //     console.error('Error inserting file into MongoDB:', err);
    //     res.status(500).send('Error inserting file into MongoDB');
    //     client.close();
    //     return;
    //   }

    //   console.log(`File '${filePath}' inserted into MongoDB.`);
    //   res.status(200).send('File uploaded successfully');
    //  })}

     
    //  new code 
    //  new code 


    // app.get('/subcribeclass', (req, res) => {
    //   res.send(subceibeClasses);
    // });



app.get('/favorites',verifyJWT, async(req,res)=>{


  const email= req.query.email

  // console.log(email)
  if(!email){
    res.send([])
  }


const decodedEmail= req.decoded.jwtEmail
// console.log(decodedEmail)
// console.log(email)

if (email !== decodedEmail){
  return res.status(403).send({error : true,   message:'fobeden assess'})
}


const query= {email:email}

const result =await favoritesCollection.find(query).toArray()
// console.log(result)
res.send(result)


})




app.post('/favorites',async(req,res)=>{

  const item = req.body
  // console.log(item)
  const result= await favoritesCollection.insertOne(item)
  res.send(result)

})



// new class add
app.post('/addclass',async(req,res)=>{
  const item = req.body
  // console.log(item)
  const result= await addclassCollection.insertOne(item)
  // const addresult= await musicCollection.insertOne(item)
  res.send(result)
// console.log(result)
  
})
// new class add



app.delete('/favorites/:id',async(req,res)=>{
  const id=req.params.id;
  const query={_id: new ObjectId(id)}
  const result= await favoritesCollection.deleteOne(query)
  res.send(result)

})

app.delete('/user/delete/:id',async(req,res)=>{
  const id=req.params.id;
  const query={_id: new ObjectId(id)}
  const result= await userCollection.deleteOne(query)
  res.send(result)

})




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);








app.get('/',(req,res)=>{
   res.send('Instrument is Start ') 
})


app.listen(port,()=>{
    console.log(`InstruMusic is start on port : ${port}`)
})