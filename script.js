let currentImageIndex = 0;  // Index de l'image actuelle dans le slider
const images = ['images/singe1.jpeg', 'images/singe2.jpg', 'images/singe3.jpeg', 'images/singe4.jpg' , 'images/singe5.jpeg' , 'images/singe6.avif' , 'images/singe7.jpg']; // Liste des images du slider
let sliderInterval; // Intervalle pour faire défiler les images automatiquement
let videoPlaying = false; // État de la vidéo

// Fonction pour démarrer le slider
function startSlider() {
  document.getElementById('startButton').style.display = 'none';  // Cacher le bouton "Démarrer"
  document.getElementById('restartButton').style.display = 'none';  // Cacher le bouton "Recommencer"
  document.getElementById('endScreen').style.display = 'none'; // Cacher l'écran de fin

  // Lancer le défilement automatique des images
  sliderInterval = setInterval(() => {
    changeImage(1);
  }, 2000);  // L'intervalle est de 2 secondes entre chaque image

  startVideo();
}

// Fonction pour changer l'image
function changeImage(direction) {
  currentImageIndex += direction;
  if (currentImageIndex >= images.length) currentImageIndex = 0;
  if (currentImageIndex < 0) currentImageIndex = images.length - 1;
  document.getElementById('slider-image').src = images[currentImageIndex];
}

// Fonction pour recommencer le jeu
function restartSlider() {
  document.getElementById('slider-image').src = images[currentImageIndex];
  document.getElementById('startButton').style.display = 'inline-block';
  document.getElementById('restartButton').style.display = 'none';
  document.getElementById('endScreen').style.display = 'none';

  clearInterval(sliderInterval); // Arrêter le défilement automatique des images
}

// Fonction pour charger les modèles avant de commencer
async function loadModels() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ]);
  startVideo(); // Démarrer la vidéo une fois les modèles chargés
}

// Fonction pour démarrer la vidéo
function startVideo() {
  const video = document.getElementById('video');
  
  // Créez un canvas uniquement lorsque la vidéo est prête à jouer
  video.addEventListener('canplay', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
              
      // Vérifier si un sourire est détecté
      detections.forEach(detection => {
        const expressions = detection.expressions;
        if (expressions.happy > 0.8) {  // Si l'expression "happy" est forte (plus de 70%)

          // Afficher l'écran de fin et arrêter le défilement des images
          clearInterval(sliderInterval);
          document.getElementById('endScreen').style.display = 'block';
          document.getElementById('restartButton').style.display = 'inline-block';
        }
      });
    }, 100);
  });

  // Demandez l'accès à la caméra et lancez la vidéo
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  );
  
  video.play(); // Démarre la lecture de la vidéo
}

// Charger les modèles avant de démarrer
loadModels();