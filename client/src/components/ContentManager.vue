<template>
  <div class="modal-backdrop" v-if="show">
    <div class="modal-content" :class="{ 'dark-mode': isDarkMode }">
      <div class="modal-header">
        <h2>Quản lý nội dung</h2>
        <button class="theme-toggle" @click="toggleDarkMode">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
      </div>
      
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.id" 
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.name }}
        </div>
      </div>

      <!-- Tab Nội dung -->
      <div v-if="activeTab === 'content'" class="tab-content">
        <div class="action-panel">
          <div class="panel-title">Điều chỉnh vị trí và tên trang</div>
          
          <div class="search-filter">
            <input 
              type="text" 
              v-model="contentFilter" 
              placeholder="Tìm kiếm trang..." 
              class="search-input"
            />
            <select v-model="sortOrder" class="sort-select">
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="order">Thứ tự hiện tại</option>
            </select>
          </div>
          
          <div class="file-list-container">
            <draggable v-model="orderedFiles" group="files" @end="updateOrder" class="file-list" item-key="id" :disabled="sortOrder !== 'order'">
              <template #item="{element: file, index}">
                <div class="file-item-draggable" :class="{ 'highlight': isFileHighlighted(file) }">
                  <div class="drag-handle" v-if="sortOrder === 'order'">⋮⋮</div>
                  <span class="file-number">{{ index + 1 }}.</span>
                  <input 
                    type="text" 
                    v-model="file.displayName" 
                    @blur="updateFileName(file)" 
                    class="file-edit-input"
                  />
                  <div class="file-actions">
                    <button class="action-icon edit-icon" @click="editFile(file.id)" title="Chỉnh sửa">✏️</button>
                    <button class="action-icon preview-icon" @click="previewFile(file.id)" title="Xem trước">👁️</button>
                    <button class="action-icon delete-icon" @click="confirmDeleteFile(file.id)" title="Xóa">🗑️</button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
          
          <div class="file-actions-panel">
            <button class="action-button create-button" @click="createNewFile">
              <span class="icon">📄</span> Tạo trang mới
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Cấu hình -->
      <div v-if="activeTab === 'config'" class="tab-content">
        <div class="action-panel">
          <div class="panel-title">Cấu hình hệ thống</div>
          <div class="form-group">
            <label for="siteTitle">Tiêu đề trang</label>
            <input type="text" id="siteTitle" v-model="siteConfig.title" class="form-input">
          </div>
          <div class="form-group">
            <label for="siteTheme">Giao diện</label>
            <select id="siteTheme" v-model="siteConfig.theme" class="form-input">
              <option value="default">Mặc định</option>
              <option value="dark">Tối</option>
              <option value="light">Sáng</option>
            </select>
          </div>
          <div class="form-group">
            <label for="siteLang">Ngôn ngữ</label>
            <select id="siteLang" v-model="siteConfig.language" class="form-input">
              <option value="vi">Tiếng Việt</option>
              <option value="en">Tiếng Anh</option>
              <option value="ja">Tiếng Nhật</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="siteNav">Hiển thị menu</label>
            <div class="toggle-switch">
              <input type="checkbox" id="siteNav" v-model="siteConfig.showNav">
              <label for="siteNav"></label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="siteAutoSave">Tự động lưu</label>
            <div class="toggle-switch">
              <input type="checkbox" id="siteAutoSave" v-model="siteConfig.autoSave">
              <label for="siteAutoSave"></label>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Nhập/Xuất -->
      <div v-if="activeTab === 'import'" class="tab-content">
        <div class="action-panel">
          <div class="panel-title">Nhập/Xuất dữ liệu</div>
          <div class="import-options">
            <button class="action-button import-button" @click="importData">
              <span class="icon">📥</span> Nhập từ MkDocs
            </button>
            <button class="action-button export-button" @click="exportData">
              <span class="icon">📤</span> Xuất ra MkDocs
            </button>
            <button class="action-button backup-button" @click="backupData">
              <span class="icon">💾</span> Sao lưu dữ liệu
            </button>
          </div>
          <div class="form-group" v-if="showImportForm">
            <label for="importFile">Chọn file mkdocs.yml</label>
            <input type="file" id="importFile" @change="handleFileImport" class="form-input">
          </div>
          
          <div class="import-progress" v-if="isImporting">
            <div class="progress-bar">
              <div class="progress-bar-fill" :style="{ width: importProgress + '%' }"></div>
            </div>
            <div class="progress-text">{{ importProgressText }}</div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="saveChanges" class="action-button save-button">
          <span class="icon">💾</span> Lưu thay đổi
        </button>
        <button @click="$emit('close')" class="action-button cancel-button">
          <span class="icon">✖️</span> Đóng
        </button>
      </div>
      
      <!-- Modal xác nhận xóa -->
      <div class="confirm-modal" v-if="showDeleteConfirm">
        <div class="confirm-content">
          <h3>Xác nhận xóa</h3>
          <p>Bạn có chắc chắn muốn xóa trang này?</p>
          <div class="confirm-actions">
            <button @click="deleteFile" class="action-button delete-confirm-button">Xóa</button>
            <button @click="showDeleteConfirm = false" class="action-button cancel-button">Hủy</button>
          </div>
        </div>
      </div>
      
      <!-- Modal xem trước -->
      <div class="preview-modal" v-if="showPreview">
        <div class="preview-content">
          <div class="preview-header">
            <h3>Xem trước: {{ previewFileName }}</h3>
            <button @click="showPreview = false" class="close-button">✖️</button>
          </div>
          <div class="preview-body" v-html="previewContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import axios from 'axios';

