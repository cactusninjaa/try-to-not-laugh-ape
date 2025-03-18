let currentImageIndex = 0;  
const images = ['images/singe1.jpeg', 'images/singe2.jpg', 'images/singe3.jpeg', 'images/singe4.jpg', 'images/singe5.jpeg', 'images/singe6.avif', 'images/singe7.jpg'];
let sliderInterval;  
let videoPlaying = false;  
let detectionActive = false; 

function startSlider() {
  document.getElementById('startButton').style.display = 'none';
  document.getElementById('restartButton').style.display = 'none'; 
  document.getElementById('endScreen').style.display = 'none'; 
  document.getElementById('capturedImage').style.display = 'none'; 

  // Reset image index when starting
  currentImageIndex = 0;
  document.getElementById('slider-image').src = images[currentImageIndex];

  sliderInterval = setInterval(() => {
    currentImageIndex++;
    
    // Check if we've reached the end of the slider
    if (currentImageIndex >= images.length) {
      clearInterval(sliderInterval);
      
      // Afficher un écran de fin différent pour une victoire (pas de sourire détecté)
      document.getElementById('endScreen').style.display = 'flex';
      document.getElementById('endScreenTitle').textContent = "Félicitations !";
      document.getElementById('endScreenMessage').textContent = "Vous avez gagné ! Aucun sourire détecté.";
      document.getElementById('capturedImage').style.display = 'none'; // Ne pas afficher la capture
      document.getElementById('restartButton').style.display = 'inline-block';
      detectionActive = false; // Désactiver la détection
      return;
    }
    
    document.getElementById('slider-image').src = images[currentImageIndex];
  }, 2000);  

  // Activate smile detection (camera should already be running)
  detectionActive = true;
}

function changeImage(direction) {
  if (document.getElementById('endScreen').style.display === 'block') return; 
  currentImageIndex += direction;
  if (currentImageIndex >= images.length) currentImageIndex = 0;
  if (currentImageIndex < 0) currentImageIndex = images.length - 1;
  document.getElementById('slider-image').src = images[currentImageIndex];
}

// Fonction pour recommencer le jeu
function restartSlider() {
  document.getElementById('startButton').style.display = 'inline-block';
  document.getElementById('restartButton').style.display = 'none';
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('capturedImage').style.display = 'none'; 

  clearInterval(sliderInterval);  
  detectionActive = false; // Désactiver la détection en attendant un nouveau démarrage
}

// Fonction pour capturer une image du flux vidéo
function captureScreenshot(video) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Vérifier que la vidéo est bien en marche
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.error("Erreur : Impossible de capturer une image, la vidéo est noire.");
    return ""; // Retourner une image vide si problème
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png"); // Retourner l'image en base64
}

// Fonction qui initialise la caméra dès le début
function initializeCamera() {
  const video = document.getElementById('video');
  
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;
    videoPlaying = true;
  }).catch(err => console.error(err));

  video.addEventListener('canplay', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      if (!detectionActive) return; // Bloque la détection si le jeu n'a pas démarré
      
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      detections.forEach(detection => {
        const expressions = detection.expressions;
        if (expressions.happy > 0.8) {  
          setTimeout(() => {
            const screenshot = captureScreenshot(video);
            document.getElementById('capturedImage').src = screenshot;
            document.getElementById('capturedImage').style.display = 'block';
          }, 500);
          // Arrêter tout
          clearInterval(sliderInterval);
          detectionActive = false; 
          
          // Afficher un écran de fin pour une défaite (sourire détecté)
          document.getElementById('endScreen').style.display = 'flex';
          document.getElementById('endScreenTitle').textContent = "Vous avez perdu !";
          document.getElementById('endScreenMessage').textContent = "Sourire détecté !";
          document.getElementById('capturedImage').style.display = 'block'; // Afficher la capture
          document.getElementById('restartButton').style.display = 'inline-block';

          // Ne pas arrêter la vidéo, juste désactiver la détection
          // video.srcObject.getTracks().forEach(track => track.stop());
        }
      });
    }, 100);
  });
}

// Fonction pour démarrer la vidéo et la détection
function startVideo() {
  // Si la caméra est déjà initialisée, juste activer la détection
  if (videoPlaying) {
    detectionActive = true;
    return;
  }
  
  // Sinon initialiser la caméra
  initializeCamera();
}

// Charger les modèles et initialiser la caméra au chargement de la page
async function loadModels() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ]);
  
  // Initialiser la caméra dès le chargement de la page
  initializeCamera();
}

// Initialiser les modèles sans démarrer la détection
loadModels();