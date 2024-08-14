const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');

// middleware
app.use(cors());  // to get data from backend 
app.use(express.json()); // to get req body 





// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kkn2zyc.mongodb.net/?appName=Cluster0`;


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
        // Connect the client to the server
        await client.connect();

        const userCollection = client.db('productsDB').collection('users');
        const productCollection = client.db('productsDB').collection('products');
        const serviceCollection = client.db('productsDB').collection('services');
        const blogCollection = client.db('productsDB').collection('blogs');
        const specialistCollection = client.db('productsDB').collection('specialist_requests');

        // const userCollection = client.db('productsDB').collection('users');


        // specialist section
        // Create a new specialist request
        app.post('/specialists', async (req, res) => {
            const specialist = req.body;
            // console.log(specialist);
            try {
                const result = await specialistCollection.insertOne(specialist);

                // Send notification email to admin
                const mailOptions = {
                    from: specialist.email,
                    to: process.env.EMAIL_ADMIN, // replace with admin's email address
                    subject: 'New Specialist Request',
                    text: `A new specialist request has been received from ${specialist.name}. Details:\n\n${JSON.stringify(specialist, null, 2)}`
                };

                // Nodemailer setup
                const transporter = nodemailer.createTransport({
                    service: 'gmail', // or your email provider
                    auth: {
                        user: process.env.EMAIL_USER, // your email
                        pass: process.env.APP_PASS // your email password
                    }
                });

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                        res.status(500).send({ message: 'Error sending email', error });
                    } else {
                        res.status(201).send({ result, message: 'Specialist request received and email sent' });
                    }
                });
            } catch (error) {
                console.error('Error saving specialist request:', error);
                res.status(500).send({ message: 'Error saving specialist request', error });
            }
        });

        // Get all specialists
        app.get('/specialists', async (req, res) => {
            try {
                const cursor = specialistCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching specialists:', error);
                res.status(500).send({ message: 'Error fetching specialists', error });
            }
        });

        // Get a single specialist by ID
        app.get('/specialists/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await specialistCollection.findOne(query);
                res.send(result);
            } catch (error) {
                console.error('Error fetching specialist:', error);
                res.status(500).send({ message: 'Error fetching specialist', error });
            }
        });

        // Update a specialist by ID
        app.put('/specialists/:id', async (req, res) => {
            const id = req.params.id;
            const specialist = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedSpecialist = {
                $set: specialist
            };
            try {
                const result = await specialistCollection.updateOne(filter, updatedSpecialist, options);
                res.send(result);
            } catch (error) {
                console.error('Error updating specialist:', error);
                res.status(500).send({ message: 'Error updating specialist', error });
            }
        });

        // Delete a specialist by ID
        app.delete('/specialists/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await specialistCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                console.error('Error deleting specialist:', error);
                res.status(500).send({ message: 'Error deleting specialist', error });
            }
        });



        // user info api
        app.get('/users', async (req, res) => {
            try {
                const cursor = userCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).send({ message: 'Error fetching users', error });
            }
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);

        })

        app.get('/users/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const user = await userCollection.findOne({ email: email });
                if (user) {
                    res.send(user);
                } else {
                    res.status(404).send({ message: 'User not found' });
                }
            } catch (error) {
                console.error('Error fetching user by email:', error);
                res.status(500).send({ message: 'Error fetching user by email', error });
            }
        });

        // Update user info by email address
        app.put('/users/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const updatedUser = req.body;
                const result = await userCollection.updateOne(
                    { email: email },
                    { $set: updatedUser }
                );
                if (result.matchedCount > 0) {
                    res.send({ message: 'User updated successfully' });
                } else {
                    res.status(404).send({ message: 'User not found' });
                }
            } catch (error) {
                console.error('Error updating user:', error);
                res.status(500).send({ message: 'Error updating user', error });
            }
        });

        /*   app.put('/users/:email', async (req, res) => {
              try {
                  const email = req.params.email;
                  const updatedUser = req.body;
                  
                  // Ensure the `image` field is included even if it does not exist in the database
                  const updateQuery = {
                      $set: updatedUser
                  };
          
                  const result = await userCollection.updateOne(
                      { email: email },
                      updateQuery
                  );
          
                  if (result.matchedCount > 0) {
                      res.send({ message: 'User updated successfully' });
                  } else {
                      res.status(404).send({ message: 'User not found' });
                  }
              } catch (error) {
                  console.error('Error updating user:', error);
                  res.status(500).send({ message: 'Error updating user', error });
              }
          }); */

        // Delete user by email address
        app.delete('/users/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const result = await userCollection.deleteOne({ email: email });
                if (result.deletedCount > 0) {
                    res.send({ message: 'User deleted successfully' });
                } else {
                    res.status(404).send({ message: 'User not found' });
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                res.status(500).send({ message: 'Error deleting user', error });
            }
        });



        // Create a new product

        app.post('/products', async (req, res) => {
            const product = req.body;
            try {
                const result = await productCollection.insertOne(product);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error saving product:', error);
                res.status(500).send({ message: 'Error saving product', error });
            }
        });

        // Get all products
        app.get('/products', async (req, res) => {
            try {
                const cursor = productCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).send({ message: 'Error fetching products', error });
            }
        });

        // Get a single product by ID
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await productCollection.findOne(query);
                res.send(result);
            } catch (error) {
                console.error('Error fetching product:', error);
                res.status(500).send({ message: 'Error fetching product', error });
            }
        });

        // Update a product by ID
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedProduct = {
                $set: product
            };
            try {
                const result = await productCollection.updateOne(filter, updatedProduct, options);
                res.send(result);
            } catch (error) {
                console.error('Error updating product:', error);
                res.status(500).send({ message: 'Error updating product', error });
            }
        });

        // Delete a product by ID
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await productCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                console.error('Error deleting product:', error);
                res.status(500).send({ message: 'Error deleting product', error });
            }
        });

        // services section
        // Create a new service
        app.post('/services', async (req, res) => {
            const service = req.body;
            try {
                const result = await serviceCollection.insertOne(service);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error saving service:', error);
                res.status(500).send({ message: 'Error saving service', error });
            }
        });

        // Get all services
        app.get('/services', async (req, res) => {
            try {
                const cursor = serviceCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching services:', error);
                res.status(500).send({ message: 'Error fetching services', error });
            }
        });

        // Get a single service by ID
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await serviceCollection.findOne(query);
                res.send(result);
            } catch (error) {
                console.error('Error fetching service:', error);
                res.status(500).send({ message: 'Error fetching service', error });
            }
        });

        // Update a service by ID
        app.put('/services/:id', async (req, res) => {
            const id = req.params.id;
            const service = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedService = {
                $set: service
            };
            try {
                const result = await serviceCollection.updateOne(filter, updatedService, options);
                res.send(result);
            } catch (error) {
                console.error('Error updating service:', error);
                res.status(500).send({ message: 'Error updating service', error });
            }
        });

        // Delete a service by ID
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await serviceCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                console.error('Error deleting service:', error);
                res.status(500).send({ message: 'Error deleting service', error });
            }
        });


        // blog section 
        // Create a new blog
        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            try {
                const result = await blogCollection.insertOne(blog);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error saving blog:', error);
                res.status(500).send({ message: 'Error saving blog', error });
            }
        });

        // Get all blogs
        app.get('/blogs', async (req, res) => {
            try {
                const cursor = blogCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching blogs:', error);
                res.status(500).send({ message: 'Error fetching blogs', error });
            }
        });

        // Get a single blog by ID
        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await blogCollection.findOne(query);
                res.send(result);
            } catch (error) {
                console.error('Error fetching blog:', error);
                res.status(500).send({ message: 'Error fetching blog', error });
            }
        });

        // Update a blog by ID
        app.put('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const blog = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedBlog = {
                $set: blog
            };
            try {
                const result = await blogCollection.updateOne(filter, updatedBlog, options);
                res.send(result);
            } catch (error) {
                console.error('Error updating blog:', error);
                res.status(500).send({ message: 'Error updating blog', error });
            }
        });

        // Delete a blog by ID
        app.delete('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const result = await blogCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                console.error('Error deleting blog:', error);
                res.status(500).send({ message: 'Error deleting blog', error });
            }
        });


    } finally {
        // No closing of client connection
    }
}
run().catch(console.log);

app.get('/', (req, res) => {
    res.send('Energy project server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
