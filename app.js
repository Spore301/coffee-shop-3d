// Configuration from provided data
const config = {
    scene: {
        backgroundColor: '#F5E6D3',
        fogColor: '#F5E6D3',
        fogNear: 5,
        fogFar: 50
    },
    environment: {
        brickWall: { width: 20, height: 15, depth: 1, color: '#8B4513', position: [0, 0, -5] },
        floor: { width: 20, height: 1, depth: 10, color: '#363636', position: [0, -5, 0] },
        counter: { width: 18, height: 1.5, depth: 5, color: '#8B7355', position: [0, -3.5, 1] }
    },
    machine: {
        body: { width: 4, height: 5, depth: 2.5, color: '#2F2F2F', metalness: 0.9, roughness: 0.1, position: [0, 0, 0] },
        reservoir: { radius: 0.6, height: 1.2, color: '#1A1A1A', position: [1, 2, 0] },
        spout: { radius: 0.2, height: 0.8, color: '#1A1A1A', position: [0, 1, 2.25] }
    },
    cups: [
        { id: 1, x: -4.5, y: -2.7, z: 2.25, radius: 0.5, height: 1.4, color: '#E0E0E0' },
        { id: 2, x: -2, y: -2.7, z: 2.25, radius: 0.5, height: 1.4, color: '#E0E0E0' },
        { id: 3, x: 0.5, y: -2.7, z: 2.25, radius: 0.5, height: 1.4, color: '#E0E0E0' },
        { id: 4, x: 3, y: -2.7, z: 2.25, radius: 0.5, height: 1.4, color: '#E0E0E0' },
        { id: 5, x: 5.5, y: -2.7, z: 2.25, radius: 0.5, height: 1.4, color: '#E0E0E0' }
    ],
    shelving: {
        positions: [[2, 4, -4.5], [2, 2, -4.5], [-2, 4, -4.5], [-2, 2, -4.5]],
        bottles: [
            { color: '#D4A574', height: 1.8, label: 'Vanilla' },
            { color: '#8B4513', height: 1.6, label: 'Caramel' },
            { color: '#F4A460', height: 1.5, label: 'Hazelnut' }
        ]
    },
    lighting: {
        ambient: { color: '#FFFFFF', intensity: 1.2 },
        directional: { color: '#FFFACD', intensity: 1.5, position: [5, 8, 5] },
        hemisphere: { skyColor: '#FFE4B5', groundColor: '#8B7355', intensity: 0.8 },
        pendants: [
            { position: [-3, 5, -3], color: '#FFD700', intensity: 2.0, distance: 20 },
            { position: [0, 5, -3], color: '#FFD700', intensity: 2.0, distance: 20 },
            { position: [3, 5, -3], color: '#FFD700', intensity: 2.0, distance: 20 }
        ]
    },
    coffee: { color: '#3D2817', opacity: 0.85, fillDuration: 2.0 },
    animation: {
        cupEntranceDuration: 1.2,
        pourStartDelay: 0.5,
        pauseBetweenCups: 0.8,
        cupsToFill: 5,
        loopDelay: 2,
        defaultSpeed: 1
    },
    particles: {
        steam: { count: 50, speed: 0.3, lifetime: 3 },
        dust: { count: 30, driftSpeed: 0.1, lifetime: 8 }
    }
};

// Three.js scene setup
let scene, camera, renderer;
let machine, spout, cups = [], coffeeStreams = [], coffeeFills = [];
let steamParticles = [], dustParticles = [];
let bottles = [], pendantLights = [], aestheticParticles = [];
let isPlaying = true;
let currentCupIndex = 0;
let cycleCount = 0;
let totalCupsFilled = 0;
let uiVisible = true;

