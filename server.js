const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs/promises');
const MarkdownIt = require('markdown-it');
const yaml = require('js-yaml');
const { promises: fsPromises } = require('fs');
const archiver = require('archiver');
const multer = require('multer');
const decompress = require('decompress');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3001;
const md = new MarkdownIt();

// Thư mục chứa file markdown
const CONTENT_DIR = path.join(__dirname, 'content');
const TEMP_DIR = path.join(__dirname, 'temp');

// Cấu hình multer để xử lý upload file
const upload = multer({ dest: TEMP_DIR });

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Đảm bảo thư mục content và temp tồn tại
async function ensureDirectories() {
  try {
    await fs.access(CONTENT_DIR);
  } catch (error) {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    // Tạo một file markdown mẫu
    await fs.writeFile(
      path.join(CONTENT_DIR, 'welcome.md'),
      '# Chào mừng\n\n## Giới thiệu\n\nĐây là ứng dụng xem và quản lý file Markdown.\n\n## Cách sử dụng\n\nBạn có thể tạo, chỉnh sửa và xóa các file Markdown từ giao diện.\n\n### Chức năng\n\n- Quản lý file\n- Xem trước Markdown\n- Tìm kiếm nội dung'
    );
  }
  
  try {
    await fs.access(TEMP_DIR);
  } catch (error) {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}

// API routes
// Lấy danh sách tất cả các file
app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    const markdownFiles = files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
    res.json(markdownFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy nội dung của file cụ thể
app.get('/api/files/:name', async (req, res) => {
  try {
    const fileName = `${req.params.name}.md`;
    const filePath = path.join(CONTENT_DIR, fileName);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({
      name: req.params.name,
      content,
      html: md.render(content)
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File không tồn tại' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Tạo file mới
app.post('/api/files', async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Tên file và nội dung không được để trống' });
    }
    
    const fileName = `${name}.md`;
    const filePath = path.join(CONTENT_DIR, fileName);
    
    // Kiểm tra file đã tồn tại chưa
    try {
      await fs.access(filePath);
      return res.status(400).json({ error: 'File đã tồn tại' });
    } catch {}
    
    await fs.writeFile(filePath, content);
    res.status(201).json({ name, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật file
app.put('/api/files/:name', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Nội dung không được để trống' });
    }
    
    const fileName = `${req.params.name}.md`;
    const filePath = path.join(CONTENT_DIR, fileName);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File không tồn tại' });
    }
    
    await fs.writeFile(filePath, content);
    res.json({ name: req.params.name, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Đổi tên file
app.put('/api/files/:name/rename', async (req, res) => {
  try {
    const { newName } = req.body;
    if (!newName) {
      return res.status(400).json({ error: 'Tên file mới không được để trống' });
    }
    
    const oldFileName = `${req.params.name}.md`;
    const newFileName = `${newName}.md`;
    const oldFilePath = path.join(CONTENT_DIR, oldFileName);
    const newFilePath = path.join(CONTENT_DIR, newFileName);
    
    // Kiểm tra file cũ tồn tại
    try {
      await fs.access(oldFilePath);
    } catch {
      return res.status(404).json({ error: 'File không tồn tại' });
    }
    
    // Kiểm tra tên file mới đã tồn tại chưa
    try {
      await fs.access(newFilePath);
      return res.status(400).json({ error: 'File mới đã tồn tại' });
    } catch {}
    
    await fs.rename(oldFilePath, newFilePath);
    res.json({ oldName: req.params.name, newName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Xóa file
app.delete('/api/files/:name', async (req, res) => {
  try {
    const fileName = `${req.params.name}.md`;
    const filePath = path.join(CONTENT_DIR, fileName);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File không tồn tại' });
    }
    
    await fs.unlink(filePath);
    res.json({ message: 'Xóa file thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nhập dữ liệu từ MkDocs
app.post('/api/import/mkdocs', upload.single('mkdocsFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file được tải lên' });
    }
    
    // Xử lý file zip
    const zipPath = req.file.path;
    const extractPath = path.join(TEMP_DIR, 'extract');
    
    // Tạo thư mục giải nén nếu chưa tồn tại
    try {
      await fs.access(extractPath);
      await fs.rm(extractPath, { recursive: true, force: true });
    } catch {}
    
    await fs.mkdir(extractPath, { recursive: true });
    
    // Giải nén file
    await decompress(zipPath, extractPath);
    
    // Tìm file mkdocs.yml
    let mkdocsYmlPath;
    try {
      const files = await fs.readdir(extractPath);
      for (const file of files) {
        const fileStat = await fs.stat(path.join(extractPath, file));
        if (fileStat.isDirectory()) {
          try {
            await fs.access(path.join(extractPath, file, 'mkdocs.yml'));
            mkdocsYmlPath = path.join(extractPath, file, 'mkdocs.yml');
            break;
          } catch {}
        } else if (file === 'mkdocs.yml') {
          mkdocsYmlPath = path.join(extractPath, file);
          break;
        }
      }
    } catch (error) {
      return res.status(500).json({ error: 'Lỗi khi tìm file mkdocs.yml: ' + error.message });
    }
    
    if (!mkdocsYmlPath) {
      return res.status(400).json({ error: 'Không tìm thấy file mkdocs.yml trong zip' });
    }
    
    // Đọc cấu hình mkdocs.yml
    const mkdocsYml = await fs.readFile(mkdocsYmlPath, 'utf-8');
    const mkdocsConfig = yaml.load(mkdocsYml);
    
    if (!mkdocsConfig.nav) {
      return res.status(400).json({ error: 'File mkdocs.yml không có phần nav' });
    }
    
    // Tìm thư mục docs
    const mkdocsDir = path.dirname(mkdocsYmlPath);
    const docsDir = path.join(mkdocsDir, 'docs');
    
    try {
      await fs.access(docsDir);
    } catch {
      return res.status(400).json({ error: 'Không tìm thấy thư mục docs' });
    }
    
    // Xử lý nav để lấy danh sách file
    const files = [];
    for (const navItem of mkdocsConfig.nav) {
      // Trích xuất tên và đường dẫn file từ mỗi mục nav
      const key = Object.keys(navItem)[0];
      const value = navItem[key];
      
      if (typeof value === 'string') {
        files.push({
          title: key.replace(/^\d+\.\s*/, ''), // Loại bỏ số thứ tự nếu có
          path: value
        });
      }
    }
    
    // Sao chép các file sang thư mục content
    for (const file of files) {
      try {
        const sourcePath = path.join(docsDir, file.path);
        const fileName = file.path.replace(/\.[^/.]+$/, ""); // Loại bỏ phần mở rộng
        const destPath = path.join(CONTENT_DIR, `${fileName}.md`);
        
        const content = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(destPath, content);
      } catch (error) {
        console.error(`Lỗi khi sao chép file ${file.path}: ${error.message}`);
      }
    }
    
    // Xóa thư mục tạm và file tải lên
    await fs.rm(zipPath, { force: true });
    await fs.rm(extractPath, { recursive: true, force: true });
    
    res.json({ 
      message: 'Nhập dữ liệu thành công', 
      files: files.map(f => ({ title: f.title, name: f.path.replace(/\.[^/.]+$/, "") }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Xuất dữ liệu ra MkDocs
app.get('/api/export/mkdocs', async (req, res) => {
  try {
    // Tạo cấu trúc thư mục cho MkDocs
    const exportDir = path.join(TEMP_DIR, 'export');
    const exportDocsDir = path.join(exportDir, 'docs');
    
    // Xóa và tạo lại thư mục nếu đã tồn tại
    try {
      await fs.access(exportDir);
      await fs.rm(exportDir, { recursive: true, force: true });
    } catch {}
    
    await fs.mkdir(exportDir, { recursive: true });
    await fs.mkdir(exportDocsDir, { recursive: true });
    
    // Lấy danh sách file và sao chép vào thư mục docs
    const files = await fs.readdir(CONTENT_DIR);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    // Tạo nav cho mkdocs.yml
    const nav = [];
    
    for (let i = 0; i < markdownFiles.length; i++) {
      const file = markdownFiles[i];
      const fileName = file.replace('.md', '');
      const displayName = fileName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Sao chép file
      const sourcePath = path.join(CONTENT_DIR, file);
      const destPath = path.join(exportDocsDir, file);
      await fs.copyFile(sourcePath, destPath);
      
      // Thêm vào nav
      nav.push({ [`${i + 1}. ${displayName}`]: file });
    }
    
    // Tạo file mkdocs.yml
    const mkdocsConfig = {
      site_name: 'Migration Guideline',
      theme: 'readthedocs',
      nav: nav,
      use_directory_urls: false,
      plugins: ['search']
    };
    
    const mkdocsYml = yaml.dump(mkdocsConfig);
    await fs.writeFile(path.join(exportDir, 'mkdocs.yml'), mkdocsYml);
    
    // Tạo file README.md
    const readme = `# Migration Guideline\n\nĐây là dự án tài liệu được tạo bởi Migration Guideline App.\n\n## Cài đặt\n\n1. Cài đặt MkDocs: \`pip install mkdocs\`\n2. Di chuyển vào thư mục dự án\n3. Chạy lệnh \`mkdocs serve\` để xem trước\n4. Chạy lệnh \`mkdocs build\` để build trang web tĩnh`;
    await fs.writeFile(path.join(exportDir, 'README.md'), readme);
    
    // Tạo file zip để tải xuống
    const zipPath = path.join(TEMP_DIR, 'mkdocs-export.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    archive.directory(exportDir, false);
    await archive.finalize();
    
    // Gửi file zip cho client
    res.download(zipPath, 'mkdocs-export.zip', async (err) => {
      if (err) {
        console.error('Lỗi khi tải xuống file:', err);
      }
      
      // Xóa thư mục và file tạm sau khi tải xuống
      try {
        await fs.rm(exportDir, { recursive: true, force: true });
        await fs.rm(zipPath, { force: true });
      } catch (error) {
        console.error('Lỗi khi xóa file tạm:', error);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo bản sao lưu
app.get('/api/backup', async (req, res) => {
  try {
    // Tạo file zip để tải xuống
    const zipPath = path.join(TEMP_DIR, 'backup.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    archive.directory(CONTENT_DIR, false);
    await archive.finalize();
    
    // Gửi file zip cho client
    res.download(zipPath, `markdown-backup-${new Date().toISOString().slice(0, 10)}.zip`, async (err) => {
      if (err) {
        console.error('Lỗi khi tải xuống file:', err);
      }
      
      // Xóa file tạm sau khi tải xuống
      try {
        await fs.rm(zipPath, { force: true });
      } catch (error) {
        console.error('Lỗi khi xóa file tạm:', error);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phục vụ ứng dụng Vue từ thư mục client/dist trong production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

// Khởi động server
async function startServer() {
  await ensureDirectories();
  app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  });
}

startServer().catch(console.error); 