<script setup>
import { ref } from "vue";
import request from './util/request.js'

const size = 10 * 1024 * 1024; // 切片大小 10M
let fileList = ref([]); // 文件列表


function handleFileChange(e) {
  fileList.value = Array.from(e.target.files).map((file) => ({
    origionalFile: file,
    percentage: 0,
    chunks: createFileChunks(file, size),
  }))
  console.log('文件列表', fileList.value);
}

/**
 * 生成文件切片
 * @param {File} file File Obj
 * @param {number} size 切片大小
 */
function createFileChunks(file, size) {
  const fileChunks = [] // 文件切片列表
  let slicedSize = 0 // 切片大小
  while (slicedSize < file.size) {
    fileChunks.push({
      chunk: file.slice(slicedSize, slicedSize + size), // 返回一个blob对象
      name: file.name,
      size: file.size,
      hash: `${file.name}_${fileChunks.length}`,
      percentage: 0, // 进度
      index: fileChunks.length, // 切片索引
    })
    slicedSize += size
  }
  return fileChunks
}

// 上传文件切片
async function uploadFileChunks(file, fileChunks) {
  console.log(fileChunks);
  const requests = fileChunks.map(fileChunk => {
    const formData = new FormData()
    formData.append('chunk', fileChunk.chunk)
    formData.append('name', fileChunk.name)
    formData.append('size', fileChunk.size)
    formData.append('hash', fileChunk.hash)
    return formData
  }).map((formData, index) => {
    const requestParams = {
      url: 'http://localhost:3000/upload',
      data: formData,
      onProgress: setProgress(file, fileChunks[index])
    }
    return request(requestParams)
  })
  await Promise.all(requests)
  mergeFileChunks(file.origionalFile.name)
  console.log('待上传的请求列表', requests)
}

/**
 * 计算切片和文件上传进度
 * @param {Object} file 上传文件
 * @param {blob} chunkData 文件切片
 */
function setProgress(file, chunkData) {
  return (e) => {
    chunkData.percentage = Math.floor((e.loaded / e.total) * 100)
    file.percentage = Math.floor(file.chunks.reduce((acc, cur) => acc + cur.percentage, 0) / file.chunks.length)
  }
}

// 合并切片
function mergeFileChunks(fileName) {
  request({
    url: 'http://localhost:3000/merge',
    data: JSON.stringify({ fileName, size }),
    header: {
      "Content-Type": 'application/json'
    },
  })
}

/**
 * 点击上传按钮，生成文件切片，并发送请求
 */
function handleUpload() {
  if (fileList.value.length === 0) return

  fileList.value.forEach((file, fileChunks) => {
    uploadFileChunks(file, file.chunks)
  })

}
</script>

<template>
  <div class="container">
    <div>
      <input type="file" @change="handleFileChange" multiple>
      <button @click="handleUpload">upload</button>
    </div>
    <div class="file-list">
      <div v-for="file in fileList" :key="file.name" class="file-item">
        <div class="file-item-progress">
          <span>{{ file.origionalFile.name }}</span>
          <progress max=" 100" :value="file.percentage"></progress>
        </div>
        <div v-for="chunk in file.chunks" :key="chunk.hash" class="chunk-item">
          <span>{{ chunk.hash }}</span>
          <progress max="100" :value="chunk.percentage"></progress>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.file-list {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.file-item {
  display: flex;
  flex-direction: column;

  .file-item-progress {
    display: flex;
    align-items: center;

    span {
      width: 20%;
    }
  }
}

.chunk-item {
  display: flex;
  align-items: center;

  span {
    width: 20%;
  }
}

progress {
  flex: 1;
  margin-left: 16px;
}
</style>


