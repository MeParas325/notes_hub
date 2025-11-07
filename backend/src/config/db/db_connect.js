import mongoose from "mongoose"
import logger from "../../utils/logger.js";
import {GridFSBucket} from "mongodb";

let gfsBucket;

const connect_db = async () => {
    const DB_NAME=process.env.DB_NAME;
  try {
    const start=Date.now();
    const connection = await mongoose.connect(process.env.MONGO_URL,{
        dbName:DB_NAME
    });

    const end=Date.now();
    const timeTaken = ((end - start) / 1000).toFixed(2); // 2 decimal places
    
    logger.info(`✅  DB-(${DB_NAME}) connected in: ${timeTaken}s`);

    // get the db instane for gridfsbucket
    const DB = connection.connection.db;

    // initialize grid fs bucket
    gfsBucket = new GridFSBucket(DB, {
      bucketName: "pdf_files",
    });

    logger.info("📦 GridFS Bucket initialized: pdf_files");

  } catch (error) {
    logger.error(`❌ DB-(${DB_NAME}) connection error:`, error.message);
    process.exit(1); // stop app if DB fails
  }
};

export { gfsBucket };
export default connect_db;