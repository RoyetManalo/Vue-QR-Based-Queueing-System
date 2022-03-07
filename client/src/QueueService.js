import axios from "axios";

const url = "http://localhost:5000/api/queue/";
const downloadQR = "http://localhost:5000/api/queue/downloadqr";
const tokenURL = "http://localhost:5000/auth/token";

class QueueService {
  // Get Latest Queue
  static getLatestQueue(token) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await axios.get(`${url}latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        resolve(
          data.map((queue) => ({
            queueNumber: queue.queueNumber,
          }))
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  static getLatestQueuePerson(token) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await axios.get(`${url}latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        resolve(
          data.map((queue) => ({
            ...queue,
          }))
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  // Get  Queue
  static getQueue(token) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        resolve(
          data.map((queue) => ({
            ...queue,
            createdAt: new Date(queue.createdAt),
          }))
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  // Get Token
  static getToken() {
    return axios.post(tokenURL);
  }

  // Create Queue
  // static insertQueue(firstName, lastName, age, vaccineBrand, dose, date) {
  //   return axios.post(url, {
  //     firstName,
  //     lastName,
  //     age,
  //     vaccineBrand,
  //     dose,
  //     date,
  //   });
  // }

  static insertQueue(
    firstName,
    lastName,
    age,
    vaccineBrand,
    dose,
    date,
    token
  ) {
    return axios.post(
      url,
      { firstName, lastName, age, vaccineBrand, dose, date },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  // Delete Queue
  static deletePost(id, token) {
    return axios.delete(`${url}${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // return axios.delete(url + id)
  }

  // This doesnt work use the code below instead- somehow the Headers are not send in this kind of axios format
  // static downloadQR(token) {
  //   return axios.post(
  //     downloadQR,
  //     {
  //       headers: { Authorization: `Bearer ${token}` },
  //     }
  //     { responseType: "blob" },
  //     { responseType: "arraybuffer" }
  //   );
  // }

  static downloadQR(token) {
    return axios({
      method: "POST",
      url: downloadQR,
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
      responseType: "arraybuffer",
    });
  }
}

export default QueueService;