// Initialize scene
function initScene() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(config.scene.fogColor, config.scene.fogNear, config.scene.fogFar);
    
    console.log('Scene initialized with background:', config.scene.backgroundColor);

    // Camera - Orthographic
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 10;
    camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
    );
    camera.position.set(15, 3, 12);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    console.log('Renderer initialized:', renderer.domElement.width, 'x', renderer.domElement.height);

    // Lighting - STRONG lighting to ensure scene is visible
    const ambientLight = new THREE.AmbientLight(config.lighting.ambient.color, config.lighting.ambient.intensity);
    scene.add(ambientLight);
    console.log('Ambient light added:', config.lighting.ambient.intensity);

    const directionalLight = new THREE.DirectionalLight(
        config.lighting.directional.color,
        config.lighting.directional.intensity
    );
    directionalLight.position.set(...config.lighting.directional.position);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    console.log('Directional light added:', config.lighting.directional.intensity);

    // Hemisphere light for better global illumination
    const hemisphereLight = new THREE.HemisphereLight(
        config.lighting.hemisphere.skyColor,
        config.lighting.hemisphere.groundColor,
        config.lighting.hemisphere.intensity
    );
    scene.add(hemisphereLight);
    console.log('Hemisphere light added:', config.lighting.hemisphere.intensity);

    // Pendant lights
    config.lighting.pendants.forEach(pendantConfig => {
        const lightGroup = new THREE.Group();
        
        // Light fixture
        const fixtureGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
        const fixtureMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.3
        });
        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        fixture.rotation.x = Math.PI;
        lightGroup.add(fixture);

        // Point light
        const pointLight = new THREE.PointLight(pendantConfig.color, pendantConfig.intensity, pendantConfig.distance);
        pointLight.position.y = -0.3;
        pointLight.castShadow = true;
        lightGroup.add(pointLight);

        lightGroup.position.set(...pendantConfig.position);
        scene.add(lightGroup);
        pendantLights.push({ group: lightGroup, light: pointLight });
    });
}

// Create environment
function createEnvironment() {
    // Brick wall with texture
    const wallGeometry = new THREE.BoxGeometry(
        config.environment.brickWall.width,
        config.environment.brickWall.height,
        config.environment.brickWall.depth
    );
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: config.environment.brickWall.color,
        roughness: 0.9,
        metalness: 0.1
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(...config.environment.brickWall.position);
    wall.receiveShadow = true;
    scene.add(wall);

    // Floor
    const floorGeometry = new THREE.BoxGeometry(
        config.environment.floor.width,
        config.environment.floor.height,
        config.environment.floor.depth
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: config.environment.floor.color,
        roughness: 0.7,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(...config.environment.floor.position);
    floor.receiveShadow = true;
    scene.add(floor);

    // Counter
    const counterGeometry = new THREE.BoxGeometry(
        config.environment.counter.width,
        config.environment.counter.height,
        config.environment.counter.depth
    );
    const counterMaterial = new THREE.MeshStandardMaterial({
        color: config.environment.counter.color,
        roughness: 0.6,
        metalness: 0.1
    });
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(...config.environment.counter.position);
    counter.castShadow = true;
    counter.receiveShadow = true;
    scene.add(counter);

    // Picture frame on wall
    const frameGeometry = new THREE.BoxGeometry(3, 2, 0.1);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.5 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 3, -4.4);
    scene.add(frame);

    const artCanvas = document.createElement('canvas');
    artCanvas.width = 256;
    artCanvas.height = 128;
    const context = artCanvas.getContext('2d');
    context.fillStyle = '#FFF8DC';
    context.fillRect(0, 0, 256, 128);
    context.fillStyle = '#3D2817';
    context.font = 'bold 48px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('COFFEE', 128, 64);

    const canvasTexture = new THREE.CanvasTexture(artCanvas);
    const canvasGeometry = new THREE.PlaneGeometry(2.6, 1.6);
    const canvasMaterial = new THREE.MeshBasicMaterial({ map: canvasTexture });
    const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
    canvas.position.set(0, 3, -4.3);
    scene.add(canvas);
}

