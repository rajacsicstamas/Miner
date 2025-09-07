# 🎮 Boulder Dash Game

A modern, web-based implementation of the classic Boulder Dash puzzle game, featuring smooth animations, physics simulation, and a complete asset generation toolkit.

## 🤖 AI-Generated Project

**This entire project was created using AI assistance (GitHub Copilot Chat).** Every line of code, documentation, and asset was generated through AI collaboration, demonstrating the power of AI-assisted software development in 2025.

## 🎯 What is Boulder Dash?

Boulder Dash is a classic puzzle game where you control a player character navigating through underground caves, collecting diamonds while avoiding falling boulders. The goal is to collect enough diamonds to open the exit and escape to the next level.

## ✨ Features

### 🎮 Core Gameplay
- **Turn-based mechanics** with 200ms per turn
- **Smooth interpolation animations** between turns for fluid gameplay
- **Physics simulation** - boulders and diamonds fall when unsupported
- **Rolling physics** - objects roll off each other diagonally
- **Deadly falling objects** - player dies if hit by falling boulders/diamonds
- **6 challenging levels** with increasing difficulty and boulder counts

### 🎨 Visual & Audio
- **Camera system** that smoothly follows the player
- **High-resolution sprites** (128x128) for crisp visuals
- **Asset generation tools** for creating custom boulders and diamonds
- **Sound effects generator** for game audio (footsteps, impacts, chimes)
- **DPI-aware rendering** for sharp graphics on all displays

### 🛠️ Technical Features
- **Entity-based animation system** - each game object handles its own interpolation
- **Modular architecture** with separate systems for physics, movement, and rendering
- **TypeScript implementation** for type safety and better development experience
- **Vite build system** for fast development and optimized builds
- **React components** for UI and game rendering

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/rajacsicstamas/Miner.git
cd Miner/Source/Client/main

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production
```bash
npm run build
```

## 🎮 How to Play

- **Arrow Keys**: Move the player character
- **Objective**: Collect all required diamonds to open the exit
- **Avoid**: Falling boulders and diamonds (they're deadly!)
- **Strategy**: Push boulders to create safe paths and access diamonds
- **Physics**: Objects fall when unsupported and can roll off each other

## 🏗️ Project Structure

```
src/
├── engine/           # Core game engine and logic
├── game/
│   ├── components/   # React components for rendering
│   ├── core/         # Game systems (physics, input, etc.)
│   ├── entities/     # Game objects (player, boulder, etc.)
│   └── utils/        # Utility functions and generators
└── assets/           # Game sprites and resources
```

## 🛠️ Asset Generation

The project includes powerful tools for generating game assets:

- **`boulder-generator.html`** - Complete asset generation toolkit
  - Generate realistic rocky boulder sprites
  - Create sparkling diamond graphics
  - Produce game sound effects (footsteps, impacts, chimes)
  - Download assets in multiple formats

## 🔧 Key Technologies

- **TypeScript** - Type-safe JavaScript for robust development
- **React** - Component-based UI framework
- **Vite** - Fast build tool and development server
- **Canvas API** - Hardware-accelerated 2D rendering
- **Web Audio API** - Procedural sound generation
- **CSS3** - Modern styling and animations

## 🎯 Game Design Philosophy

This Boulder Dash implementation focuses on:

1. **Smooth Gameplay** - 200ms turns with seamless interpolation
2. **Authentic Physics** - Faithful recreation of original Boulder Dash mechanics
3. **Modern Technology** - Leveraging current web standards for optimal performance
4. **Extensibility** - Modular architecture for easy expansion and modification
5. **Asset Creation** - Comprehensive tools for creating custom game content

## 🏆 Levels

The game features 6 carefully designed levels:

1. **Tutorial** - Learn the basics (10 diamonds)
2. **Boulder Maze** - Navigate through falling rocks (15 diamonds)
3. **Diamond Mine** - Strategic collection puzzle (20 diamonds)
4. **Rock Avalanche** - High-intensity boulder dodging (25 diamonds)
5. **Crystal Cavern** - Complex physics puzzles (30 diamonds)
6. **Final Challenge** - Ultimate test of skill (35 diamonds)

## 🤝 Contributing

While this project was entirely AI-generated, contributions are welcome! Please feel free to:

- Report bugs or suggest improvements
- Add new levels or features
- Enhance the asset generation tools
- Improve documentation

## 📄 License

This project is open source. Please check the repository for specific licensing terms.

## 🙏 Acknowledgments

- **GitHub Copilot** - For generating 100% of the code and documentation
- **Original Boulder Dash** - For inspiring this modern recreation
- **Web Standards** - For providing the foundation for smooth, cross-platform gameplay

---

*This project demonstrates the incredible potential of AI-assisted development, where complex games can be created entirely through AI collaboration.*