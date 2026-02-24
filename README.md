# Duracell Website

A professional, modern website inspired by Duracell's official design with advanced animations and glassmorphism effects.

## Features

- 🎨 **Modern Design**: Professional battery company style with blue-orange color scheme
- ✨ **Advanced Animations**: GSAP-powered smooth animations and interactions
- 🌟 **Glassmorphism**: Modern glass effect cards with backdrop-filter
- 📱 **Responsive Design**: Mobile-friendly layout
- 🌓 **Dark Mode**: Theme switching between light and dark modes
- ⚡ **Performance Optimized**: Smooth 60fps animations

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern CSS with custom properties and animations
- **JavaScript**: Vanilla JS with GSAP library
- **GSAP**: Professional animation library
- **Vercel**: Deployment platform

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Vercel account

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

### Deployment to Vercel

#### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy your project**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Set the project name (e.g., "duracell-website")
   - Choose the framework preset: "Other"
   - Set the output directory: "."
   - Set the build command: "echo 'No build command needed'"
   - Set the install command: "echo 'No dependencies to install'"

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

#### Method 2: Vercel Dashboard

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your Git repository** or drag-and-drop your project folder
4. **Configure the project**:
   - Framework Preset: "Other"
   - Build Command: `echo "No build command needed"`
   - Output Directory: `.`
   - Install Command: `echo "No dependencies to install"`
5. **Click "Deploy"**

#### Method 3: GitHub Integration

1. **Push your code to GitHub**
2. **Connect GitHub to Vercel**:
   - Go to Vercel Dashboard
   - Click "Import Project"
   - Select your GitHub repository
3. **Configure settings** as above
4. **Deploy automatically** on every push

## Project Structure

```
├── index.html          # Main HTML file
├── style.css           # Main stylesheet
├── script.js           # JavaScript animations
├── vercel.json         # Vercel configuration
├── package.json        # Project metadata
└── README.md           # This file
```

## Configuration

### Vercel Configuration (vercel.json)

The `vercel.json` file is configured for:
- Static site serving
- Custom headers for security
- Route handling for single-page application
- No build process required

### Environment Variables

No environment variables are required for this static site.

## Customization

### Colors and Theme
- Modify CSS custom properties in `style.css`
- Update color schemes in the `:root` section
- Adjust theme colors for dark mode

### Content
- Update text content in `index.html`
- Modify product information and descriptions
- Change statistics and feature lists

### Animations
- Customize animation timing in `script.js`
- Adjust GSAP animations and ScrollTrigger settings
- Modify hover effects and transitions

## Performance Optimization

- **Lazy Loading**: Images and animations load on demand
- **Code Splitting**: Efficient loading of JavaScript
- **Caching**: Proper caching headers configured
- **Minification**: CSS and JavaScript are minified in production

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security

- Content Security Policy headers
- XSS protection
- Clickjacking protection
- Secure referrer policies

## Troubleshooting

### Common Issues

1. **Deployment Fails**:
   - Check file permissions
   - Ensure all files are in the root directory
   - Verify vercel.json configuration

2. **Animations Not Working**:
   - Check GSAP library loading
   - Verify JavaScript file paths
   - Ensure no console errors

3. **Styling Issues**:
   - Check CSS file paths
   - Verify custom properties
   - Ensure proper CSS loading

### Debugging

- Use browser DevTools for debugging
- Check Vercel deployment logs
- Monitor console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Deploy to Vercel
6. Create a pull request

## License

MIT License - feel free to use this template for your projects!

## Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Ensure all files are properly configured

---

**Deployed with ❤️ using Vercel**