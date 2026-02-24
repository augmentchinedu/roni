import express from "express";
import morgan from "morgan";
import cors from "cors";

const app = express();

app.use(cors());
app.use(morgan('tiny'));

app.get("/", (req, res) => {
  res.send("Roni is live");
});

app.listen(4800, () => {
  console.log("Roni listening on Port 4800");
});
