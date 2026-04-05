import { createClient } from "redis";

let redis;
export async function getRedis(){
    if(!process.env.REDIS_URL){
        console.log("Redis Url not found");
        return null;
    }

    if(!redis){
        redis = createClient({url : process.env.REDIS_URL})
        redis.on("error", (err)=> console.log("Redis Error : ", err));
    }

    if(!redis.isOpen){
        await redis.connect();
        console.log("Redis Connected")
    }
    return redis;
}