import express from "express";
import morgan from "morgan";
import cors from "cors";

const app = express();

app.use(cors());
app.use(morgan('tiny'));

app.get("/", (req, res) => {
  res.send("Roni is live");
});

const PORT = 4800;

app.listen(PORT, () => console.log(`Roni listening on Port ${PORT}`))
   .on('error', (err) => {
       console.error("Server failed:", err);
       process.exit(1);
   });

// Optional: force Node event loop to stay active if bundler removes async references
setInterval(() => {}, 1 << 30);