// Create shelving and bottles
function createShelving() {
    config.shelving.positions.forEach((pos, index) => {
        // Shelf
        const shelfGeometry = new THREE.BoxGeometry(3, 0.15, 0.6);
        const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7 });
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(...pos);
        shelf.castShadow = true;
        scene.add(shelf);

        // Add bottle on some shelves
        if (index < config.shelving.bottles.length) {
            const bottleConfig = config.shelving.bottles[index];
            const bottleGroup = new THREE.Group();

            const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.18, bottleConfig.height, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: bottleConfig.color,
                transparent: true,
                opacity: 0.8,
                roughness: 0.2,
                metalness: 0.1
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            bottleGroup.add(body);

            const capGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8);
            const capMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.y = bottleConfig.height / 2 + 0.1;
            bottleGroup.add(cap);

            bottleGroup.position.set(pos[0], pos[1] + bottleConfig.height / 2 + 0.2, pos[2]);
            bottleGroup.castShadow = true;
            scene.add(bottleGroup);
            bottles.push(bottleGroup);
        }
    });

    // Add decorative plant
    const potGeometry = new THREE.CylinderGeometry(0.25, 0.2, 0.4, 8);
    const potMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.set(-6, -2.8, 1);
    scene.add(pot);

    const plantGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.9 });
    const plant = new THREE.Mesh(plantGeometry, plantMaterial);
    plant.position.set(-6, -2.3, 1);
    plant.scale.set(1, 1.3, 1);
    scene.add(plant);
}

// Create coffee machine
function createMachine() {
    const machineGroup = new THREE.Group();
    machineGroup.position.y = -0.05;

    // Main body
    const bodyGeometry = new THREE.BoxGeometry(
        config.machine.body.width,
        config.machine.body.height,
        config.machine.body.depth
    );
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: config.machine.body.color,
        metalness: config.machine.body.metalness,
        roughness: config.machine.body.roughness
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(...config.machine.body.position);
    body.castShadow = true;
    body.receiveShadow = true;
    machineGroup.add(body);

    // Water reservoir
    const reservoirGeometry = new THREE.CylinderGeometry(
        config.machine.reservoir.radius,
        config.machine.reservoir.radius,
        config.machine.reservoir.height,
        16
    );
    const reservoirMaterial = new THREE.MeshStandardMaterial({
        color: config.machine.reservoir.color,
        metalness: 0.8,
        roughness: 0.2
    });
    const reservoir = new THREE.Mesh(reservoirGeometry, reservoirMaterial);
    reservoir.position.set(...config.machine.reservoir.position);
    reservoir.castShadow = true;
    machineGroup.add(reservoir);

    // Control panel details
    for (let i = 0; i < 3; i++) {
        const buttonGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
        const buttonMaterial = new THREE.MeshStandardMaterial({
            color: i === 1 ? 0x00ff00 : 0x333333,
            emissive: i === 1 ? 0x00ff00 : 0x000000,
            emissiveIntensity: i === 1 ? 0.5 : 0,
            metalness: 0.6,
            roughness: 0.4
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.rotation.z = Math.PI / 2;
        button.position.set(config.machine.body.width / 2 + 0.05, 0.5 - i * 0.5, 0.5);
        machineGroup.add(button);
    }

    // Drip tray
    const trayGeometry = new THREE.BoxGeometry(3.5, 0.2, 2);
    const trayMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.8, roughness: 0.3 });
    const tray = new THREE.Mesh(trayGeometry, trayMaterial);
    tray.position.y = -2.6;
    tray.castShadow = true;
    machineGroup.add(tray);

    // Platform
    const platformGroup = new THREE.Group();
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.8, roughness: 0.3 });

    // Main platform box
    const platformBodyGeometry = new THREE.BoxGeometry(4.2, 0.2, 1.5);
    const platformBody = new THREE.Mesh(platformBodyGeometry, platformMaterial);
    platformBody.castShadow = true;
    platformBody.receiveShadow = true;
    platformGroup.add(platformBody);

    // Rounded corners
    const cornerRadius = 0.1;
    const cornerHeight = 0.2;
    const cornerGeometry = new THREE.CylinderGeometry(cornerRadius, cornerRadius, cornerHeight, 16);

    const corner1 = new THREE.Mesh(cornerGeometry, platformMaterial);
    corner1.position.set(2.1 - cornerRadius, 0, 0.75 - cornerRadius);
    platformGroup.add(corner1);

    const corner2 = new THREE.Mesh(cornerGeometry, platformMaterial);
    corner2.position.set(-2.1 + cornerRadius, 0, 0.75 - cornerRadius);
    platformGroup.add(corner2);
    
    platformGroup.position.set(0, -2.75, 2.25);
    machineGroup.add(platformGroup);

    // Spout
    const spoutAssembly = new THREE.Group();
    const spoutMaterial = new THREE.MeshStandardMaterial({
        color: config.machine.spout.color,
        metalness: 0.9,
        roughness: 0.2
    });

    const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 16);
    const rod = new THREE.Mesh(rodGeometry, spoutMaterial);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(0, 0, -0.5);
    spoutAssembly.add(rod);

    const spoutGeometry = new THREE.CylinderGeometry(
        config.machine.spout.radius,
        config.machine.spout.radius * 0.8,
        config.machine.spout.height,
        16
    );
    const spoutCylinder = new THREE.Mesh(spoutGeometry, spoutMaterial);
    spoutAssembly.add(spoutCylinder);

    spoutAssembly.position.set(config.machine.spout.position[0], config.machine.spout.position[1], config.machine.spout.position[2]);
    scene.add(spoutAssembly);
    spout = spoutAssembly;

    // Steam wand
    const wandGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
    const wandMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.9, roughness: 0.2 });
    const wand = new THREE.Mesh(wandGeometry, wandMaterial);
    wand.position.set(-1.5, -0.5, 0.8);
    wand.rotation.z = Math.PI / 6;
    machineGroup.add(wand);

    scene.add(machineGroup);
    machine = machineGroup;
}

