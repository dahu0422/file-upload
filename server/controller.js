const multiparty = require("multiparty");
const path = require("path");
const fse = require("fs-extra");
const fs = require("fs");

const UPLOAD_DIR = path.resolve(__dirname, ".", "uploads"); // 大文件存储目录

const resolvePost = (req) =>
  new Promise((resolve) => {
    let chunk = "";
    req.on("data", (data) => {
      chunk += data;
    });
    req.on("end", () => {
      resolve(JSON.parse(chunk));
    });
  });

const pipeStream = (path, writeStream) =>
  new Promise((resolve) => {
    const readStream = fse.createReadStream(path);
    readStream.on("end", () => {
      fse.unlinkSync(path);
      resolve();
    });
    readStream.pipe(writeStream);
  });

exports.handleUploadFile = async function (req, res) {
  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.log("err", err);
      res.status = 500;
      res.end("process file chunk failed");
      return;
    }
    console.log(fields, files);
    const [chunk] = files.chunk;
    const { name, hash } = fields;
    // 创建建临时文件夹用于临时存储 chunk
    const chunkDir = path.resolve(UPLOAD_DIR, `chunkDir${name}`);

    // 如果不存在文件目录创建
    if (!fse.existsSync(chunkDir)) {
      await fse.mkdirs(chunkDir);
    }
    await fse.move(chunk.path, `${chunkDir}/${hash}`);
    res.end("received file chunk");
  });
};

exports.handleMergeFile = async function (req, res) {
  const data = await resolvePost(req);
  const { fileName, size } = data;
  // 读取上传切片
  const chunkDir = path.resolve(UPLOAD_DIR, "chunkDir" + fileName);
  const chunks = fs
    .readdirSync(chunkDir)
    .sort((a, b) => a.split("-")[1] - b.split("-")[1])
    .map((name) => path.resolve(UPLOAD_DIR, "chunkDir" + fileName, name));

  //创建写入文件夹
  const filePath = path.resolve(UPLOAD_DIR, `${fileName}`);
  console.log(chunks, filePath);
  const writeStream = fs.createWriteStream(filePath);

  for (const chunk of chunks) {
    const readStream = fs.createReadStream(chunk);
    await new Promise((resolve, reject) => {
      readStream.on("end", () => {
        console.log(`${chunk}写入完成`);
        resolve(`${chunk}写入完成`);
      });
      readStream.on("error", reject);
      readStream.pipe(writeStream, { end: false });
    });
    // 在所有文件都写入后，关闭写入流
    writeStream.end();
    // fs.rmdirSync(chunkDir);
    res.end(
      JSON.stringify({
        code: 0,
        message: "file merged success",
      })
    );
  }

  // 成功写法
  // const filePath = path.resolve(UPLOAD_DIR, `${fileName}`);
  // const chunkDir = path.resolve(UPLOAD_DIR, "chunkDir" + fileName);
  // const chunkPaths = await fse.readdir(chunkDir);
  // chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1]);
  // await Promise.all(
  //   chunkPaths.map((chunkPath, index) =>
  //     pipeStream(
  //       path.resolve(chunkDir, chunkPath),
  //       // 指定位置创建可写流
  //       fse.createWriteStream(filePath, {
  //         start: index * size,
  //         end: (index + 1) * size,
  //       })
  //     )
  //   )
  // );
  // fse.rmdirSync(chunkDir); // 合并后删除保存切片的目录
  // res.end(
  //   JSON.stringify({
  //     code: 0,
  //     message: "file merged success",
  //   })
  // );
};
