import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Natural sky blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-5, 10, 5);
scene.add(dirLight);

// Audio Listener and Sounds
const listener = new THREE.AudioListener();
camera.add(listener);
const engineSound = new THREE.Audio(listener);
const crashSound = new THREE.Audio(listener);

// Load sounds (optional; comment out if no files)
const audioLoader = new THREE.AudioLoader();
audioLoader.load('engine.mp3', (buffer) => {
    engineSound.setBuffer(buffer);
    engineSound.setLoop(true);
    engineSound.setVolume(0.5);
});
audioLoader.load('crash.mp3', (buffer) => {
    crashSound.setBuffer(buffer);
    crashSound.setVolume(1);
});

// Ground / Road
const roadGeometry = new THREE.BoxGeometry(10, 0.1, 500);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.position.z = -250;
scene.add(road);

// Brown ground on sides
const groundGeometry = new THREE.BoxGeometry(50, 0.1, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.z = -250;
ground.position.y = -0.05;
scene.add(ground);

// Road center white line
const lines = [];
for (let i = -250; i < 250; i += 5) {
    const lineGeom = new THREE.BoxGeometry(0.2, 0.05, 2);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const line = new THREE.Mesh(lineGeom, lineMat);
    line.position.set(0, 0.06, i);
    scene.add(line);
    lines.push(line);
}

// Trees & Houses
const trees = [];
const houses = [];

function createTree(x, z) {
    const trunk = new THREE.CylinderGeometry(0.2, 0.2, 1);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunkMesh = new THREE.Mesh(trunk, trunkMat);
    trunkMesh.position.set(x, 0.5, z);
    
    const leaves = new THREE.ConeGeometry(0.7, 1.5, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const leavesMesh = new THREE.Mesh(leaves, leavesMat);
    leavesMesh.position.set(x, 1.75, z);
    
    scene.add(trunkMesh);
    scene.add(leavesMesh);
    trees.push({ trunk: trunkMesh, leaves: leavesMesh });
}

function createHouse(x, z) {
    const base = new THREE.BoxGeometry(2, 1.5, 2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
    const baseMesh = new THREE.Mesh(base, baseMat);
    baseMesh.position.set(x, 0.75, z);
    
    const roof = new THREE.ConeGeometry(1.5, 1, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const roofMesh = new THREE.Mesh(roof, roofMat);
    roofMesh.position.set(x, 2.25, z);
    
    scene.add(baseMesh);
    scene.add(roofMesh);
    houses.push({ base: baseMesh, roof: roofMesh });
}

for (let z = -200; z < 200; z += 20) {
    createTree(-7, z);
    createTree(7, z);
    createHouse(-12, z);
    createHouse(12, z);
}

// Car Loader
let car;
const loader = new GLTFLoader();
loader.load(
    'car_model.gltf',
    (gltf) => {
        car = gltf.scene;
        car.scale.set(0.5, 0.5, 0.5);
        car.position.set(0, 0.5, 0);
        car.visible = false;
        scene.add(car);
    },
    undefined,
    (error) => {
        console.error('Error loading car model:', error);
        // Fallback: Simple box car
        car = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
        car.position.set(0, 0.5, 0);
        car.visible = false;
        scene.add(car);
    }
);

// AI Tricker
const aiTrickerGeometry = new THREE.BoxGeometry(1, 1, 2);
const aiTrickerMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff });
const aiTricker = new THREE.Mesh(aiTrickerGeometry, aiTrickerMaterial);
aiTricker.position.set(2, 0.5, -50);
aiTricker.visible = false;
scene.add(aiTricker);

// Controls (Keyboard + Touch)
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'p' || e.key === 'P') {
        gamePaused = !gamePaused; // Toggle pause
    }
});
document.addEventListener('keyup', e => keys[e.key] = false);

// Touch controls for mobile
let touchStartX = 0;
document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
});
document.addEventListener('touchmove', e => {
    if (!gameStarted || gamePaused) return;
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX;
    speedX += deltaX * 0.001; // Adjust sensitivity
    touchStartX = touchX;
});

let speedX = 0;
let gamePaused = false;

// Game State
let gameStarted = false;
let score = 0;

// UI Elements
const startBtn = document.createElement('button');
startBtn.innerText = "Start Game";
startBtn.style.position = 'absolute';
startBtn.style.top = '50%';
startBtn.style.left = '50%';
startBtn.style.transform = 'translate(-50%, -50%)';
startBtn.style.padding = '20px 40px';
startBtn.style.fontSize = '24px';
document.body.appendChild(startBtn);

const scoreDisplay = document.createElement('div');
scoreDisplay.innerText = "Score: 0";
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '10px';
scoreDisplay.style.left = '10px';
scoreDisplay.style.color = 'white';
scoreDisplay.style.fontSize = '24px';
scoreDisplay.style.fontFamily = 'Arial';
document.body.appendChild(scoreDisplay);

function resetGame() {
    if (car) {
        car.position.set(0, 0.5, 0);
        car.visible = true;
    }
    aiTricker.position.set(2, 0.5, -50);
    aiTricker.visible = true;
    gameStarted = true;
    gamePaused = false;
    score = 0;
    scoreDisplay.innerText = "Score: 0";
    startBtn.style.display = 'none';
    if (engineSound.buffer) engineSound.play();
}

startBtn.onclick = resetGame;

// Animate
function animate() {
    requestAnimationFrame(animate);

    if (gameStarted && car && !gamePaused) {
        // Smooth Left-Right
        if (keys['ArrowLeft']) speedX -= 0.02;
        else if (keys['ArrowRight']) speedX += 0.02;
        else speedX *= 0.9; // damping
        
        car.position.x += speedX;
        car.position.x = Math.max(-4.5, Math.min(4.5, car.position.x));

        // Forward movement
        car.position.z -= 0.7;
        score += 1; // Increase score over time
        scoreDisplay.innerText = `Score: ${Math.floor(score / 10)}`; // Display as integer
        
        // Loop scenery
        if (car.position.z < -250) {
            car.position.z += 500;
            trees.forEach(tree => {
                tree.trunk.position.z += 500;
                tree.leaves.position.z += 500;
            });
            houses.forEach(house => {
                house.base.position.z += 500;
                house.roof.position.z += 500;
            });
            lines.forEach(line => line.position.z += 500);
        }

        camera.position.z = car.position.z + 5;
        camera.position.y = car.position.y + 5;
        camera.lookAt(car.position);

        // Improved AI Tricker with randomness
        const aiSpeed = 0.04;
        const randomOffset = (Math.random() - 0.5) * 0.1; // Slight randomness
        aiTricker.position.x += (car.position.x - aiTricker.position.x + randomOffset) * aiSpeed;
        aiTricker.position.z += (car.position.z - aiTricker.position.z) * aiSpeed;
        aiTricker.position.x = Math.max(-4.5, Math.min(4.5, aiTricker.position.x));

        // Collision Detection
        const carBox = new THREE.Box3().setFromObject(car);
        const aiBox = new THREE.Box3().setFromObject(aiTricker);
        if (carBox.intersectsBox(aiBox)) {
            if (crashSound.buffer) crashSound.play();
            if (engineSound.isPlaying) engineSound.stop();
            alert(`Caught by the AI Tricker! Final Score: ${Math.floor(score / 10)}`);
            gameStarted = false;
            car.visible = false;
            aiTricker.visible = false;
            startBtn.innerText = "Restart Game";
            startBtn.style.display = 'block';
        }
    }

    renderer.render(scene, camera);
}

animate();
