<template>
  <div class="app-container">
    <Sidebar 
      :files="files" 
      :current-file="currentFile"
      :headings="headings"
      @select-file="loadFile"
      @create-file="showCreateFileModal = true"
      @delete-file="confirmDeleteFile"
      @scroll-to-heading="scrollToHeading"
      @manage-content="showContentManager = true"
    />

    <main class="content-area">
      <div v-if="currentFile" class="content-wrapper">
        <MarkdownEditor
          :file-name="currentFile"
          :content="markdownContent"
          :html="markdownHtml"
          @save="saveFile"
          @update-headings="updateHeadings"
        />
      </div>
      <div v-else class="welcome-message">
        <h2>Chào mừng đến với Markdown Viewer</h2>
        <p>Chọn một file từ danh sách bên trái hoặc tạo một file mới để bắt đầu.</p>
      </div>
    </main>

    <CreateFileModal 
      :show="showCreateFileModal" 
      @close="showCreateFileModal = false"
      @create="createNewFile"
    />

    <DeleteConfirmModal
      :show="showDeleteModal"
      :file-name="fileToDelete"
      @close="showDeleteModal = false"
      @confirm="deleteFile"
    />
    
    <ContentManager
      :show="showContentManager"
      :files="files"
      @close="showContentManager = false"
      @files-reordered="handleFilesReordered"
      @refresh-files="fetchFiles"
      @files-updated="handleFilesUpdated"
    />
  </div>
</template>

<script>
import { marked } from 'marked';
import Sidebar from './components/Sidebar.vue';
import MarkdownEditor from './components/MarkdownEditor.vue';
import CreateFileModal from './components/CreateFileModal.vue';
import DeleteConfirmModal from './components/DeleteConfirmModal.vue';
import ContentManager from './components/ContentManager.vue';
import axios from 'axios';

// Tạo renderer tùy chỉnh cho App.vue để đảm bảo thống nhất với MarkdownEditor
const renderer = new marked.Renderer();
renderer.heading = function(text, level) {
  const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
  const id = `heading-${escapedText}`;
  return `<h${level} id="${id}">${text}</h${level}>`;
};

// Cấu hình marked để sử dụng renderer tùy chỉnh
marked.setOptions({
  renderer: renderer,
  headerIds: true,
  gfm: true
});

