import { app } from "./index";

const port = Number(process.env.PORT) || 8787;

app.listen(port, () => {
  console.log(`🚀 API running locally at http://localhost:${port}`);
});
