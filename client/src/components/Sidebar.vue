<template>
  <aside class="sidebar" :class="{ 'dark-mode': isDarkMode }">
    <h1 class="app-title">
      <span class="app-logo">📘</span>
      Migration Guideline
    </h1>
    
    <div class="theme-toggle" @click="toggleDarkMode" title="Chuyển đổi chế độ tối/sáng">
      {{ isDarkMode ? '☀️' : '🌙' }}
    </div>
    
    <div class="file-controls">
      <button @click="$emit('create-file')" class="action-button create-button">
        <span class="button-icon">📄</span>
        <span class="button-text">Tạo mới</span>
      </button>
      <button @click="$emit('manage-content')" class="action-button manage-button">
        <span class="button-icon">⚙️</span>
        <span class="button-text">Quản lý</span>
      </button>
    </div>
    
    <div class="search-box">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Tìm kiếm..." 
        class="search-input"
        @input="$emit('search', searchQuery)"
      />
      <span v-if="searchQuery" class="clear-search" @click="clearSearch">✖</span>
    </div>
    
    <nav class="file-navigator">
      <div v-if="searchActive && searchResults.length > 0" class="search-results-info">
        <span class="results-count">{{ searchResults.length }} kết quả</span>
      </div>
      
      <ul v-if="files.length" class="nav-list">
        <li 
          v-for="(file, index) in displayedFiles" 
          :key="file" 
          :class="{ 
            active: currentFile === file,
            'search-result': isSearchResult(file)
          }"
        >
          <div class="file-item">
            <span class="file-number">{{ index + 1 }}.</span>
            <a href="#" @click.prevent="$emit('select-file', file)" class="file-link">
              {{ formatFileName(file) }}
            </a>
            <div class="file-actions">
              <button 
                @click="$emit('delete-file', file)" 
                class="action-icon delete-icon" 
                title="Xóa file"
              >
                🗑️
              </button>
            </div>
          </div>
          <transition name="fade">
            <ul v-if="currentFile === file && filteredHeadings.length" class="heading-list">
              <li 
                v-for="heading in filteredHeadings" 
                :key="heading.id" 
                :class="getIndentClass(heading.level)"
              >
                <a 
                  href="#" 
                  @click.prevent="$emit('scroll-to-heading', heading.id)"
                  :title="heading.text"
                >
                  {{ heading.text }}
                </a>
              </li>
            </ul>
          </transition>
        </li>
      </ul>
      <p v-else class="no-files">Không có file nào.</p>
      
      <div v-if="searchActive && !searchResults.length" class="no-search-results">
        Không tìm thấy kết quả cho "{{ searchQuery }}"
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <div class="sidebar-info">
        <span class="info-item">
          <span class="info-icon">📁</span>
          {{ files.length }} trang
        </span>
        <span class="info-item">
          <span class="info-icon">👁️</span>
          v1.0
        </span>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'SidebarComponent',
  props: {
    files: {
      type: Array,
      required: true
    },
    currentFile: {
      type: String,
      default: null
    },
    headings: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      isDarkMode: localStorage.getItem('darkMode') === 'true'
    }
  },
  computed: {
    searchActive() {
      return this.searchQuery.trim().length > 0;
    },
    displayedFiles() {
      if (this.searchActive) {
        return this.searchResults;
      }
      return this.files;
    },
    filteredHeadings() {
      // Chỉ hiển thị heading cấp 2 (##) trở lên
      return this.headings.filter(heading => heading.level = 2);
    }
  },
  watch: {
    searchQuery(newVal) {
      if (newVal.trim()) {
        this.performSearch(newVal);
      } else {
        this.searchResults = [];
      }
    },
    isDarkMode(newVal) {
      localStorage.setItem('darkMode', newVal);
      // Đồng bộ chế độ tối với ContentManager
      document.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { isDarkMode: newVal } }));
    }
  },
  mounted() {
    // Lắng nghe sự kiện thay đổi chế độ tối từ ContentManager
    document.addEventListener('darkModeChanged', this.handleDarkModeChange);
  },
  beforeUnmount() {
    document.removeEventListener('darkModeChanged', this.handleDarkModeChange);
  },
  methods: {
    getIndentClass(level) {
      return `indent-level-${level}`;
    },
    formatFileName(fileName) {
      // Chuyển đổi tên file như "web-sourcecode-kousei" thành "Web Sourcecode Kousei"
      return fileName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    performSearch(query) {
      const normalizedQuery = query.toLowerCase().trim();
      this.searchResults = this.files.filter(file => {
        const fileName = this.formatFileName(file).toLowerCase();
        return fileName.includes(normalizedQuery);
      });
      this.$emit('search', query);
    },
    clearSearch() {
      this.searchQuery = '';
      this.searchResults = [];
      this.$emit('search', '');
    },
    isSearchResult(file) {
      return this.searchActive && this.searchResults.includes(file);
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
    },
    handleDarkModeChange(event) {
      this.isDarkMode = event.detail.isDarkMode;
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 300px;
  background-color: #343131;
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
  transition: all 0.3s ease;
  height: 100%;
}

.sidebar.dark-mode {
  background-color: #222;
  color: #f0f0f0;
}

.app-title {
  padding: 20px;
  font-size: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  background-color: #2980b9;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.app-logo {
  font-size: 1.8rem;
}

.theme-toggle {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: rotate(15deg);
}

.file-controls {
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.search-box {
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 30px 8px 8px;
  border-radius: 4px;
  border: 1px solid #666;
  background-color: #444;
  color: white;
  transition: all 0.3s;
}

.sidebar.dark-mode .search-input {
  background-color: #333;
  border-color: #555;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3);
}

.clear-search {
  position: absolute;
  right: 15px;
  top: 18px;
  cursor: pointer;
  color: #ccc;
  transition: color 0.2s;
}

.clear-search:hover {
  color: white;
}

.search-results-info {
  padding: 5px 10px;
  background-color: rgba(52, 152, 219, 0.2);
  font-size: 0.85rem;
  color: #3498db;
}

.no-search-results {
  padding: 15px;
  text-align: center;
  color: #e74c3c;
  font-style: italic;
}

.file-navigator {
  flex: 1;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s;
}

.file-number {
  margin-right: 5px;
  color: rgba(255, 255, 255, 0.7);
}

.file-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.file-link {
  color: #f5f5f5;
  text-decoration: none;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.sidebar.dark-mode .file-link {
  color: #e0e0e0;
}

.file-actions {
  opacity: 0.6;
  transition: opacity 0.2s;
}

.file-item:hover .file-actions {
  opacity: 1;
}

li.active .file-item {
  background-color: rgba(41, 128, 185, 0.3);
}

li.active .file-link {
  color: #3498db;
  font-weight: bold;
}

li.search-result .file-item {
  background-color: rgba(39, 174, 96, 0.1);
}

.sidebar.dark-mode li.search-result .file-item {
  background-color: rgba(46, 204, 113, 0.15);
}

.heading-list {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 5px 0;
  margin: 0;
  list-style: none;
}

.sidebar.dark-mode .heading-list {
  background-color: rgba(0, 0, 0, 0.4);
}

.heading-list li {
  padding: 3px 15px 3px 30px;
}

.heading-list li a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.heading-list li a:hover {
  color: #3498db;
}

.indent-level-1 { padding-left: 30px !important; }
.indent-level-2 { padding-left: 45px !important; }
.indent-level-3 { padding-left: 60px !important; }
.indent-level-4 { padding-left: 75px !important; }
.indent-level-5 { padding-left: 90px !important; }
.indent-level-6 { padding-left: 105px !important; }

.no-files {
  padding: 20px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.action-button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.button-icon {
  font-size: 1.1rem;
}

.create-button {
  background-color: #27ae60;
  color: white;
}

.create-button:hover {
  background-color: #219653;
  transform: translateY(-2px);
}

.manage-button {
  background-color: #f39c12;
  color: white;
}

.manage-button:hover {
  background-color: #e67e22;
  transform: translateY(-2px);
}

.action-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
  padding: 5px;
  border-radius: 4px;
}

.action-icon:hover {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.2);
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-info {
  display: flex;
  justify-content: space-around;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.info-icon {
  font-size: 1rem;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: all 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    width: 250px;
  }
  
  .button-text {
    display: none;
  }
  
  .action-button {
    padding: 8px;
  }
  
  .button-icon {
    margin: 0;
    font-size: 1.3rem;
  }
}
</style> 