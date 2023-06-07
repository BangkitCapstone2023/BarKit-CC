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
  * [Run Locally With NPM](#running-run-locally-with-npm)
  * [Run Locally With Docker](#whale2-run-locally-with-docker) (Recommended)
  * [Deployment](#cloud-deployment)
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

To run this project, you will need the following credential file:
  <ul>
    <li><a href="https://firebase.google.com/docs/admin/setup">Firebase Admin SDK</a> <br /> Go to firebase console -> pick your project -> project setting -> service account tab -> genereate new private key</li>
    <li><a href="https://firebase.google.com/docs/web/setup">Firebase Config/Client</a> <br /> Go to firebase console -> pick your project -> project setting -> in general tab scroll down -> click add app button -> pick web logo "<\>" -> fill app nickname & click register app -> copy all <em>const firebaseConfig</em> variabel value -> make a new notepad -> paste value from firebaseConfig variabel before</li>
    <li><a href="https://cloud.google.com/storage/docs/apis">Cloud Storage Credential</a> <br /> Go to google cloud console -> go to IAM & Admin tab -> service account -> create service account -> fill service account name (ex: cloud-storage-barkit-admin) -> select the role to cloud storage admin -> click done -> click your service account you already created -> go to KEYS tab -> click add key -> create new key -> pick json -> create </li>
  </ul>
  
_Note:_ 
  <em>Note: if you are someone i know, request & <strong>download our credential</strong> <a href="https://drive.google.com/drive/folders/1nNdzHuIT3-UUD0rRbfC111-mpkefqcfc?usp=sharing">Here</a></em>
  
<!-- Getting Started -->
## 	:toolbox: Getting Started

<!-- Prerequisites -->
### :bangbang: Prerequisites

This project uses NPM as package manager

* Install node.js version 14.21.3 <a href="https://nodejs.org/en/blog/release/v14.21.3">*here*<a/> <br />
  Make sure your node.js and npm already install in your device using, open cmd and run:
  ```bash
  node -v
  npm -v
  ```
   _**Note: In development we are using `Windows 10 pro`, `Visual Studio Code`, `node version 14.21.3`, and `npm version 6.14.18`.**_
  
 * If there are **any error with tfjs-node** when running at local using NPM **(if you are not clone/run the server yet,ignore this step)**, try this step 1 by 1: <a name="tfjs-node-error"></a>
    1. `npm install -g node-gyp`
    2. Go to powershell -> Run as administrator -> `npm install -g --production windows-build-tools`
    3. `Install the current version of Python` from the [Microsoft Store package](https://www.microsoft.com/en-us/p/python-310/9pjpw5ldxlz5).
    4. `Install Visual C++ Build Environment`: [Visual Studio Build Tools](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools)
    (using "Visual C++ build tools" workload) or [Visual Studio Community](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community)
   (using the "Desktop development with C++" workload)
  
     _Note_ : **For TFJS-Node Error**
    1. If you _already done with 1 step (ex: install node-gcp), try running the server again_. If the error persists, move on to the next step.
    2. If there is any error with node-gyp, try going [here](https://github.com/nodejs/node-gyp/issues/809).
    3. If there is any error with step 2 (install windows-build-tools), check [here](https://github.com/tensorflow/tfjs/blob/master/tfjs-node/WINDOWS_TROUBLESHOOTING.md#msbuildexe-exceptions).
    4. If there is any error when trying steps 3-4 (install Python & Visual C++ build tools), check [here](https://github.com/nodejs/node-gyp#on-windows).
    
* [Docker](https://www.docker.com/) (if you want to run this repostory with docker)
* Google Cloud Platform Account (If You want to to deploy it in GCP)
  
  _Note: We already deploy our API but the database we are using is still free tier (firebase spark), not the final delivery databases, and for cloud run we are setting to maximun 2 instances, this for saving GCP money, we will update the credetail to "real credential" and higher cloud run instaces and cpu capacity , no later than 11 June 2023_

<!-- Installation -->
### :running: Run Locally With NPM

Follow this step to run this repostory code in your local device:
  1. Open git bash and Clone the repo
   ```sh
   git clone https://github.com/BangkitCapstone2023/BarKit-CC.git
   ```
  2. Go to project folder 
  ``` sh
  cd BarKit-CC
  ``` 
3. Open the project at VS Code 
  ``` sh
  code . 
  ``` 
  4. open terminal & install Package
  ``` sh
  npm install
  ``` 
5. Make sure you already have the [Credential File](#key-credential-file) and store the credential *file name* in  `app/config/config-template.json` file.
6. And also Change `projectID, bucketName, and databaseURL` value at `app/config/config-template.json` file, with your GCP project id, bucket name, and firestore database url, see the example [here](https://github-production-user-asset-6210df.s3.amazonaws.com/72277295/243223361-3196686f-7fa0-4ed5-a64a-d8fc5fdc9814.PNG) 
7. Change `config-template.json` file name to `config.json`
8. Start the server
   ```sh
   npm start, or
   npm run dev (using nodemon)
   ```
 _Note:_
  1. Steps 5-7 are only performed if you do not have access to [Our Credential](https://drive.google.com/drive/folders/1nNdzHuIT3-UUD0rRbfC111-mpkefqcfc?usp=share_link). If you are someone we know, please request to obtain our credentials and config file. After you download our credential make sure to store it at app/config folder.
  2. If there are any errors with `tfjs-node`, try [this step](#tfjs-node-error) 

### :whale2: Run Locally With Docker
  Using Docker so you dont need to configure `node version` or get any error with `tfjs-node`
  1. Open git bash and Clone the repo
   ```sh
   git clone https://github.com/BangkitCapstone2023/BarKit-CC.git
   ```
  2. Go to project folder 
  ``` sh
  cd BarKit-CC
  ``` 
  3. Open the project at VS Code 
  ``` sh
  code . 
  ``` 
  4. Make sure you already have the [Credential File](#key-credential-file) and store the credential *file name* in  `app/config/config-template.json` file.
  5. And also Change `projectID, bucketName, and databaseURL` value at `app/config/config-template.json` file, with your GCP project id, bucket name, and firestore database url, see the example [here](https://github-production-user-asset-6210df.s3.amazonaws.com/72277295/243223361-3196686f-7fa0-4ed5-a64a-d8fc5fdc9814.PNG)
  6. Change `config-template.json` file name to `config.json`
  7. open terminal & build docker image
  ``` sh
  docker build -t barkit-backend .
  ``` 
  8. Run the docker image
  ```sh
  docker run -p 8080:8080 barkit-backend
  ```
   _Note:_
  1. Steps 4-6 are only performed if you do not have access to [Our Credential](https://drive.google.com/drive/folders/1nNdzHuIT3-UUD0rRbfC111-mpkefqcfc?usp=share_link). If you are someone we know, please request to obtain our credentials and config file. After you download our credential make sure to store it at app/config folder.
  2. You can use another name & add tag for the image

<!-- Deployment -->
### :cloud: Deployment

To deploy this project we are using cloud run at GCP (you can use another service), this is the way to deploy it at cloud run:

1. Build Container Image
```bash
  docker build -t IMAGE-NAME . 
```
2. Run the docker image for make sure everything okay
  ```bash
  docker run -p 8080:8080 IMAGE-NAME
  ```
 3. Make a <a href="https://cloud.google.com/artifact-registry/docs/repositories/create-repos">repostory at artifact registery</a>
 4. Push the <a href="https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling">Docker image to a artifact registery</a>
   ```bash
  docker tag SOURCE-IMAGE LOCATION-docker.pkg.dev/PROJECT-ID/REPOSITORY/IMAGE:TAG
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

