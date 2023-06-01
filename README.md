<div align="center">

  <img src="https://github.com/BangkitCapstone2023/BarKit-CC/assets/72277295/2336c3c0-b237-4a17-8cd4-f66502d25547" alt="logo" width="200" height="auto" />
  <h1>BarKit (Barang Kita) Backend</h1>
  
  <p>
    Backend For Bangkit 2023 Final Capstone Project  
  </p>
  
  
<!-- Badges -->
<p>
  <a href="https://github.com/BangkitCapstone2023/BarKit-CC/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/BangkitCapstone2023/BarKit-CC" alt="contributors" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/last-commit/BangkitCapstone2023/BarKit-CC" alt="last update" />
  </a>
  <a href="https://github.com/BangkitCapstone2023/BarKit-CC/network/members">
    <img src="https://img.shields.io/github/forks/BangkitCapstone2023/BarKit-CC" alt="forks" />
  </a>
  <a href="https://github.com/BangkitCapstone2023/BarKit-CC/stargazers">
    <img src="https://img.shields.io/github/stars/BangkitCapstone2023/BarKit-CC" alt="stars" />
  </a>
  <a href="https://github.com/BangkitCapstone2023/BarKit-CC/issues/">
    <img src="https://img.shields.io/github/issues/BangkitCapstone2023/BarKit-CC" alt="open issues" />
  </a>
</p>
   
<h4>
    <a href="https://documenter.getpostman.com/view/25287984/2s93m4Y2zV">API Documentation</a>
  <span> · </span>
    <a href="https://github.com/BangkitCapstone2023/BarKit-CC/issues/">Report Bug</a>
  <span> · </span>
    <a href="https://github.com/BangkitCapstone2023/BarKit-CC/issues/">Request Feature</a>
  </h4>
</div>

<br />

<!-- Table of Contents -->
# :notebook_with_decorative_cover: Table of Contents