export default {
  name: 'App',
  components: {
    Sidebar,
    MarkdownEditor,
    CreateFileModal,
    DeleteConfirmModal,
    ContentManager
  },
  data() {
    return {
      files: [],
      currentFile: null,
      markdownContent: '',
      markdownHtml: '',
      headings: [],
      showCreateFileModal: false,
      showDeleteModal: false,
      showContentManager: false,
      fileToDelete: ''
    };
  },
  created() {
    this.fetchFiles();
  },
  methods: {
    async fetchFiles() {
      try {
        console.log('App.vue - Đang gọi API lấy danh sách file');
        const response = await axios.get('/api/files');
        this.files = response.data;
        console.log('App.vue - Danh sách file đã nhận:', this.files);
      } catch (error) {
        console.error('Lỗi khi tải danh sách file:', error);
      }
    },
    
    async loadFile(fileName) {
      try {
        console.log('App.vue - Đang tải file:', fileName);
        const response = await axios.get(`/api/files/${fileName}`);
        this.currentFile = fileName;
        this.markdownContent = response.data.content;
        this.markdownHtml = marked(response.data.content);
        console.log('App.vue - Nội dung file đã tải:', this.markdownContent);
        
        // Đảm bảo extract headings sau khi cập nhật nội dung
        this.$nextTick(() => {
          this.extractHeadings();
          console.log('App.vue - Sau khi tải file, headings:', this.headings);
        });
      } catch (error) {
        console.error('Lỗi khi tải file:', error);
      }
    },
    
    extractHeadings() {
      const headings = [];
      const lines = this.markdownContent.split('\n');
      
      console.log('App.vue - Đang trích xuất headings từ nội dung, tổng số dòng:', lines.length);
      console.log('App.vue - Nội dung markdown:', this.markdownContent);
      
      // Debug: In ra dòng đầu tiên để kiểm tra
      if (lines.length > 0) {
        console.log('App.vue - Dòng đầu tiên:', JSON.stringify(lines[0]));
      }
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim(); // Cắt bỏ khoảng trắng thừa
        
        // In ra dòng hiện tại để debug
        console.log(`App.vue - Dòng ${i+1}:`, JSON.stringify(line));
        
        // Kiểm tra heading với regex
        if (line.startsWith('#')) {
          console.log(`App.vue - Dòng ${i+1} có thể là heading:`, line);
          
          // Tìm tất cả các dòng bắt đầu bằng # và theo sau là khoảng trắng
          const match = line.match(/^(#+)\s+(.+)$/);
          if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
            const id = `heading-${escapedText}`;
            console.log(`App.vue - Tìm thấy heading tại dòng ${i+1}: level=${level}, text="${text}", id="${id}"`);
            headings.push({ level, text, id });
          } else {
            console.log(`App.vue - Dòng ${i+1} bắt đầu bằng # nhưng không match pattern heading:`, line);
          }
        }
      }
      
      console.log('App.vue - Tổng số headings đã trích xuất:', headings.length);
      if (headings.length > 0) {
        console.log('App.vue - Danh sách headings:', headings);
      } else {
        console.log('App.vue - Không tìm thấy heading nào trong nội dung');
      }
      
      // Gán headings vào state và log để debug
      console.log('App.vue - Gán headings vào state:', headings);
      this.headings = headings;
    },
    
    updateHeadings(headings) {
      console.log('Nhận headings từ MarkdownEditor:', headings);
      this.headings = headings;
    },
    
    scrollToHeading(id) {
      console.log('Đang tìm heading với ID:', id);
      const element = document.getElementById(id);
      
      if (element) {
        console.log('Đã tìm thấy element:', element);
        // Cuộn đến phần tử
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Thêm hiệu ứng highlight cho heading khi click vào
        const originalBackground = element.style.backgroundColor;
        const originalTransition = element.style.transition;
        
        // Highlight heading
        element.style.transition = 'background-color 0.5s ease';
        element.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
        element.style.borderRadius = '3px';
        element.style.cursor = 'pointer';
        
        // Thêm padding để dễ nhìn
        element.style.padding = '3px 5px';
        
        // Reset sau 2 giây
        setTimeout(() => {
          element.style.backgroundColor = originalBackground;
          setTimeout(() => {
            element.style.transition = originalTransition;
          }, 500);
        }, 2000);
      } else {
        console.log('Không tìm thấy element với id:', id);
        console.log('Danh sách tất cả các ID hiện có:');
        
        // Log ra danh sách tất cả các headings có trong DOM
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        allHeadings.forEach((h, index) => {
          console.log(`Heading ${index + 1}:`, h.id, h.textContent);
        });
        
        // Thử tìm theo tiêu đề thay vì ID
        const text = id.replace('heading-', '');
        const headingByText = Array.from(allHeadings).find(h => 
          h.textContent.trim().toLowerCase().replace(/[^\w]+/g, '-') === text
        );
        
        if (headingByText) {
          console.log('Tìm thấy heading theo text:', headingByText);
          headingByText.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    
    async saveFile(content) {
      if (!this.currentFile) return;
      
      try {
        await axios.put(`/api/files/${this.currentFile}`, { content });
        this.markdownContent = content;
        this.markdownHtml = marked(content);
        this.extractHeadings();
      } catch (error) {
        console.error('Lỗi khi lưu file:', error);
      }
    },
    
    async createNewFile(fileData) {
      try {
        await axios.post('/api/files', {
          name: fileData.name,
          content: fileData.content
        });
        
        this.showCreateFileModal = false;
        
        // Tải lại danh sách file và mở file mới
        await this.fetchFiles();
        this.loadFile(fileData.name);
      } catch (error) {
        console.error('Lỗi khi tạo file:', error);
        if (error.response && error.response.data.error) {
          alert(error.response.data.error);
        }
      }
    },
    
    confirmDeleteFile(fileName) {
      this.fileToDelete = fileName;
      this.showDeleteModal = true;
    },
    
    async deleteFile() {
      try {
        await axios.delete(`/api/files/${this.fileToDelete}`);
        this.showDeleteModal = false;
        
        // Nếu file đang xóa là file hiện tại, reset state
        if (this.currentFile === this.fileToDelete) {
          this.currentFile = null;
          this.markdownContent = '';
          this.markdownHtml = '';
          this.headings = [];
        }
        
        await this.fetchFiles();
      } catch (error) {
        console.error('Lỗi khi xóa file:', error);
      }
    },
    
    handleFilesReordered(newFiles) {
      console.log('App - Thứ tự file đã thay đổi:', newFiles);
      // Cập nhật mảng files với thứ tự mới
      this.fetchFiles();
    },
    
    handleFilesUpdated(files) {
      console.log('App - Danh sách file được cập nhật từ ContentManager:', files);
      if (Array.isArray(files)) {
        this.files = files;
      }
    }
  }
};
</script>

<style>
:root {
  --primary-color: #3498db;
  --secondary-color: #2980b9;
  --background-color: #f4f4f4;
  --sidebar-bg: #2c3e50;
  --sidebar-text: #ecf0f1;
  --content-bg: #ffffff;
  --border-color: #ddd;
  --success-color: #27ae60;
  --danger-color: #e74c3c;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: var(--background-color);
}

.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Content Area Styling */
.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--content-bg);
}

.content-wrapper {
  max-width: 100%;
  margin: 0 auto;
}

/* Welcome message */
.welcome-message {
  text-align: center;
  padding: 50px 20px;
  color: #666;
}

.welcome-message h2 {
  margin-bottom: 15px;
  color: #333;
}

/* Markdown styling */
.preview-container h1 { font-size: 2.2rem; margin: 0.5em 0; }
.preview-container h2 { font-size: 1.8rem; margin: 0.5em 0; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.preview-container h3 { font-size: 1.5rem; margin: 0.5em 0; }
.preview-container h4 { font-size: 1.3rem; margin: 0.5em 0; }
.preview-container h5 { font-size: 1.2rem; margin: 0.5em 0; }
.preview-container h6 { font-size: 1.1rem; margin: 0.5em 0; }

.preview-container p { margin: 1em 0; }
.preview-container ul, .preview-container ol { margin: 1em 0; padding-left: 2em; }
.preview-container blockquote { 
  border-left: 4px solid #ddd; 
  padding-left: 1em; 
  margin-left: 0;
  color: #666; 
}
.preview-container pre { 
  background-color: #f6f8fa; 
  padding: 16px; 
  border-radius: 4px; 
  overflow: auto; 
}
.preview-container code { 
  font-family: 'Courier New', Courier, monospace; 
  background-color: rgba(0,0,0,0.05); 
  padding: 0.2em 0.4em; 
  border-radius: 3px; 
}
.preview-container pre code { 
  background-color: transparent; 
  padding: 0; 
}
</style> 