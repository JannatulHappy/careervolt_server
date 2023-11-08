const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    // origin:["firebase_host_link"],
    origin: [
      // 'http://localhost:5173',
      "https://careervolt-f325b.web.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wlf4d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobsCollection = client.db("careerVoltDB").collection("jobs");
    const bidsCollection = client.db("careerVoltDB").collection("bids");
    // const YCollection = client.db("careerVoltDB").collection("Y");

    // get all jobs
    app.get("/api/v1/user/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });

    // get single jobs using id
    app.get("/api/v1/user/jobs/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await jobsCollection.findOne(query);
      // console.log(result);
      res.send(result);
    });

    // place you bid form from details page
    // post single  place bid  data endpoint
    app.post("/api/v1/candidate/bids", async (req, res) => {
      const bidsData = req.body;
      console.log(" bids", bidsData);
      const result = await bidsCollection.insertOne(bidsData);
      res.status(200).send(result);
    });

    // add job by employer for candidate
    // post single data endpoint
    app.post("/api/v1/employer/addJob", async (req, res) => {
      const jobData = req.body;
      // console.log(jobData);
      const result = await jobsCollection.insertOne(jobData);

      res.status(200).send(result);
    });

    // get jobs -- added by logged user
    app.get("/api/v1/employer/postedJobs/:email", async (req, res) => {
      const email = req.params.email;
      console.log("email", email);
      const query = {
        Job_poster_email: email,
      };
      const result = await jobsCollection.find(query).toArray();

      res.send(result);
    });


    // get single posted job for update job

    app.get("/api/v1/employer/singlePostedJobs/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await jobsCollection.findOne(query);
      // console.log(result);
      res.send(result);
    });
    // update  single job data by employer
     app.put("/api/v1/employer/myPostedJobs/update/:id", async (req, res) => {
       const id = req.params.id;
       const data = req.body;
       console.log(data);
       const filter = {
         _id: new ObjectId(id),
       };
       const options = { upsert: true };
       const updatedData = {
         $set: {
           Job_title: data.Job_title,
           Deadline: data.Deadline,
           Category: data.Category,
           Short_description: data.Short_description,
           Category: data.Category,
           minPrice: data.minPrice,
           maxPrice: data.maxPrice,
         },
       };
       const result = await jobsCollection.updateOne(
         filter,
         updatedData,
         options
       );
       console.log(result);
       res.send(result);
     });
    // delete from job collection by a employer
    // delete single cart item
    app.delete("/api/v1/employer/delete/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };
      const result = await jobsCollection.deleteOne(query);
      console.log(result);
      res.status(200).send(result);
    });
    // update single job

   
    //
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Career Volt server is running");
});

app.listen(port, () => {
  console.log(`Career Volt server is running on port ${port}`);
});