- [About the Project](#star2-about-the-project)
  * [Screenshots](#camera-screenshots)
  * [Tech Stack](#space_invader-tech-stack)
  * [Features](#dart-features)
  * [Environment Variables](#key-credential-file)
- [Getting Started](#toolbox-getting-started)
  * [Prerequisites](#bangbang-prerequisites)
  * [Run Locally](#running-run-locally)
  * [Deployment](#triangular_flag_on_post-deployment)
- [Usage](#eyes-usage)
- [Contributing](#wave-contributing)
- [Contact](#handshake-contact)
- [Acknowledgements](#gem-acknowledgements)

  

<!-- About the Project -->
## :star2: About the Project


<!-- Screenshots -->
### :camera: Screenshots
<div align="center" style="">
  <img src="https://github.com/BangkitCapstone2023/BarKit-CC/assets/72277295/5597a258-2b16-40b4-b2de-102cea468907" alt="Arc-Barkit drawio" width="400" height="330" style="display: inline-block;">
  <img src="https://github.com/BangkitCapstone2023/BarKit-CC/assets/72277295/4e72a58b-8a06-4a57-a452-1d3103d5bac8" alt="Database drawio" width="400" height="330" style="display: inline-block; margin-left:15px;">
</div>

<!-- TechStack -->
### :space_invader: Tech Stack

  <h4>BackEnd:</h4>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />
  <img src="https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black" />

<h4>Cloud:</h4>
  <img src="https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />

<h4>Tools:</h4>
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />

<!-- Features -->
### :dart: Features

You can see all api feature at our [API documentation](https://documenter.getpostman.com/view/25287984/2s93m4Y2zV)

<!-- Env Variables -->
### :key: Credential File 

To run this project, you will need to add the following credential file to app/config folder

  <ul>
    <li><a href="https://firebase.google.com/docs/admin/setup">Firebase Admin SDK</a></li>
    <li><a href="https://firebase.google.com/docs/web/setup">Firebase Config/Client</a></li>
    <li><a href="https://cloud.google.com/storage/docs/apis">Cloud Storage Credential</a></li>
  </ul>
  
_Note:_ Change the name file
  <ul>
    <li>Firebase Admin SDK = firebaseAccountKey2.json</li>
    <li>Firebase Config = firebaseClientConfig2.json</li>
    <li>Cloud Storage Credential = cloudStorageKey2.json</li>
  </ul>

<!-- Getting Started -->
## 	:toolbox: Getting Started

<!-- Prerequisites -->
### :bangbang: Prerequisites

This project uses NPM as package manager

* Install node.js version 14.21.3 <a href="https://nodejs.org/en/blog/release/v14.21.3">*here*<a/>
* Make sure your node.js and npm already install in your device using, open cmd and run:
  ```bash
  node -v
  npm -v
  ```
  _Note: In development we are using **node version 14.21.3** and **npm version 6.14.18**_

<!-- Installation -->
### :running: Run Locally

Follow this step to run this repostory code in your local device:
  1. Clone the repo
   ```sh
   git clone https://github.com/BangkitCapstone2023/BarKit-CC.git
   ```
2. Go to project
   ```sh
   cd BarKit-CC
   ```
3. Install Package
   ```sh
   npm install
   ```
4. Make sure you already have the [Credential File](#key-credential-file) and store it in the `app/config` folder.
5. Start the server
   ```sh
   npm start, or
   npm run dev (using nodemon)


<!-- Deployment -->
### :triangular_flag_on_post: Deployment

To deploy this project we are using cloud run at GCP (you can use another way), but this is the way to deploy it at cloud run:

1. Make sure your cmd/git path already at BarKit-CC folder
```bash
  docker build -t IMAGE-NAME
```
2. Run the docker image for make sure everything okay
  ```bash
  docker run -p 8080:8080 IMAGE-NAME
  ```
 3. Make a <a href="https://cloud.google.com/artifact-registry/docs/repositories/create-repos">repostory at artifact registery</a>
 4. Push the <a href="https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling">Docker image to a artifact registery</a>
   ```bash
  docker tag barkit-image docker tag SOURCE-IMAGE LOCATION-docker.pkg.dev/PROJECT-ID/REPOSITORY/IMAGE:TAG
  docker push YOUR-TAGGED-IMAGE-NAME
  ```
  5. Create a <a href="https://cloud.google.com/run/docs/deploying">cloud run service </a> and use your image at artifac registery repostory
  6. Check your deployed API Link
  
  _Note:_
  1. Replace IMAGE-NAME, PROJECT-ID, REPOSTORY, TAG, YOUR-TAGGED-IMAGE-NAME according to what you have/want
  2. You can also use our cloudbuild.yaml file to CI/CD using cloud build at GCP, but dont forget to replace some variabel there


<!-- Usage -->
## :eyes: Usage
  After you running the server you can testing it at postman, you can see our <a href="https://documenter.getpostman.com/view/25287984/2s93m4Y2zV">**API Documentation**</a> for more detail 

<!-- Contributing -->
## :wave: Contributing

<h5>Contributtor in this repostory:</h5>
<a href="https://github.com/BangkitCapstone2023/BarKit-CC/contributors">
  <img src="https://contrib.rocks/image?repo=BangkitCapstone2023/BarKit-CC" />
</a>

Contributions are always welcome!
See [CONTRIBUTING.md](https://github.com/BangkitCapstone2023/BarKit-CC/blob/main/CONTRIBUTING.md) for ways to get started.

<!-- Contact -->
## :handshake: Contact

Muhammad Thoriq Ali Said - [LinkedIn](https://www.linkedin.com/in/thoriqas/) - [Github](https://github.com/Muhthoriqas) - [Instagram](https://www.instagram.com/mthoriq_as/)

<!-- Acknowledgments -->
## :gem: Acknowledgements

  Bellow is useful resource that we used in our project
 
 - [Firebase Node.js Docs](https://firebase.google.com/docs/reference/node)
 - [Google Cloud Platform Docs](https://cloud.google.com/docs)
 - [Tensorflow.js Docs](https://www.tensorflow.org/js/guide/nodejs)
 - [Clour Run Deploy With Artifact Registery](https://www.youtube.com/watch?v=b7G1pmd-0mk)
 - [Cloud Run CI/CD Tutorial](https://www.youtube.com/watch?v=Sh4I-s7O8rs&t=111s)
 - [Readme Template](https://github.com/Louis3797/awesome-readme-template)
 - [Contributting Template](https://contributing.md/example/)