export default {
  name: 'ContentManager',
  components: {
    draggable: VueDraggableNext
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    files: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'content',
      tabs: [
        { id: 'content', name: 'Nội dung', icon: '📄' },
        { id: 'config', name: 'Cấu hình', icon: '⚙️' },
        { id: 'import', name: 'Nhập/Xuất', icon: '📁' }
      ],
      orderedFiles: [],
      siteConfig: {
        title: 'Migration Guideline',
        theme: 'default',
        language: 'vi',
        showNav: true,
        autoSave: false
      },
      showImportForm: false,
      isDarkMode: localStorage.getItem('darkMode') === 'true',
      contentFilter: '',
      sortOrder: 'order',
      showDeleteConfirm: false,
      fileToDelete: null,
      showPreview: false,
      previewContent: '',
      previewFileName: '',
      isImporting: false,
      importProgress: 0,
      importProgressText: ''
    };
  },
  watch: {
    files: {
      immediate: true,
      handler(newFiles) {
        this.orderedFiles = newFiles.map((file, index) => ({
          id: file,
          displayName: this.formatFileName(file),
          originalName: file,
          order: index
        }));
      }
    },
    isDarkMode(newVal) {
      localStorage.setItem('darkMode', newVal);
    }
  },
  computed: {
    filteredFiles() {
      if (!this.contentFilter) return this.orderedFiles;
      
      return this.orderedFiles.filter(file => 
        file.displayName.toLowerCase().includes(this.contentFilter.toLowerCase())
      );
    }
  },
  methods: {
    formatFileName(fileName) {
      return fileName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
    },
    updateOrder() {
      // Cập nhật thứ tự files sau khi kéo thả
      this.$emit('reorder-files', this.orderedFiles.map(file => file.id));
    },
    updateFileName(file) {
      // Cập nhật tên hiển thị của file
      const newName = file.displayName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      
      if (newName !== file.originalName) {
        this.$emit('rename-file', {
          oldName: file.originalName,
          newName: newName
        });
        file.originalName = newName;
      }
    },
    isFileHighlighted(file) {
      return this.contentFilter && 
             file.displayName.toLowerCase().includes(this.contentFilter.toLowerCase());
    },
    editFile(fileId) {
      // Mở file để chỉnh sửa
      this.$emit('edit-file', fileId);
      this.$emit('close');
    },
    confirmDeleteFile(fileId) {
      this.fileToDelete = fileId;
      this.showDeleteConfirm = true;
    },
    deleteFile() {
      if (this.fileToDelete) {
        this.$emit('delete-file', this.fileToDelete);
        this.showDeleteConfirm = false;
        this.fileToDelete = null;
      }
    },
    createNewFile() {
      this.$emit('create-file');
      this.$emit('close');
    },
    previewFile(fileId) {
      // Thực hiện API call để lấy nội dung file và render
      const fileName = this.orderedFiles.find(f => f.id === fileId)?.displayName || '';
      this.previewFileName = fileName;
      
      // Giả lập nội dung preview - trong thực tế cần gọi API để lấy nội dung thực
      this.previewContent = `<h1>${fileName}</h1><p>Đây là nội dung xem trước của trang ${fileName}.</p>`;
      this.showPreview = true;
    },
    importData() {
      this.showImportForm = true;
    },
    handleFileImport(event) {
      // Xử lý import file
      const file = event.target.files[0];
      if (file) {
        this.showImportForm = false;
        this.isImporting = true;
        this.importProgress = 0;
        this.importProgressText = 'Đang chuẩn bị nhập dữ liệu...';
        
        // Tạo FormData để gửi file
        const formData = new FormData();
        formData.append('mkdocsFile', file);
        
        // Gửi request để nhập dữ liệu
        axios.post('/api/import/mkdocs', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.importProgress = Math.min(30, percentCompleted); // Tối đa 30% cho phần upload
            this.importProgressText = 'Đang tải lên file...';
          }
        })
        .then(response => {
          this.importProgress = 50;
          this.importProgressText = 'Đang xử lý dữ liệu...';
          
          // Hoàn tất nhập dữ liệu sau 1 giây
          setTimeout(() => {
            this.importProgress = 100;
            this.importProgressText = 'Hoàn tất nhập dữ liệu!';
            
            // Đóng progress bar và thông báo sau 1 giây
            setTimeout(() => {
              this.isImporting = false;
              this.$emit('refresh-files');
              alert(`Đã nhập thành công ${response.data.files.length} file từ MkDocs.`);
            }, 1000);
          }, 1000);
        })
        .catch(error => {
          this.isImporting = false;
          alert(`Lỗi khi nhập dữ liệu: ${error.response?.data?.error || error.message}`);
        });
      }
    },
    exportData() {
      // Xuất dữ liệu ra định dạng MkDocs
      this.isImporting = true;
      this.importProgress = 0;
      this.importProgressText = 'Đang chuẩn bị xuất dữ liệu...';
      
      setTimeout(() => {
        this.importProgress = 30;
        this.importProgressText = 'Đang tạo cấu trúc MkDocs...';
        
        setTimeout(() => {
          this.importProgress = 60;
          this.importProgressText = 'Đang nén dữ liệu...';
          
          // Tạo iframe để tải xuống file
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
          
          // Gán địa chỉ cho iframe để tải xuống
          iframe.src = '/api/export/mkdocs';
          
          // Hoàn tất quá trình xuất sau 2 giây
          setTimeout(() => {
            this.importProgress = 100;
            this.importProgressText = 'Hoàn tất xuất dữ liệu!';
            
            // Đóng progress bar sau 1 giây
            setTimeout(() => {
              this.isImporting = false;
              document.body.removeChild(iframe);
            }, 1000);
          }, 2000);
        }, 1000);
      }, 500);
    },
    backupData() {
      // Sao lưu dữ liệu
      this.isImporting = true;
      this.importProgress = 0;
      this.importProgressText = 'Đang chuẩn bị sao lưu...';
      
      setTimeout(() => {
        this.importProgress = 50;
        this.importProgressText = 'Đang nén dữ liệu...';
        
        // Tạo iframe để tải xuống file
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Gán địa chỉ cho iframe để tải xuống
        iframe.src = '/api/backup';
        
        // Hoàn tất quá trình sao lưu sau 1.5 giây
        setTimeout(() => {
          this.importProgress = 100;
          this.importProgressText = 'Hoàn tất sao lưu!';
          
          // Đóng progress bar sau 1 giây
          setTimeout(() => {
            this.isImporting = false;
            document.body.removeChild(iframe);
          }, 1000);
        }, 1500);
      }, 500);
    },
    saveChanges() {
      this.$emit('save-config', this.siteConfig);
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 700px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.modal-content.dark-mode {
  background-color: #222;
  color: #f0f0f0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-content h2 {
  margin: 0;
  color: #2980b9;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.modal-content.dark-mode h2 {
  color: #3498db;
  border-bottom-color: #444;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.theme-toggle:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.modal-content.dark-mode .theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.modal-content.dark-mode .tabs {
  border-bottom-color: #444;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab:hover {
  background-color: #f5f5f5;
}

.modal-content.dark-mode .tab:hover {
  background-color: #333;
}

.tab.active {
  border-bottom: 2px solid #2980b9;
  color: #2980b9;
  font-weight: bold;
}

.modal-content.dark-mode .tab.active {
  border-bottom-color: #3498db;
  color: #3498db;
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-content {
  margin-bottom: 20px;
}

.action-panel {
  background-color: #f9f9f9;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 15px;
  transition: background-color 0.3s;
}

.modal-content.dark-mode .action-panel {
  background-color: #333;
}

.panel-title {
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.modal-content.dark-mode .panel-title {
  color: #f0f0f0;
}

.search-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s;
}

.modal-content.dark-mode .search-input {
  background-color: #444;
  border-color: #555;
  color: #f0f0f0;
}

.search-input:focus {
  border-color: #3498db;
  outline: none;
}

.sort-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.modal-content.dark-mode .sort-select {
  background-color: #444;
  border-color: #555;
  color: #f0f0f0;
}

.file-list-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s;
}

.modal-content.dark-mode .file-list-container {
  border-color: #555;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item-draggable {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: white;
  border-bottom: 1px solid #eee;
  transition: all 0.3s;
}

.modal-content.dark-mode .file-item-draggable {
  background-color: #444;
  border-bottom-color: #555;
}

.file-item-draggable:hover {
  background-color: #f5f5f5;
}

.modal-content.dark-mode .file-item-draggable:hover {
  background-color: #555;
}

.file-item-draggable.highlight {
  background-color: rgba(52, 152, 219, 0.1);
}

.modal-content.dark-mode .file-item-draggable.highlight {
  background-color: rgba(52, 152, 219, 0.2);
}

.drag-handle {
  cursor: move;
  margin-right: 10px;
  color: #999;
}

.modal-content.dark-mode .drag-handle {
  color: #bbb;
}

.file-number {
  margin-right: 10px;
  min-width: 20px;
  text-align: right;
}

.file-edit-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
  transition: border-color 0.3s;
}

