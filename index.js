const OUTPUT_FOLDER = "converted-images";
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const axios = require("axios"); // ✅ Ajout pour télécharger des images depuis une URL

const app = express();
const cors = require("cors");
app.use(cors());
app.use("/converted-images", express.static(OUTPUT_FOLDER));

const PORT = 5000;
const UPLOADS_FOLDER = "uploads";

app.use(express.json()); // ✅ Gérer JSON dans les requêtes

// Middleware pour gérer l'upload des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_FOLDER)) fs.mkdirSync(UPLOADS_FOLDER);
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Route pour convertir une image depuis une URL
app.post("/convert-url", async (req, res) => {
  const { imageUrl, format } = req.body;

  if (!imageUrl || !format) return res.status(400).json({ error: "URL et format requis" });

  const validFormats = ["webp", "jpg", "png", "gif"];
  if (!validFormats.includes(format))
    return res.status(400).json({ error: "Format non supporté" });

  if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER);

  try {
    const response = await axios({
      url: imageUrl,
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(response.data);
    const fileName = path.basename(imageUrl).split("?")[0]; // Supprime les paramètres d'URL
    const fileExt = path.extname(fileName) || ".jpg"; // Définit une extension par défaut si absente
    const cleanFileName = path.parse(fileName).name; // Supprime l'extension

    const outputPath = path.join(OUTPUT_FOLDER, `${cleanFileName}.${format}`);

    await sharp(imageBuffer).toFormat(format).toFile(outputPath);

    res.json({ message: "Conversion réussie", file: `/converted-images/${path.basename(outputPath)}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Route pour télécharger tous les fichiers convertis sous forme de ZIP
app.get("/download-zip", async (req, res) => {
  const zipName = `converted_images.zip`;
  const zipPath = path.join(OUTPUT_FOLDER, zipName);

  const archive = archiver("zip", { zlib: { level: 9 } });
  res.attachment(zipName);
  archive.pipe(res);

  fs.readdirSync(OUTPUT_FOLDER).forEach((file) => {
    const filePath = path.join(OUTPUT_FOLDER, file);
    archive.file(filePath, { name: file });
  });

  archive.finalize();
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
