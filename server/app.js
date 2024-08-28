const http = require("http");
const server = http.createServer();
const { handleUploadFile, handleMergeFile } = require("./controller");

server.on("request", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    res.status = 200;
    res.end();
    return;
  }

  // 文件上传
  if (req.url === "/upload") {
    console.log("文件上传");
    handleUploadFile(req, res);
  }

  // 文件合并
  if (req.url === "/merge") {
    console.log("文件合并");
    handleMergeFile(req, res);
  }
});

server.listen(3000, () => console.log("listening port 3000"));
