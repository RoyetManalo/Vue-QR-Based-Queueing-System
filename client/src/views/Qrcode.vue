<template>
  <div class="qrcode">
    <div class="heading">
      <h2>QR Code</h2>
      <span>Queue ID: {{ queueInfo._id }}</span>
    </div>

    <Qr :imgSrc="imgSrc" />
    <div class="person-details">
      <span>Full Name: {{ queueInfo.firstName }} {{ queueInfo.lastName }}</span>
      <span
        >Issuance Date and Time: <br />
        {{ queueInfo.date }}</span
      >
    </div>
    <div class="button">
      <Button text="Download QR Code" @click="downloadQR" />
      <router-link to="/viewqcard"><Button text="Back" /></router-link>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import Button from "../components/Button.vue";
import Queuenumber from "../components/Queuenumber.vue";
import Qr from "../components/Qr.vue";
import QueueService from "../QueueService";
export default {
  name: "Qrcode",
  components: {
    Button,
    Queuenumber,
    Qr,
  },
  props: {},
  data() {
    return {
      imgSrc: "",
      queueNumber: this.$store.state.newPersonInQueue.queueNumber,
    };
  },
  methods: {
    async downloadQR() {
      console.log(localStorage.getItem("token"));
      const res = await QueueService.downloadQR(localStorage.getItem("token"));
      const url = window.URL.createObjectURL(new Blob([res.data]));
      console.log(url);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Queue Certificate.pdf");
      link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 0); // this is important too, otherwise we will be unnecessarily spiking memory!
    },
  },
  computed: {
    // queueInfo: {
    //   get() {
    //     return this.$store.state.newPersonInQueue;
    //   },
    // },
    queueInfo() {
      return this.$store.state.newPersonInQueue;
    },
  },
  created() {
    this.imgSrc = require(`../assets/qrcodes/${this.queueNumber}-QRCODE.png`);
  },
};
</script>
<style scoped>
.qrcode {
  height: calc(100% - 82px);
  width: 80%;
  max-width: 414px;
  padding: 2rem 0.5rem 0 0.5rem;
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.button {
  margin: 1.5rem 0;
}

h2 {
  padding: 1rem 0;
  color: #008385;
  text-align: left;
}

span {
  display: block;
  text-align: left;
  color: #008385;
  font-size: 1.3rem;
  margin-bottom: 1rem;
}
a {
  text-decoration: none;
}

@media (min-width: 500px) {
  .person-details,
  .heading,
  .button {
    padding: 0 2.6rem;
  }
}
</style>