.modal-content.dark-mode .file-edit-input {
  background-color: #555;
  border-color: #666;
  color: #f0f0f0;
}

.file-edit-input:focus {
  border-color: #3498db;
  outline: none;
}

.file-actions {
  display: flex;
  gap: 5px;
}

.file-actions-panel {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: border-color 0.3s;
}

.modal-content.dark-mode .form-input {
  background-color: #444;
  border-color: #555;
  color: #f0f0f0;
}

.form-input:focus {
  border-color: #3498db;
  outline: none;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: #2196F3;
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

.modal-content.dark-mode .toggle-switch label {
  background-color: #666;
}

.import-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.save-button {
  background-color: #27ae60;
  color: white;
}

.save-button:hover {
  background-color: #219653;
  transform: translateY(-2px);
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
}

.cancel-button:hover {
  background-color: #7f8c8d;
  transform: translateY(-2px);
}

.import-button, .export-button, .backup-button {
  background-color: #3498db;
  color: white;
}

.import-button:hover, .export-button:hover, .backup-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.create-button {
  background-color: #27ae60;
  color: white;
}

.create-button:hover {
  background-color: #219653;
}

.delete-confirm-button {
  background-color: #e74c3c;
  color: white;
}

.delete-confirm-button:hover {
  background-color: #c0392b;
}

.icon {
  margin-right: 5px;
}

.action-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #3498db;
  transition: all 0.2s;
  padding: 5px;
  border-radius: 4px;
}

