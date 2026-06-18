const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://naseesdaycare.vercel.app';
const SITE_DIR = __dirname;

// Helper to format date as YYYY-MM-DD
function getFormattedDate(date) {
    return date.toISOString().split('T')[0];
}

function generateSitemap() {
    console.log('Generating sitemap...');
    
    // Read all files in the directory
    const files = fs.readdirSync(SITE_DIR);
    
    // Filter for HTML files in the root directory
    const htmlFiles = files.filter(file => {
        return file.endsWith('.html') && fs.statSync(path.join(SITE_DIR, file)).isFile();
    });
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(SITE_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Try to get the last commit date from Git for accuracy, fallback to filesystem mtime
        let lastMod;
        try {
            const gitDate = execSync(`git log -1 --format="%as" -- "${file}"`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
            lastMod = gitDate || getFormattedDate(stats.mtime);
        } catch (e) {
            lastMod = getFormattedDate(stats.mtime);
        }
        
        let urlPath = file;
        let priority = '0.80';
        let changefreq = 'weekly';
        
        // Tailor priority and changefreq based on the page
        if (file === 'index.html') {
            urlPath = ''; // Root URL
            priority = '1.00';
            changefreq = 'daily';
        } else if (file === 'admissions.html' || file === 'programs.html' || file === 'contact.html') {
            priority = '0.90';
            changefreq = 'monthly';
        } else if (file === 'blog.html') {
            priority = '0.80';
            changefreq = 'weekly';
        } else {
            priority = '0.70';
            changefreq = 'monthly';
        }
        
        const loc = urlPath ? `${BASE_URL}/${urlPath}` : `${BASE_URL}/`;
        
        xml += `  <url>\n`;
        xml += `    <loc>${loc}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += `  </url>\n`;
    });
    
    xml += `</urlset>\n`;
    
    const outputPath = path.join(SITE_DIR, 'sitemap.xml');
    fs.writeFileSync(outputPath, xml, 'utf8');
    console.log(`Sitemap successfully generated at: ${outputPath}`);
}

generateSitemap();
