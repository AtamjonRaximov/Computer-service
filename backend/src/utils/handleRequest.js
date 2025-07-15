export async function handleRequest(req) {
    return new Promise((resolve, reject) => {
      let body = "";
  
      req.on("data", chunk => {
        body += chunk.toString();
      });
  
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (err) {
          reject(new Error("Noto‘g‘ri JSON format"));
        }
      });
  
      req.on("error", err => {
        reject(err);
      });
    });
  }
  