.action-icon:hover {
  color: #2980b9;
  background-color: rgba(52, 152, 219, 0.1);
}

.modal-content.dark-mode .action-icon {
  color: #3498db;
}

.modal-content.dark-mode .action-icon:hover {
  background-color: rgba(52, 152, 219, 0.2);
}

.edit-icon:hover {
  color: #f39c12;
}

.delete-icon:hover {
  color: #e74c3c;
}

.preview-icon:hover {
  color: #2ecc71;
}

/* Confirm modal */
.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.confirm-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-content.dark-mode + .confirm-modal .confirm-content {
  background-color: #333;
  color: #f0f0f0;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

/* Preview modal */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.preview-content {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  height: 80%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-content.dark-mode + .preview-modal .preview-content {
  background-color: #333;
  color: #f0f0f0;
}

.preview-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-content.dark-mode + .preview-modal .preview-header {
  border-bottom-color: #444;
}

.preview-header h3 {
  margin: 0;
  color: #2980b9;
}

.modal-content.dark-mode + .preview-modal .preview-header h3 {
  color: #3498db;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #777;
}

.close-button:hover {
  color: #e74c3c;
}

.preview-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* Progress bar */
.import-progress {
  margin-top: 15px;
}

.progress-bar {
  height: 10px;
  background-color: #eee;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.modal-content.dark-mode .progress-bar {
  background-color: #555;
}

.progress-bar-fill {
  height: 100%;
  background-color: #3498db;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.9rem;
  color: #777;
  text-align: center;
}

.modal-content.dark-mode .progress-text {
  color: #aaa;
}

/* Animations */
@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-content {
  animation: slideIn 0.3s ease-out;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    padding: 15px;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab {
    flex: 1;
    min-width: 100px;
    padding: 8px 10px;
    font-size: 0.9rem;
  }
  
  .search-filter {
    flex-direction: column;
  }
  
  .import-options {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
}
</style> 