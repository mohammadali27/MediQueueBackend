const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

dotenv.config();

const app = express();
const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const tokenJwt = async (req, res, next) => {
  const authHeder = req?.headers.authorization;
  const token = authHeder.split(" ")[1];
  if (!authHeder) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const db = client.db("MediQueuedb");
    const dataCollection = db.collection("datadb");
    const Booking = db.collection("collectionBooking");

    app.get("/datadb", async (req, res) => {
      const email = req.query.email;

      const query = email ? { email } : {};

      const result = await dataCollection.find(query).toArray();

      res.send(result);
    });
    app.get("/home-datadb", async (req, res) => {
      const cursor = dataCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
      // console.log(result);
    });

    app.get("/datadb/:id", tokenJwt, async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await dataCollection.findOne(query);
      res.send(result);
      // console.log(result);
    });
    app.patch("/datadb/:id", tokenJwt, async (req, res) => {
      const { id } = req.params;
      const UpdateData = req.body;
      const result = await dataCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: UpdateData },
      );
      res.json(result);
    });
    app.post("/datadb", async (req, res) => {
      const newData = req.body;

      const result = await dataCollection.insertOne(newData);

      res.send(result);
    });
    app.delete("/datadb/:id", async (req, res) => {
      const { id } = req.params;
      const result = await dataCollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });
    app.get("/Booking/:userId", tokenJwt, async (req, res) => {
      const { userId } = req.params;
      const result = await Booking.find({ userId }).toArray();
      res.json(result);
    });
    app.post("/Booking", tokenJwt, async (req, res) => {
      const BookinData = req.body;
      const result = await Booking.insertOne(BookinData);
      res.json(result);
    });
    app.delete("/Booking/:BookingId", async (req, res) => {
      const { BookingId } = req.params;
      const result = await Booking.deleteOne({ _id: new ObjectId(BookingId) });
      res.json(result);
    });
    app.get("/datadb/email/:email", async (req, res) => {
      const email = req.params.email;
      const result = await dataCollection.find({ email }).toArray();

      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
