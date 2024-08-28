/**
 * 请求func
 * @param {string} url 请求地址
 * @param {string} method 请求方法
 * @param {object} data 请求体
 * @returns
 */
export default function request({ url, method = "POST", data, headers = {} }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.send(data);
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(xhr.status);
      }
    };
  });
}
