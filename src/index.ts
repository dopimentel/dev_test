import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import { User } from './entity/User';
import { Post } from './entity/Post';

const app = express();
app.use(express.json());

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "test_db",
  entities: [User,Post],
  synchronize: true,
});

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const initializeDatabase = async () => {
  await wait(20000);
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");
  } catch (err) {
    console.error("Error during Data Source initialization:", err);
    process.exit(1);
  }
};

initializeDatabase();

app.post('/users', async (req, res) => {
  try {
    const user = AppDataSource.getRepository(User).create(req.body);
    const result = await AppDataSource.getRepository(User).save(user);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to create user", details: err });
  }
});

app.post('/posts', async (req, res) => {
  try {
    const { title, description, userId } = req.body;

    const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const post = AppDataSource.getRepository(Post).create({ title, description, user });
    const result = await AppDataSource.getRepository(Post).save(post);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to create post", details: err });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