// Create cups with handles
function createCups() {
    config.cups.forEach((cupConfig, index) => {
        const cupGroup = new THREE.Group();

        // Cup body (cylinder)
        const cupGeometry = new THREE.CylinderGeometry(
            cupConfig.radius,
            cupConfig.radius * 0.8,
            cupConfig.height,
            32,
            1,
            true
        );
        const cupMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(cupConfig.color),
            roughness: 0.1,
            metalness: 0.2,
            transmission: 0.9,
            transparent: true,
            opacity: 0.8,
            ior: 1.5,
            side: THREE.DoubleSide
        });
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        cup.castShadow = true;
        cup.receiveShadow = true;
        cupGroup.add(cup);

        // Cup bottom
        const bottomGeometry = new THREE.CircleGeometry(cupConfig.radius * 0.8, 32);
        const bottom = new THREE.Mesh(bottomGeometry, cupMaterial);
        bottom.rotation.x = -Math.PI / 2;
        bottom.position.y = -cupConfig.height / 2;
        cupGroup.add(bottom);

        // Cup handle
        const handleCurve = new THREE.EllipseCurve(
            0, 0, 0.25, 0.35, 0, Math.PI, false, 0
        );
        const handlePoints = handleCurve.getPoints(20);
        const handleGeometry = new THREE.BufferGeometry().setFromPoints(
            handlePoints.map(p => new THREE.Vector3(p.x, p.y, 0))
        );
        const handleMaterial = new THREE.LineBasicMaterial({ color: cupConfig.color, linewidth: 3 });
        const handle = new THREE.Line(handleGeometry, handleMaterial);
        handle.position.set(cupConfig.radius, 0, 0);
        cupGroup.add(handle);

        // Coffee fill (starts at 0 scale)
        const coffeeGeometry = new THREE.CylinderGeometry(
            cupConfig.radius * 0.80, // was 0.85
            cupConfig.radius * 0.65, // was 0.70
            cupConfig.height * 0.88,
            32
        );
        const coffeeMaterial = new THREE.MeshStandardMaterial({
            color: config.coffee.color,
            opacity: config.coffee.opacity,
            transparent: true,
            roughness: 0.3,
            metalness: 0.4
        });
        const coffeeFill = new THREE.Mesh(coffeeGeometry, coffeeMaterial);
        coffeeFill.scale.y = 0;
        coffeeFill.position.y = -cupConfig.height / 2;
        cupGroup.add(coffeeFill);
        coffeeFills.push(coffeeFill);

        // Foam/crema on top (initially hidden)
        const foamGeometry = new THREE.CircleGeometry(cupConfig.radius * 0.88, 32);
        const foamMaterial = new THREE.MeshStandardMaterial({
            color: 0xD2B48C,
            roughness: 0.9,
            opacity: 0,
            transparent: true
        });
        const foam = new THREE.Mesh(foamGeometry, foamMaterial);
        foam.rotation.x = -Math.PI / 2;
        foam.position.y = cupConfig.height / 2 - 0.05;
        cupGroup.add(foam);
        cupGroup.userData.foam = foam;

        // Position cup
        cupGroup.position.set(cupConfig.x, cupConfig.y + cupConfig.height / 2, cupConfig.z);
        cupGroup.userData.originalX = cupConfig.x;
        cupGroup.userData.targetX = 0;
        cupGroup.userData.index = index;
        cupGroup.userData.cupConfig = cupConfig;
        
        scene.add(cupGroup);
        cups.push(cupGroup);
    });
}

