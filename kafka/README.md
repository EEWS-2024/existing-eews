Berikut adalah contoh dokumentasi README untuk melakukan deployment Kafka menggunakan Docker Compose:

---

# Panduan Deployment Kafka menggunakan Docker Compose

## Deskripsi

Repo ini menyediakan Docker Compose file untuk mendeploy Kafka dan Zookeeper menggunakan Docker. Kafka diatur agar dapat diakses dari luar VM dengan IP atau hostname yang sesuai.

## Persyaratan

Sebelum memulai deployment, pastikan komputer Anda telah memenuhi persyaratan berikut:

- Docker telah terinstal dan berjalan pada komputer Anda.
- Docker Compose telah terinstal pada komputer Anda.

## Instruksi Deployment

1. **Konfigurasi IP atau Hostname**

   Buka file `docker-compose.yaml` menggunakan editor teks favorit Anda. Perhatikan bagian konfigurasi di bawah ini:

   ```yaml
   environment:
     KAFKA_LISTENERS: DOCKER://eews-kafka:9093,LOCAL://eews-kafka:19092,OUTSIDE://eews-kafka:29092
     KAFKA_ADVERTISED_LISTENERS: DOCKER://eews-kafka:9093,LOCAL://localhost:19092,OUTSIDE://34.134.231.165:29092
   ```

   Ubah `34.134.231.165` dengan IP atau hostname dari komputer tempat Kafka akan dijalankan.

2. **Menjalankan Deployment**

   Jalankan perintah berikut untuk memulai deployment Kafka:

   ```bash
   docker-compose up -d
   ```

   Dengan opsi `-d`, layanan akan berjalan di latar belakang.

3. **Verifikasi Deployment**

   Setelah selesai, Anda dapat memverifikasi bahwa Kafka berjalan dengan mengecek status kontainer:

   ```bash
   docker ps
   ```

   Anda juga dapat menggunakan alat Kafka untuk membuat topik atau mengirim dan menerima pesan untuk memastikan semuanya berfungsi sebagaimana mestinya.
