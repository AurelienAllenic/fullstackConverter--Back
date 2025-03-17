const OUTPUT_FOLDER = "converted-images";
const UPLOADS_FOLDER = "uploads";
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const axios = require("axios");
const os = require("os");

const app = express();
const cors = require("cors");
app.use(cors());
app.use("/converted-images", express.static(OUTPUT_FOLDER));

const PORT = 5000;

app.use(express.json());

// ✅ Création des dossiers nécessaires si non existants
if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
if (!fs.existsSync(UPLOADS_FOLDER)) fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });

// Configuration de Multer pour l'upload des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// 🔹 Convertir une image depuis une URL
app.post("/convert-url", async (req, res) => {
  const { imageUrl, format } = req.body;

  if (!imageUrl || !format) return res.status(400).json({ error: "URL et format requis" });

  const validFormats = ["webp", "jpg", "png", "gif"];
  if (!validFormats.includes(format))
    return res.status(400).json({ error: "Format non supporté" });

  try {
    const response = await axios({ url: imageUrl, responseType: "arraybuffer" });

    const imageBuffer = Buffer.from(response.data);
    const fileName = path.basename(imageUrl).split("?")[0];
    const cleanFileName = path.parse(fileName).name;
    const outputPath = path.join(OUTPUT_FOLDER, `${cleanFileName}.${format}`);

    await sharp(imageBuffer).toFormat(format).toFile(outputPath);

    res.json({ message: "Conversion réussie", file: `/converted-images/${path.basename(outputPath)}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Convertir les fichiers uploadés
// 🔹 Convertir les fichiers uploadés
app.post("/convert", upload.array("images"), async (req, res) => {
    const { format } = req.body;
  
    if (!format) return res.status(400).json({ error: "Format requis" });
  
    const validFormats = ["webp", "jpg", "png", "gif"];
    if (!validFormats.includes(format))
      return res.status(400).json({ error: "Format non supporté" });
  
    try {
      // ✅ Nettoyage du dossier converted-images avant une nouvelle conversion
      fs.readdirSync(OUTPUT_FOLDER).forEach(file => {
        fs.unlinkSync(path.join(OUTPUT_FOLDER, file));
      });
  
      const convertedFiles = [];
  
      for (const file of req.files) {
        const inputPath = path.join(UPLOADS_FOLDER, file.filename);
        const outputPath = path.join(OUTPUT_FOLDER, path.parse(file.filename).name + `.${format}`);
  
        await sharp(inputPath).toFormat(format).toFile(outputPath);
        convertedFiles.push(`/converted-images/${path.basename(outputPath)}`);
      }
  
      res.json({ message: "Conversion réussie", files: convertedFiles });
    } catch (error) {
      console.error("❌ Erreur de conversion :", error);
      res.status(500).json({ error: error.message });
    }
  });
  

// 🔹 Télécharger tous les fichiers convertis sous forme de ZIP
app.get("/download-zip", async (req, res) => {
  const zipName = `converted_images.zip`;
  const zipPath = path.join(OUTPUT_FOLDER, zipName);

  const archive = archiver("zip", { zlib: { level: 9 } });
  res.attachment(zipName);
  archive.pipe(res);

  // ✅ Ajoute TOUS les fichiers convertis et les originaux uploadés dans le ZIP
  fs.readdirSync(OUTPUT_FOLDER).forEach((file) => {
    const filePath = path.join(OUTPUT_FOLDER, file);
    archive.file(filePath, { name: file });
  });

  fs.readdirSync(UPLOADS_FOLDER).forEach((file) => {
    const filePath = path.join(UPLOADS_FOLDER, file);
    archive.file(filePath, { name: `originals/${file}` }); // Met les fichiers d'origine dans un sous-dossier
  });

  archive.finalize();

  // ✅ Supprime les fichiers après création du ZIP
  archive.on("end", async () => {
    try {
      fs.readdirSync(UPLOADS_FOLDER).forEach((file) => {
        fs.unlinkSync(path.join(UPLOADS_FOLDER, file));
      });
      console.log("✅ Fichiers temporaires supprimés après ZIP.");
    } catch (error) {
      console.error("⚠️ Erreur lors de la suppression des fichiers temporaires :", error);
    }
  });
});

// 🔹 Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
