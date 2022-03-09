import axios from  'axios'

const url = 'http://localhost:5000/api/status/'

class StatusService {
    static getStatus(){
        return axios.get(url)
    }
}

export default StatusService