// Create particle systems
function createParticles() {
    // Steam particles
    const steamGeometry = new THREE.BufferGeometry();
    const steamPositions = [];
    const steamVelocities = [];
    const steamLifetimes = [];

    for (let i = 0; i < config.particles.steam.count; i++) {
        steamPositions.push(
            (Math.random() - 0.5) * 0.5,
            0,
            (Math.random() - 0.5) * 0.5
        );
        steamVelocities.push(
            (Math.random() - 0.5) * 0.05,
            Math.random() * config.particles.steam.speed,
            (Math.random() - 0.5) * 0.05
        );
        steamLifetimes.push(Math.random() * config.particles.steam.lifetime);
    }

    steamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(steamPositions, 3));
    steamGeometry.userData.velocities = steamVelocities;
    steamGeometry.userData.lifetimes = steamLifetimes;

    const steamMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.15,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const steam = new THREE.Points(steamGeometry, steamMaterial);
    steam.position.set(0, -1.8, 1.5);
    steam.visible = false;
    scene.add(steam);
    steamParticles.push(steam);

    // Dust particles
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = [];
    const dustVelocities = [];

    for (let i = 0; i < config.particles.dust.count; i++) {
        dustPositions.push(
            (Math.random() - 0.5) * 20,
            Math.random() * 10 - 2,
            (Math.random() - 0.5) * 15
        );
        dustVelocities.push(
            (Math.random() - 0.5) * config.particles.dust.driftSpeed,
            Math.random() * config.particles.dust.driftSpeed * 0.5,
            (Math.random() - 0.5) * config.particles.dust.driftSpeed
        );
    }

    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.userData.velocities = dustVelocities;

    const dustMaterial = new THREE.PointsMaterial({
        color: 0xFFF8DC,
        size: 0.08,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
    });

    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);
    dustParticles.push(dust);
}

