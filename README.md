# Pokémon Battle IoT Game

A motion-controlled Pokémon Red-style battle game using Arduino gestures. 

Live Demo: https://haikalrzz.github.io/pokemon-battle/

## About

This is a web-based Pokémon battle game where players use an Arduino Nano 33 BLE as a "casting wand" to perform attacks. Instead of pressing buttons, you perform physical gestures (O, Z, N , L patterns) to trigger attacks in battle.

## How It Works

1. Select your Pokémon - Choose from 8 Pokémon (4 available during day, 4 at night)
   - Day Pokémon (7AM - 5PM): Pikachu, Charizard, Jolteon, Dragonite
   - Night Pokémon (5PM - 7AM): Gengar, Mewtwo, Hypno, Alakazam

2. Face an opponent - Random enemy appears (changes based on time of day)
   - Gastly, Haunter, Gengar, Arcanine, Gyarados

3. Perform gestures with Arduino to attack:
   - Z Gesture - Attack 1 (Highest damage)
   - O Gesture - Attack 2 (Medium-high damage)
   - X Gesture - Attack 3 (Medium damage)
   - V Gesture - Attack 4 (Quick attack)

4. Battle until one Pokémon faints!

## Hardware Requirements

- Arduino Nano 33 BLE (with built-in IMU sensor)
- USB cable
- Smartphone with Bluetooth (or desktop browser)

## Setup Instructions

### Step 1: Upload Arduino Code
1. Download the Arduino sketch from `/arduino` folder
2. Open in Arduino IDE
3. Install required libraries:
   - Arduino_LSM9DS1 (for IMU sensor)
   - ArduinoBLE (for Bluetooth)
4. Connect Arduino Nano 33 BLE via USB
5. Select board: Tools → Board → Arduino Nano 33 BLE
6. Upload the code

### Step 2: Open Game
1. On your phone or computer, open: https://haikalrzz.github.io/pokemon-battle/
2. Allow Bluetooth permissions when prompted

### Step 3: Connect Arduino
1. Click "Connect Arduino" button in game
2. Select your Arduino device from the Bluetooth menu
3. Wait for connection confirmation

### Step 4: Start Playing!
1. Click "YES" on the main menu
2. Learn the 4 gesture patterns
3. Choose your Pokémon
4. Battle and win!

## Features

### Game Features
- Time-based Pokémon selection - Different Pokémon available during day vs night
- Type effectiveness system - Fire beats Grass, Water beats Fire, etc.
- Real-time HP tracking - HP bar changes color (green → yellow → red)
- Classic Game Boy aesthetic - Authentic Pokémon Red battle screen
- Fully responsive - Works perfectly on phone and desktop
- Gesture-based combat - Physical motion controls via Arduino

### Technical Features
- Web Bluetooth API integration
- IMU gesture recognition (accelerometer + gyroscope)
- JavaScript game engine with type effectiveness calculations
- localStorage for battle history tracking
- Responsive CSS with mobile-first design



## Gesture Guide

| Gesture | Pattern | Attack Slot |
|---------|---------|-------------|
| Z | Draw a "Z" shape | Attack 1 |
| O | Draw a circle | Attack 2 |
| X | Draw an "X" shape | Attack 3 |
| V | Draw a "V" shape | Attack 4 |

## Troubleshooting

### Arduino not connecting?
- Make sure Bluetooth is enabled on your device
- Check Arduino is powered on and running the sketch
- Try refreshing the webpage and reconnecting

### Gestures not working?
- Ensure Arduino is connected (check connection status)
- Perform gestures slowly and clearly
- Hold the Arduino steady before starting gesture
- Check serial monitor for gesture detection logs

### Game not loading?
- Use a modern browser (Chrome, Edge, or Safari)
- Enable JavaScript in browser settings
- Clear browser cache and reload

## Technologies Used

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Hardware: Arduino Nano 33 BLE
- Sensors: LSM9DS1 IMU (Accelerometer + Gyroscope)
- Communication: Web Bluetooth API
- Libraries: Arduino_LSM9DS1, ArduinoBLE
- Hosting: GitHub Pages

## Game Mechanics

### Type Effectiveness Chart
- Fire → Strong against Grass, Bug, Ice, Steel
- Water → Strong against Fire, Ground, Rock
- Electric → Strong against Water, Flying
- Grass → Strong against Water, Ground, Rock
- Psychic → Strong against Fighting, Poison
- Ghost → Strong against Ghost, Psychic
- Dark → Strong against Psychic, Ghost

### Damage Calculation
```
Base Damage = Attack Power
Type Modifier = 2x (super effective) or 0.5x (not very effective)
Random Variance = 85% - 100%
Final Damage = Base × Type Modifier × Variance
```



