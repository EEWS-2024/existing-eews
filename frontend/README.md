# Dokumentasi Deployment untuk Frontend EEWS

Dokumen ini memberikan panduan untuk melakukan deployment frontend EEWS menggunakan Docker. Pastikan untuk memeriksa konfigurasi environment yang ada dalam Dockerfile sebelum melakukan deployment.

## Persyaratan

- Docker
- Git

## Langkah-langkah Deployment

1. **Clone Repositori**
   Clone repositori frontend EEWS ke mesin lokal Anda dengan menjalankan perintah berikut:

   ```bash
   git clone https://github.com/distributed-eews/frontend.git
   cd frontend
   ```

2. **Konfigurasi Environment**
   Pastikan konfigurasi environment dalam Dockerfile telah sesuai dengan kebutuhan Anda. Periksa variabel lingkungan yang ada dalam Dockerfile dan sesuaikan jika diperlukan.
   Buka file `Dockerfile` menggunakan editor teks favorit Anda. Perhatikan bagian konfigurasi di bawah ini:

   ```Dockerfile
   ENV NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
   ENV NEXT_PUBLIC_WS_URL="ws://localhost:8080"
   ```

   Ubah isi dari env tersebut sesuai dengan alamat layanan ini dideploy.

3. **Mulai Kontainer Docker**
   Jalankan kontainer Docker dengan perintah:

   ```bash
   docker-compose up -d
   ```

4. **Verifikasi Deployment**
   Buka browser web dan akses alamat `http://localhost` untuk memastikan frontend EEWS dapat diakses dengan baik.

5. **Pemantauan dan Penyesuaian**
   - Pantau kinerja dan responsivitas frontend EEWS setelah deployment.
   - Pastikan semua fitur dan fungsionalitas berjalan dengan baik.

Dengan langkah-langkah di atas, frontend EEWS Anda seharusnya telah berhasil di-deploy dan dapat diakses. Pastikan untuk memantau dan melakukan penyesuaian sesuai kebutuhan.