// Create coffee stream
function createCoffeeStream() {
    const streamGeometry = new THREE.CylinderGeometry(0.08, 0.1, 1, 16);
    const streamMaterial = new THREE.MeshStandardMaterial({
        color: config.coffee.color,
        opacity: 0,
        transparent: true,
        emissive: new THREE.Color(config.coffee.color),
        emissiveIntensity: 0.2
    });
    
    const stream = new THREE.Mesh(streamGeometry, streamMaterial);
    stream.scale.y = 0;
    stream.position.set(
        config.machine.spout.position[0],
        config.machine.spout.position[1] - config.machine.spout.height / 2,
        config.machine.spout.position[2]
    );

    scene.add(stream);
    coffeeStreams.push(stream);
    return stream;
}
// Create animation timeline
function createAnimationTimeline() {
    const numCups = cups.length;
    const cupSpacing = 2.5;
    const startX = -6;
    const fillX = 0;
    const endX = 10;

    // Initial positions
    cups.forEach((cup, i) => {
        cup.position.set(startX - i * cupSpacing, -2.7 + config.cups[0].height / 2, 2.25);
        cup.visible = false; // Start invisible
        cup.userData.isFadingIn = false;
    });

    let cupQueue = [...cups];

    function animateNextCup() {
        const cupToAnimate = cupQueue.shift(); // Get the first cup
        const originalIndex = cups.indexOf(cupToAnimate);

        // Move the rest of the queue forward
        gsap.to(cupQueue.map(c => c.position), {
            x: `+=${cupSpacing}`,
            duration: 2,
            ease: 'power2.inOut',
            onUpdate: function() {
                cupQueue.forEach(c => {
                    if (c.position.x > -9 && !c.userData.isFadingIn) {
                        c.userData.isFadingIn = true;
                        c.visible = true;
                        c.traverse(child => {
                            if (child.material) {
                                gsap.to(child.material, { opacity: 0.8, duration: 0.5, ease: 'power2.in' });
                            }
                        });
                    }
                });
            }
        });

        const cupTimeline = gsap.timeline({
            onComplete: () => {
                // Reset the cup and add it to the end of the queue
                cupToAnimate.position.x = startX - (numCups - 1) * cupSpacing;
                cupToAnimate.visible = false;
                cupToAnimate.userData.isFadingIn = false;
                cupToAnimate.traverse(child => {
                    if (child.material) {
                        child.material.opacity = 0;
                    }
                });
                if (coffeeFills[originalIndex]) {
                    coffeeFills[originalIndex].scale.y = 0;
                }
                cupQueue.push(cupToAnimate);
                animateNextCup(); // Animate the next cup
            }
        });

        // Animate the selected cup
        cupTimeline.to(cupToAnimate.position, {
            x: fillX,
            duration: 2,
            ease: 'power2.inOut',
            onStart: () => {
                if (!cupToAnimate.userData.isFadingIn) {
                    cupToAnimate.userData.isFadingIn = true;
                    cupToAnimate.visible = true;
                    cupToAnimate.traverse(child => {
                        if (child.material) {
                            gsap.to(child.material, { opacity: 0.8, duration: 0.5, ease: 'power2.in' });
                        }
                    });
                }
            }
        });

        // --- Filling Sequence ---
        const stream = createCoffeeStream();
        const coffeeFill = coffeeFills[originalIndex];
        
        cupTimeline.to({}, { duration: config.animation.pourStartDelay });

        const streamHeight = 2;
        const streamTimeline = gsap.timeline();
        streamTimeline.to(stream.scale, { y: streamHeight, duration: 0.4, ease: 'power2.out' });
        streamTimeline.to(stream.position, { y: config.machine.spout.position[1] - config.machine.spout.height / 2 - streamHeight / 2, duration: 0.4, ease: 'power2.out' }, '<');
        streamTimeline.to(stream.material, { opacity: 0.85, duration: 0.4, ease: 'power2.out' }, '<');

        streamTimeline.to(coffeeFill.scale, {
            y: 1,
            duration: config.coffee.fillDuration,
            ease: 'power2.inOut',
            onUpdate: function() {
                const fillHeight = config.cups[0].height * 0.88;
                coffeeFill.position.y = -config.cups[0].height / 2 + (fillHeight * coffeeFill.scale.y) / 2;
            }
        }, '<');

        streamTimeline.to(stream.material, { opacity: 0, duration: 0 }, `+=${config.coffee.fillDuration}`);
        streamTimeline.to(stream.scale, { y: 0, duration: 0 }, '<');
        streamTimeline.to(stream.position, { y: config.machine.spout.position[1] - config.machine.spout.height / 2, duration: 0 }, '<');
        
        cupTimeline.add(streamTimeline);

        // Move cup to end position
        cupTimeline.to(cupToAnimate.position, {
            x: endX,
            duration: 2,
            ease: 'power2.inOut'
        }, '+=0.5');

        // Fade out cup
        cupTimeline.to(cupToAnimate, {
            onStart: () => {
                cupToAnimate.traverse(child => {
                    if (child.material) {
                        gsap.to(child.material, { opacity: 0, duration: 0.5 });
                    }
                });
            }
        }, '-=0.5');
    }

    gsap.delayedCall(2, animateNextCup);
}

// Update particles
function updateDustParticles() {
    dustParticles.forEach(dust => {
        const positions = dust.geometry.attributes.position.array;
        const velocities = dust.geometry.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];

            if (positions[i + 1] > 8) positions[i + 1] = -2;
            if (positions[i] > 10) positions[i] = -10;
            if (positions[i] < -10) positions[i] = 10;
            if (positions[i + 2] > 8) positions[i + 2] = -8;
            if (positions[i + 2] < -8) positions[i + 2] = 8;
        }

        dust.geometry.attributes.position.needsUpdate = true;
    });
}

