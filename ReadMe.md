# 📷 Image Converter - Backend

Ce projet est le backend d'une application de conversion d'images. Il gère l'upload, la conversion et la récupération des fichiers convertis via une API REST construite avec **Node.js**, **Express**, **Multer** et **Sharp**.

## 🚀 Installation & Configuration

### 1️⃣ Cloner et installer les dépendances

```
git clone https://github.com/ton-utilisateur/backend-image-converter.git
cd backend-image-converter
npm install
```

### 2️⃣ Lancer le backend

En étant dans le dossier parent, taper

```
node index.js
```

Le serveur démarre par défaut sur http://localhost:5000.

## 📡 API Endpoints

| Méthode | Endpoint         | Description                              |
|---------|-----------------|------------------------------------------|
| **POST** | `/convert`      | Convertit les images uploadées          |
| **POST** | `/convert-url`  | Convertit une image depuis une URL      |
| **GET**  | `/download-zip` | Télécharge un ZIP de toutes les images  |

## 🛠 Technologies utilisées

Node.js
Express
Multer
Sharp
Axios
Archiver
