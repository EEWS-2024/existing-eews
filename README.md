# Dokumentasi Deployment untuk EEWS (Earthquake Early Warning System)

Dokumen ini memberikan panduan untuk melakukan deployment EEWS menggunakan Docker Compose. EEWS adalah sistem peringatan dini gempa bumi yang terdiri dari berbagai layanan seperti Kafka, Redis, MongoDB, Machine Learning, dan lainnya.

## Persyaratan

- Docker
- Docker Compose
- Git

## Langkah-langkah Deployment

1. **Clone Repositori**
   Clone repositori EEWS ke mesin lokal Anda dengan menjalankan perintah berikut:

   ```bash
   git clone https://github.com/distributed-eews/eews.git
   cd eews
   ```

2. **Konfigurasi Environtment**
   Set env variable pada file .producer.env, .queue.env, .seeder.env, .ws-rest.env

   Buka file `./frontend/Dockerfile` menggunakan editor teks favorit Anda. Perhatikan bagian konfigurasi di bawah ini:

   ```Dockerfile
   ENV NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
   ENV NEXT_PUBLIC_WS_URL="ws://localhost:8080"
   ```

   Ubah `localhost` dengan IP atau hostname dari komputer tempat frontend akan dijalankan.

3. **Konfigurasi Docker Compose**
   Sesuaikan konfigurasi Docker Compose pada file `docker-compose.yaml` untuk menyesuaikan jumlah layanan Kafka, Picker, Queue, dan Machine Learning yang akan dijalankan. Pastikan untuk menambah atau mengurangi layanan sesuai kebutuhan.

4. **Mulai Kontainer Docker**
   Jalankan perintah berikut untuk memulai kontainer Docker:

   ```bash
   docker-compose up -d
   ```

5. **Verifikasi Deployment**
   Pastikan semua kontainer berjalan dengan baik dengan menjalankan perintah:

   ```bash
   docker-compose ps
   ```

6. **Pemantauan dan Penyesuaian**
   - Pantau kinerja dan keandalan setiap layanan dengan menggunakan alat pemantauan yang sesuai.
   - Sesuaikan jumlah layanan Kafka, Picker, Queue, dan Machine Learning sesuai dengan kebutuhan dan beban kerja.

Dengan langkah-langkah di atas, EEWS Anda seharusnya telah berhasil di-deploy dan siap untuk digunakan. Pastikan untuk memantau dan melakukan penyesuaian sesuai kebutuhan.