function createAestheticParticles() {
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 30,
            Math.random() * 15,
            (Math.random() - 0.5) * 20
        );
        velocities.push(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        );
    }

    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeometry.userData.velocities = velocities;

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xFFD700, // Gold color
        size: 0.1,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.5
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    aestheticParticles.push(particles);
}

function updateAestheticParticles() {
    aestheticParticles.forEach(p => {
        const positions = p.geometry.attributes.position.array;
        const velocities = p.geometry.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];

            if (positions[i + 1] < -2) positions[i + 1] = 15;
            if (positions[i] > 15) positions[i] = -15;
            if (positions[i] < -15) positions[i] = 15;
            if (positions[i + 2] > 10) positions[i + 2] = -10;
            if (positions[i + 2] < -10) positions[i + 2] = 10;
        }
        p.geometry.attributes.position.needsUpdate = true;
    });
}
function updateParticles(deltaTime) {
    // Update steam particles
    steamParticles.forEach(steam => {
        if (!steam.visible) return;

        const positions = steam.geometry.attributes.position.array;
        const velocities = steam.geometry.userData.velocities;
        const lifetimes = steam.geometry.userData.lifetimes;

        for (let i = 0; i < positions.length; i += 3) {
            lifetimes[i / 3] -= deltaTime;

            if (lifetimes[i / 3] <= 0) {
                positions[i] = (Math.random() - 0.5) * 0.5;
                positions[i + 1] = 0;
                positions[i + 2] = (Math.random() - 0.5) * 0.5;
                lifetimes[i / 3] = config.particles.steam.lifetime;
            } else {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];
            }
        }

        steam.geometry.attributes.position.needsUpdate = true;
    });

    // Update dust particles
    dustParticles.forEach(dust => {
        const positions = dust.geometry.attributes.position.array;
        const velocities = dust.geometry.userData.velocities;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];

            if (positions[i + 1] > 8) positions[i + 1] = -2;
            if (positions[i] > 10) positions[i] = -10;
            if (positions[i] < -10) positions[i] = 10;
            if (positions[i + 2] > 8) positions[i + 2] = -8;
            if (positions[i + 2] < -8) positions[i + 2] = 8;
        }

        dust.geometry.attributes.position.needsUpdate = true;
    });
}

// Animation loop
let lastTime = 0;
let frameCount = 0;
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    updateParticles(deltaTime);
    updateAestheticParticles();

    // Subtle light flicker
    pendantLights.forEach((pendant, index) => {
        const flicker = Math.sin(currentTime * 0.003 + index) * 0.1 + 1;
        pendant.light.intensity = config.lighting.pendants[index].intensity * flicker;
    });

    renderer.render(scene, camera);
    
    // Debug logging for first few frames
    if (frameCount < 5) {
        console.log('Frame', frameCount, 'rendered');
        frameCount++;
    }
}

// UI Toggle functionality
function toggleUI() {
    uiVisible = !uiVisible;
    const container = document.getElementById('canvas-container');
    const toggleBtn = document.getElementById('toggle-ui-btn');
    
    if (uiVisible) {
        container.classList.remove('ui-hidden');
        toggleBtn.textContent = '👁️';
        toggleBtn.title = 'Hide UI (Press U)';
    } else {
        container.classList.add('ui-hidden');
        toggleBtn.textContent = '👁';
        toggleBtn.title = 'Show UI (Press U)';
    }
}

// UI Controls
function setupControls() {
    const toggleUIBtn = document.getElementById('toggle-ui-btn');

    // Toggle UI button
    toggleUIBtn.addEventListener('click', toggleUI);

    // Keyboard shortcut for UI toggle (U key)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyU' || e.key === 'u' || e.key === 'U') {
            toggleUI();
        }
    });
}

function updateUI() {
    document.getElementById('current-cup').textContent = (currentCupIndex + 1);
    document.getElementById('cycle-count').textContent = cycleCount;
    document.getElementById('total-cups').textContent = totalCupsFilled;
}

// Handle window resize
function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 8;
    
    camera.left = frustumSize * aspect / -2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// Initialize everything
function init() {
    initScene();
    createEnvironment();
    createShelving();
    createMachine();
    createCups();
    createParticles();
    createAestheticParticles();
    createAnimationTimeline();
    setupControls();
    updateUI();
    animate(0);
}

// Start the application
init();