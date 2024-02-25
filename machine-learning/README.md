# Dokumentasi Deployment untuk Machine Learning

Layanan ini bertujuan untuk melakukan prediksi dengan menggunakan model deep-learning. Layanan ini akan berada di belakang load balancer dengan menggunakan nginx. Layanan ini akan berjalan di port 3000.

## Persyaratan

- Docker
- docker-compose
- Git

## Langkah 1: Clone Repositori

Clone repositori layanan machine learning ke mesin lokal Anda menggunakan perintah berikut:

```bash
git clone https://github.com/distributed-eews/machine-learning.git
cd machine-learning
```

## Langkah 2: Konfigurasi Docker Compose

Tambahkan konfigurasi untuk setiap layanan machine learning pada file `docker-compose.yaml`.

```yaml
version: '3'
services:
  eews-ml-1:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eews-ml-1
  eews-ml-2:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eews-ml-2
  # Tambahkan layanan machin learning lainnya sesuai kebutuhan
```

## Langkah 4: Mulai Kontainer Docker

Gunakan docker-compose untuk memulai layanan machine learning:

```bash
docker-compose up -d
```

## Langkah 5: Verifikasi Deployment

Pastikan kontainer machine learning berjalan tanpa masalah:

```bash
docker-compose ps
```

## Langkah 6: Pemantauan dan Penyesuaian

- Periksa ketersediaan layanan machine learning untuk memastikan tidak ada layanan yang menganggur.
- Sesuaikan jumlah layanan machine learning sesuai kebutuhan dengan jumlah partisi pada topik Kafka yang akan dikonsumsi datanya.

Dengan langkah-langkah ini, Layanan machine learning Anda seharusnya berhasil didaftarkan dan berjalan di lingkungan Anda. Pastikan untuk memantau kinerja dan melakukan penyesuaian sesuai kebutuhan.
