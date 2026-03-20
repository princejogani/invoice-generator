const fs = require('fs');
const path = require('path');

const saveBase64Image = (base64String, folder, fileName) => {
    if (!base64String || !base64String.startsWith('data:image/')) {
        return base64String; // Return as is if already a URL or empty
    }

    try {
        const matches = base64String.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 string');
        }

        const extension = matches[1];
        const imageData = Buffer.from(matches[2], 'base64');
        const finalFileName = `${fileName}_${Date.now()}.${extension}`;
        const relativePath = path.join('uploads', folder, finalFileName);
        const fullPath = path.join(__dirname, '..', relativePath);

        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, imageData);

        // Return the final URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        return `${baseUrl}/${relativePath.replace(/\\/g, '/')}`;
    } catch (err) {
        console.error('Error saving base64 image:', err);
        return base64String;
    }
};

module.exports = { saveBase64Image };
