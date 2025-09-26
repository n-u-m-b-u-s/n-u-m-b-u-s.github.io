# Numbus

A minimal, interactive data visualization library inspired by Edward Tufte's principles. Built with Rust WASM backend and vanilla JavaScript frontend.

## Features

- **Clean Visualizations**: Bar charts, line charts, and scatter plots with minimal chartjunk
- **Interactive**: Hover effects and data exploration
- **Data Upload**: Import CSV files or use sample data
- **Export Ready**: Save as SVG or PNG formats
- **Fast Processing**: Rust WASM handles data processing and scaling
- **Responsive Design**: Charts scale with viewport size
- **GitHub Pages Ready**: Deploy anywhere with static hosting

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/)
- Basic web server (Python, Node.js, or any static server)

### Installation

```bash
# Clone the repository
git clone https://github.com/n-u-m-b-u-s/n-u-m-b-u-s.github.io.git
cd n-u-m-b-u-s.github.io

# Install wasm-pack if not already installed
cargo install wasm-pack
```

### Build

```bash
# Build the WASM module
wasm-pack build --target web --out-dir pkg
```

### Local Development

```bash
# Serve locally using Python
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000

# Open http://localhost:8000
```

### Deploy to GitHub Pages

1. Push your changes to the `main` branch
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch"
4. Select `main` branch and `/ (root)` folder
5. Your site will be available at `https://yourusername.github.io/n-u-m-b-u-s.github.io`

## Usage

1. **Load Sample Data**: Click "Load Sample Data" to see example charts
2. **Upload Data**: Use "Upload CSV" to import your own data
3. **Select Chart Type**: Choose between bar, line, or scatter plots
4. **Export**: Save charts as SVG (vector) or PNG (bitmap) files

### CSV Format

Your CSV should have two columns:
```csv
label,value
Jan,120
Feb,190
Mar,300
```

## Project Structure

```
numbus/
├── index.html              # Main entry point
├── main.js                 # Frontend logic & SVG rendering
├── pkg/                    # Generated WASM files (from wasm-pack)
│   ├── numbus.js
│   ├── numbus_bg.wasm
│   └── ...
├── src/                    # Rust source
│   └── lib.rs             # Data processing & template generation
├── Cargo.toml              # Rust dependencies
├── .gitignore
└── README.md
```

## Contributing

We welcome contributions! Please follow these steps:

### Development Setup

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/n-u-m-b-u-s.github.io.git
   cd n-u-m-b-u-s.github.io
   ```

3. **Install dependencies** (Rust + wasm-pack as above)

4. **Make your changes**

5. **Test locally**:
   ```bash
   # Rebuild WASM if you changed Rust code
   wasm-pack build --target web --out-dir pkg
   
   # Start local server
   python -m http.server 8000
   
   # Test in browser at http://localhost:8000
   ```

6. **Submit a Pull Request**

### Code Style

- **Rust**: Follow standard `rustfmt` formatting
- **JavaScript**: Use modern ES6+ syntax, prefer const/let over var
- **HTML/CSS**: Clean, semantic markup with minimal inline styles

### Adding New Chart Types

1. Add processing logic in `src/lib.rs`
2. Update the frontend rendering in `main.js`
3. Add appropriate tests and documentation

## Architecture

### Data Flow

1. **Data Input** → CSV upload or sample data
2. **Rust WASM** → Processes and scales data
3. **Template Generation** → WASM returns JSON with SVG elements
4. **JavaScript Rendering** → Creates interactive SVG
5. **Export** → Converts to SVG/PNG formats

### Performance

- Data processing happens in Rust WASM for speed
- SVG rendering provides crisp, scalable graphics
- Minimal JavaScript for maximum performance

## Troubleshooting

### Build Issues

- **"wasm-pack not found"**: Install with `cargo install wasm-pack`
- **WASM compilation errors**: Ensure you have the latest Rust stable
- **"binaryen download failed"**: Add `wasm-opt = false` to Cargo.toml

### Runtime Issues

- **WASM module fails to load**: Check browser console for CORS errors
- **Charts not rendering**: Ensure you're serving over HTTP (not file://)
- **Export not working**: Check browser permissions for downloads

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Line charts and scatter plots
- [ ] More export formats (PDF, WebP)
- [ ] Animation support
- [ ] Theme customization
- [ ] Multiple datasets
- [ ] Real-time data updates