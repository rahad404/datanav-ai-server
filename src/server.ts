import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

async function start() {
   await connectDB();
   app.listen(env.PORT, () => {
      console.log(`[server] DataSense API running on port ${env.PORT}`);
   });
}

start();
