<script setup>
import { reactive } from "vue";
import request from './util/request.js'

const size = 10 * 1024 * 1024; // 切片大小 10M
let fileList = reactive([]); // 文件列表


function handleFileChange(e) {
  fileList = Array.from(e.target.files)
  console.log('文件列表', fileList);
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
    })
    slicedSize += size
  }
  return fileChunks
}

// 上传文件切片
async function uploadFileChunks(fileChunks) {
  console.log(fileChunks);
  const requests = fileChunks.map(fileChunk => {
    const formData = new FormData()
    formData.append('chunk', fileChunk.chunk)
    formData.append('name', fileChunk.name)
    formData.append('size', fileChunk.size)
    formData.append('hash', fileChunk.hash)
    return formData
  }).map((formData) => {
    const requestParams = {
      url: 'http://localhost:3000/upload',
      data: formData
    }
    return request(requestParams)
  })
  await Promise.all(requests)
  mergeFileChunks(fileChunks[0].name)
  console.log('待上传的请求列表', requests)
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
  if (fileList.length === 0) return

  const fileListChunks = fileList.map((file) => createFileChunks(file, size))
  fileListChunks.forEach((fileChunks) => {
    uploadFileChunks(fileChunks)
  })
}
</script>

<template>
  <div>
    <input type="file" @change="handleFileChange" multiple>
    <button @click="handleUpload">upload</button>
  </div>
</template>


