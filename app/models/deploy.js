const fs = require('fs');
const readline = require('readline');
const { createCanvas, loadImage } = require('canvas');
const tf = require('@tensorflow/tfjs-node');

// Path ke model JSON
const modelPath = 'C:/Users/HP/Documents/SEMESTER 6/BANGKIT 2023/DATASET/Deploy_VGG16_TFJS/model.json';

// Daftar kategori
const categories = ['CAMERA', 'LCD', 'MATRAS', 'PS', 'SEPATU', 'SPEAKER', 'TAS', 'TENDA'];

// Membaca input dari pengguna
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Masukkan jenis kategori: ', (inputan) => {
  const jenisKategori = inputan.toUpperCase();

  if (categories.includes(jenisKategori)) {
    console.log(`Silahkan upload gambar ${jenisKategori}`);
    console.log();

    rl.question('Masukkan path gambar: ', (path) => {
      // Mengubah ukuran gambar sesuai dengan kebutuhan model
      loadImage(path).then((image) => {
        const canvas = createCanvas(150, 150);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, 150, 150);

        // Mengubah gambar menjadi tensor
        const imgData = ctx.getImageData(0, 0, 150, 150);
        const input = tf.browser.fromPixels(imgData).expandDims(0).toFloat().div(255);

        // Memuat model dari file JSON
        tf.loadLayersModel(`file://${modelPath}`).then((model) => {
          // Melakukan prediksi menggunakan model
          const predictions = model.predict(input);

          // Mendapatkan kelas prediksi
          const predictedClass = predictions.argMax(1).dataSync()[0];
          const hasil = categories[predictedClass];

          // Menampilkan hasil prediksi
          console.log('HASIL DETEKSINYA:');
          console.log();

          if (hasil === jenisKategori) {
            console.log(`Berhasil mengupload ${hasil}`);
          } else {
            console.log(`Gagal, gambar tersebut adalah ${hasil}, bukan ${jenisKategori}`);
          }

          rl.close();
        });
      }).catch((err) => {
        console.error('Gagal memuat gambar:', err);
        rl.close();
      });
    });
  } else {
    console.log(`Kategori ${jenisKategori} tidak tersedia`);
    rl.close();
  }
});
