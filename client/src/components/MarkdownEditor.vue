<template>
  <div class="editor-container" :class="{ 'dark-mode': isDarkMode }">
    <div class="content-header">
      <h2 class="current-file-title">{{ fileName }}</h2>
      <div class="content-actions">
        <button @click="toggleEditMode" class="action-button toggle-edit-button">
          {{ isEditing ? 'Xem trước' : 'Chỉnh sửa' }}
        </button>
        <button v-if="isEditing" @click="saveContent" class="action-button save-button">
          <span class="button-icon">💾</span> Lưu
        </button>
        <div class="editor-mode-switcher" v-if="isEditing">
          <button 
            @click="editorMode = 'wysiwyg'" 
            class="mode-button" 
            :class="{ active: editorMode === 'wysiwyg' }"
            title="Chế độ WYSIWYG"
          >
            <span class="button-icon">📝</span> WYSIWYG
          </button>
          <button 
            @click="editorMode = 'markdown'" 
            class="mode-button" 
            :class="{ active: editorMode === 'markdown' }"
            title="Chế độ Markdown"
          >
            <span class="button-icon">📄</span> Markdown
          </button>
        </div>
        <button @click="toggleDarkMode" class="action-button theme-button" title="Chuyển chế độ sáng/tối">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
      </div>
    </div>
    
    <div v-if="isEditing" class="editor-wrapper">
      <div v-if="editorMode === 'wysiwyg'" class="wysiwyg-editor">
        <editor
          v-model="wysiwyg.content"
          :init="tinymceInit"
          @change="wysiwyg.contentUpdated = true"
        />
      </div>
      <div v-else class="markdown-source-editor">
        <div class="editor-toolbar">
          <button @click="insertMarkdown('# ')" title="Tiêu đề 1">H1</button>
          <button @click="insertMarkdown('## ')" title="Tiêu đề 2">H2</button>
          <button @click="insertMarkdown('### ')" title="Tiêu đề 3">H3</button>
          <span class="separator">|</span>
          <button @click="insertMarkdown('**', '**')" title="In đậm"><b>B</b></button>
          <button @click="insertMarkdown('*', '*')" title="In nghiêng"><i>I</i></button>
          <button @click="insertMarkdown('~~', '~~')" title="Gạch ngang"><s>S</s></button>
          <span class="separator">|</span>
          <button @click="insertMarkdown('- ')" title="Danh sách không thứ tự">• Danh sách</button>
          <button @click="insertMarkdown('1. ')" title="Danh sách có thứ tự">1. Danh sách</button>
          <span class="separator">|</span>
          <button @click="insertMarkdown('[', '](url)')" title="Liên kết">🔗 Link</button>
          <button @click="insertMarkdown('![alt text](', ')')" title="Hình ảnh">🖼️ Ảnh</button>
          <button @click="insertMarkdown('```\n', '\n```')" title="Khối mã">💻 Code</button>
          <button @click="insertMarkdown('> ')" title="Trích dẫn">💬 Quote</button>
          <button @click="insertMarkdown('---\n')" title="Đường kẻ ngang">— HR</button>
          <button @click="insertMarkdown('| Header | Header |\n| --- | --- |\n| Cell | Cell |\n| Cell | Cell |')" title="Bảng">🧮 Bảng</button>
        </div>
        <div class="split-view">
          <textarea 
            v-model="localContent" 
            class="markdown-editor"
            ref="markdownTextarea"
            @input="onMarkdownInput"
            @scroll="syncScroll"
          ></textarea>
          <div 
            class="markdown-preview" 
            v-html="markdownPreview"
            ref="livePreview"
            @scroll="syncPreviewScroll"
          ></div>
        </div>
      </div>
    </div>
    <div v-else class="preview-container" v-html="htmlContent"></div>
    
    <!-- Tooltip cho bộ soạn thảo -->
    <div class="markdown-tooltip" v-show="showTooltip" :style="tooltipStyle">
      <strong>Gợi ý:</strong> {{ tooltipText }}
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import Editor from '@tinymce/tinymce-vue';

// Tùy chỉnh renderer để đảm bảo ID được thêm vào heading và có thể click
const renderer = new marked.Renderer();
renderer.heading = function(text, level) {
  const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
  const id = `heading-${escapedText}`;
  console.log(`Tạo heading với id: ${id}, text: ${text}`);
  return `<h${level} id="${id}">${text}</h${level}>`;
};

// Cấu hình marked với highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  breaks: true,
  headerIds: true, // Đảm bảo các tiêu đề có ID
  gfm: true,
  renderer: renderer // Sử dụng renderer đã tùy chỉnh
});

export default {
  name: 'MarkdownEditor',
  components: {
    Editor
  },
  props: {
    fileName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    html: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      isEditing: false,
      localContent: this.content,
      isDarkMode: localStorage.getItem('darkMode') === 'true',
      editorMode: 'wysiwyg',
      wysiwyg: {
        content: '',
        contentUpdated: false
      },
      tinymceInit: {
        height: 500,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount',
          'codesample'
        ],
        toolbar:
          'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | codesample | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        codesample_languages: [
          { text: 'HTML/XML', value: 'markup' },
          { text: 'JavaScript', value: 'javascript' },
          { text: 'CSS', value: 'css' },
          { text: 'PHP', value: 'php' },
          { text: 'Ruby', value: 'ruby' },
          { text: 'Python', value: 'python' },
          { text: 'Java', value: 'java' },
          { text: 'C', value: 'c' },
          { text: 'C#', value: 'csharp' },
          { text: 'C++', value: 'cpp' },
          { text: 'SQL', value: 'sql' },
          { text: 'Bash', value: 'bash' }
        ],
        extended_valid_elements: 'script[language|type|src]',
        skin: this.isDarkMode ? 'oxide-dark' : 'oxide',
        content_css: this.isDarkMode ? 'dark' : 'default'
      },
      showTooltip: false,
      tooltipText: '',
      tooltipStyle: {
        top: '0px',
        left: '0px'
      },
      syncingScroll: false
    }
  },
  computed: {
    htmlContent() {
      return this.html;
    },
    markdownPreview() {
      // Trả về kết quả đã được parse từ Markdown sang HTML
      return marked(this.localContent || '');
    }
  },
  watch: {
    content(newContent) {
      this.localContent = newContent;
      if (!this.wysiwyg.contentUpdated) {
        this.wysiwyg.content = this.markdownToHtml(newContent);
      }
    },
    localContent: {
      handler() {
        // Xử lý headings khi nội dung thay đổi
        this.processHeadings();
      }
    },
    isDarkMode(newVal) {
      localStorage.setItem('darkMode', newVal);
      document.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { isDarkMode: newVal } }));
      
      // Cập nhật thiết lập TinyMCE
      this.tinymceInit = {
        ...this.tinymceInit,
        skin: newVal ? 'oxide-dark' : 'oxide',
        content_css: newVal ? 'dark' : 'default'
      };
    },
    editorMode(newMode) {
      if (newMode === 'wysiwyg' && !this.wysiwyg.content) {
        this.wysiwyg.content = this.markdownToHtml(this.localContent);
      } else if (newMode === 'markdown' && this.wysiwyg.contentUpdated) {
        // Cập nhật nội dung Markdown từ WYSIWYG khi chuyển chế độ
        this.localContent = this.htmlToMarkdown(this.wysiwyg.content);
        this.wysiwyg.contentUpdated = false;
      }
    }
  },
  mounted() {
    document.addEventListener('darkModeChanged', this.handleDarkModeChange);
    this.wysiwyg.content = this.markdownToHtml(this.localContent);
    
    this.$nextTick(() => {
      this.processHeadings();
    });
  },
  beforeUnmount() {
    document.removeEventListener('darkModeChanged', this.handleDarkModeChange);
  },
  methods: {
    toggleEditMode() {
      this.isEditing = !this.isEditing;
      if (!this.isEditing && this.localContent !== this.content) {
        // Nếu người dùng đã chỉnh sửa nhưng chưa lưu, hỏi xác nhận
        if (confirm('Bạn có muốn lưu các thay đổi không?')) {
          this.saveContent();
        } else {
          // Khôi phục nội dung gốc nếu không lưu
          this.localContent = this.content;
          this.wysiwyg.content = this.markdownToHtml(this.content);
          this.wysiwyg.contentUpdated = false;
        }
      }
    },
    saveContent() {
      // Đồng bộ nội dung giữa WYSIWYG và Markdown
      if (this.editorMode === 'wysiwyg' && this.wysiwyg.contentUpdated) {
        this.localContent = this.htmlToMarkdown(this.wysiwyg.content);
        this.wysiwyg.contentUpdated = false;
      }
      
      this.$emit('save', this.localContent);
      this.processHeadings();
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
    },
    handleDarkModeChange(event) {
      this.isDarkMode = event.detail.isDarkMode;
    },
    processHeadings() {
      const headings = [];
      const lines = this.localContent.split('\n');
      
      console.log('MarkdownEditor - Đang xử lý headings, tổng số dòng:', lines.length);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Kiểm tra cả dấu # và khoảng trắng sau nó để đảm bảo đó là heading hợp lệ
        const match = line.match(/^(#+)\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();
          const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
          const id = `heading-${escapedText}`;
          console.log(`MarkdownEditor - Tìm thấy heading tại dòng ${i+1}: level=${level}, text="${text}", id="${id}"`);
          headings.push({ level, text, id });
        }
      }
      
      console.log('MarkdownEditor - Tổng số headings được xử lý:', headings.length);
      if (headings.length > 0) {
        console.log('MarkdownEditor - Danh sách headings:', headings);
      } else {
        console.log('MarkdownEditor - Không tìm thấy heading nào trong nội dung');
      }
      
      this.$emit('update-headings', headings);
    },
    markdownToHtml(markdown) {
      return marked(markdown || '');
    },
    htmlToMarkdown(html) {
      // Đây chỉ là một ví dụ đơn giản về cách chuyển đổi HTML sang Markdown
      // Trong thực tế, bạn nên sử dụng thư viện như turndown.js
      let markdown = html;
      
      // Thay thế heading
      markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
      markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
      markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
      markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
      markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n');
      markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n');
      
      // Thay thế paragraph
      markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
      
      // Thay thế in đậm và in nghiêng
      markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
      markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
      markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
      markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
      
      // Thay thế liên kết
      markdown = markdown.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
      
      // Thay thế hình ảnh
      markdown = markdown.replace(/<img\s+(?:[^>]*?\s+)?src="([^"]*)"[^>]*?alt="([^"]*)"[^>]*?>/gi, '![$2]($1)');
      markdown = markdown.replace(/<img\s+(?:[^>]*?\s+)?src="([^"]*)"[^>]*?>/gi, '![]($1)');
      
      // Thay thế danh sách
      markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n');
      });
      
      markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        let index = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gis, (match, content) => {
          return `${index++}. ${content}\n`;
        });
      });
      
      // Thay thế code
      markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```');
      markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
      
      // Thay thế blockquote
      markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
        return content.replace(/<p[^>]*>(.*?)<\/p>/gis, '> $1\n');
      });
      
      // Thay thế bảng
      markdown = markdown.replace(/<table[^>]*>(.*?)<\/table>/gis, (match, tableContent) => {
        let mdTable = '';
        
        // Xử lý tiêu đề
        const headerMatch = tableContent.match(/<thead[^>]*>(.*?)<\/thead>/is);
        if (headerMatch) {
          const headerContent = headerMatch[1];
          const headers = [];
          const regex = /<th[^>]*>(.*?)<\/th>/gis;
          let thMatch;
          while ((thMatch = regex.exec(headerContent)) !== null) {
            headers.push(thMatch[1].trim());
          }
          
          if (headers.length > 0) {
            mdTable += '| ' + headers.join(' | ') + ' |\n';
            mdTable += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
          }
        }
        
        // Xử lý nội dung
        const bodyMatch = tableContent.match(/<tbody[^>]*>(.*?)<\/tbody>/is);
        if (bodyMatch) {
          const bodyContent = bodyMatch[1];
          const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
          let rowMatch;
          
          while ((rowMatch = rowRegex.exec(bodyContent)) !== null) {
            const rowContent = rowMatch[1];
            const cells = [];
            const cellRegex = /<td[^>]*>(.*?)<\/td>/gis;
            let cellMatch;
            
            while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
              cells.push(cellMatch[1].trim());
            }
            
            if (cells.length > 0) {
              mdTable += '| ' + cells.join(' | ') + ' |\n';
            }
          }
        }
        
        return mdTable;
      });
      
      // Xóa các thẻ HTML không cần thiết
      markdown = markdown.replace(/<\/?[^>]+(>|$)/g, '');
      
      // Xử lý các ký tự đặc biệt
      markdown = markdown.replace(/&nbsp;/g, ' ');
      markdown = markdown.replace(/&lt;/g, '<');
      markdown = markdown.replace(/&gt;/g, '>');
      markdown = markdown.replace(/&amp;/g, '&');
      markdown = markdown.replace(/&quot;/g, '"');
      
      return markdown;
    },
    insertMarkdown(prefix, suffix = '') {
      const textarea = this.$refs.markdownTextarea;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selection = this.localContent.substring(start, end);
      
      this.localContent = this.localContent.substring(0, start) 
        + prefix + selection + suffix 
        + this.localContent.substring(end);
      
      // Đặt con trỏ vào vị trí phù hợp
      this.$nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length, 
          start + prefix.length + selection.length
        );
      });
    },
    onMarkdownInput() {
      this.processHeadings();
      this.showContextTooltip();
    },
    showContextTooltip() {
      const textarea = this.$refs.markdownTextarea;
      if (!textarea) return;
      
      const cursorPosition = textarea.selectionStart;
      const lines = this.localContent.substring(0, cursorPosition).split('\n');
      const currentLine = lines[lines.length - 1];
      
      if (currentLine.startsWith('#')) {
        this.tooltipText = 'Đang tạo tiêu đề. Thêm khoảng trắng và nhập nội dung tiêu đề.';
        this.showTooltip = true;
      } else if (currentLine.startsWith('-') || currentLine.startsWith('*')) {
        this.tooltipText = 'Đang tạo danh sách không thứ tự. Tiếp tục thêm các mục bằng dấu - hoặc * ở đầu dòng.';
        this.showTooltip = true;
      } else if (/^\d+\./.test(currentLine)) {
        this.tooltipText = 'Đang tạo danh sách có thứ tự. Tiếp tục thêm các mục bằng số. ở đầu dòng.';
        this.showTooltip = true;
      } else if (currentLine.startsWith('>')) {
        this.tooltipText = 'Đang tạo trích dẫn. Tiếp tục thêm dấu > ở đầu dòng cho các đoạn trích dẫn mới.';
        this.showTooltip = true;
      } else if (currentLine.startsWith('```')) {
        this.tooltipText = 'Đang tạo khối mã. Kết thúc khối bằng cách thêm ``` ở một dòng riêng.';
        this.showTooltip = true;
      } else if (currentLine.startsWith('|')) {
        this.tooltipText = 'Đang tạo bảng. Sử dụng | để phân cách các cột.';
        this.showTooltip = true;
      } else {
        this.showTooltip = false;
      }
      
      if (this.showTooltip) {
        // Định vị tooltip gần vị trí con trỏ
        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const lineCount = lines.length;
        
        this.tooltipStyle = {
          top: `${rect.top + lineCount * lineHeight - textarea.scrollTop + 5}px`,
          left: `${rect.left + 10}px`
        };
      }
    },
    syncScroll(e) {
      if (this.syncingScroll) return;
      
      this.syncingScroll = true;
      const textarea = e.target;
      const preview = this.$refs.livePreview;
      
      const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
      preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
      
      setTimeout(() => {
        this.syncingScroll = false;
      }, 100);
    },
    syncPreviewScroll(e) {
      if (this.syncingScroll) return;
      
      this.syncingScroll = true;
      const preview = e.target;
      const textarea = this.$refs.markdownTextarea;
      
      const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
      textarea.scrollTop = scrollPercentage * (textarea.scrollHeight - textarea.clientHeight);
      
      setTimeout(() => {
        this.syncingScroll = false;
      }, 100);
    }
  }
}
</script>

<style>
/* Thiết lập cho highlight.js */
.hljs {
  padding: 1.2em;
  border-radius: 5px;
}

/* CSS cho bảng */
.preview-container table,
.markdown-preview table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
  table-layout: fixed; /* Thêm thuộc tính này để các cột có độ rộng đều nhau */
}

.preview-container th,
.preview-container td,
.markdown-preview th,
.markdown-preview td {
  border: 1px solid #ddd;
  padding: 14px;
  text-align: left;
  word-wrap: break-word; /* Cho phép ngắt từ khi nội dung quá dài */
}

.dark-mode .preview-container th,
.dark-mode .preview-container td,
.dark-mode .markdown-preview th,
.dark-mode .markdown-preview td {
  border-color: #444;
}

.preview-container th,
.markdown-preview th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.dark-mode .preview-container th,
.dark-mode .markdown-preview th {
  background-color: #333;
}

.preview-container tr:nth-child(even),
.markdown-preview tr:nth-child(even) {
  background-color: #f9f9f9;
}

.dark-mode .preview-container tr:nth-child(even),
.dark-mode .markdown-preview tr:nth-child(even) {
  background-color: #2a2a2a;
}

/* Căn chỉnh tiêu đề bảng */
.preview-container th,
.markdown-preview th {
  text-align: center;
}

/* Thêm CSS để cải thiện hiển thị nội dung */
.preview-container,
.markdown-preview {
  font-size: 16px;
  line-height: 1.8;
  letter-spacing: 0.01em;
}

/* CSS cho heading */
.preview-container h1,
.preview-container h2,
.preview-container h3,
.preview-container h4,
.preview-container h5,
.preview-container h6,
.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3,
.markdown-preview h4,
.markdown-preview h5,
.markdown-preview h6 {
  margin: 1.8em 0 0.8em;
  line-height: 1.4;
  position: relative;
  cursor: pointer;
}

.preview-container h1,
.markdown-preview h1 {
  font-size: 2.2em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.4em;
}

.preview-container h2,
.markdown-preview h2 {
  font-size: 1.8em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.preview-container h3,
.markdown-preview h3 {
  font-size: 1.4em;
}

.preview-container h4,
.markdown-preview h4 {
  font-size: 1.2em;
}

.preview-container h5,
.markdown-preview h5 {
  font-size: 1.1em;
}

.preview-container h6,
.markdown-preview h6 {
  font-size: 1em;
}

/* Hiệu ứng hover cho heading */
.preview-container h1:hover,
.preview-container h2:hover,
.preview-container h3:hover,
.preview-container h4:hover,
.preview-container h5:hover,
.preview-container h6:hover,
.markdown-preview h1:hover,
.markdown-preview h2:hover,
.markdown-preview h3:hover,
.markdown-preview h4:hover,
.markdown-preview h5:hover,
.markdown-preview h6:hover {
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 3px;
}

/* Thêm biểu tượng liên kết khi hover */
.preview-container h1::before,
.preview-container h2::before,
.preview-container h3::before,
.markdown-preview h1::before,
.markdown-preview h2::before,
.markdown-preview h3::before {
  opacity: 0;
  content: "🔗";
  position: absolute;
  left: -25px;
  transition: opacity 0.2s;
}

.preview-container h1:hover::before,
.preview-container h2:hover::before,
.preview-container h3:hover::before,
.markdown-preview h1:hover::before,
.markdown-preview h2:hover::before,
.markdown-preview h3:hover::before {
  opacity: 0.5;
}

.preview-container p,
.markdown-preview p {
  margin: 1.2em 0;
}

.preview-container ul,
.preview-container ol,
.markdown-preview ul,
.markdown-preview ol {
  padding-left: 2em;
  margin: 1.2em 0;
}

.preview-container li,
.markdown-preview li {
  margin-bottom: 0.5em;
}

.preview-container code,
.markdown-preview code {
  font-size: 90%;
  padding: 0.3em 0.5em;
}

.preview-container pre,
.markdown-preview pre {
  margin: 1.5em 0;
  padding: 1.5em;
}

.preview-container blockquote,
.markdown-preview blockquote {
  padding: 0.8em 1.2em;
  margin: 1.5em 0;
  border-left: 4px solid #ddd;
  background-color: #f9f9f9;
}

.dark-mode .preview-container blockquote,
.dark-mode .markdown-preview blockquote {
  border-left: 4px solid #555;
  background-color: #2a2a2a;
}
</style>

<style scoped>
.editor-container {
  width: 100%;
  color: #333;
  max-width: 100%;
}

.editor-container.dark-mode {
  color: #f0f0f0;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color, #ddd);
}

.current-file-title {
  font-size: 1.8rem;
  color: #333;
}

.dark-mode .current-file-title {
  color: #f0f0f0;
}

.content-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.markdown-editor {
  width: 100%;
  min-height: 500px;
  padding: 15px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  line-height: 1.5;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  resize: vertical;
  background-color: #fff;
  color: #333;
}

.dark-mode .markdown-editor {
  background-color: #2d2d2d;
  color: #f0f0f0;
  border-color: #444;
}

.preview-container {
  padding: 25px 35px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  background-color: #fff;
  min-height: 500px;
  overflow-y: auto;
  line-height: 1.8;
  max-width: 100%;
  margin: 0 auto;
  width: 100%;
}

.dark-mode .preview-container {
  background-color: #2d2d2d;
  color: #f0f0f0;
  border-color: #444;
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

.button-icon {
  font-size: 1.1rem;
}

.toggle-edit-button {
  background-color: var(--primary-color, #3498db);
  color: white;
}

.toggle-edit-button:hover {
  background-color: var(--secondary-color, #2980b9);
  transform: translateY(-2px);
}

.save-button {
  background-color: var(--success-color, #27ae60);
  color: white;
}

.save-button:hover {
  background-color: #219653;
  transform: translateY(-2px);
}

.theme-button {
  background-color: transparent;
  border: 1px solid #ddd;
  color: #333;
  padding: 8px;
  font-size: 1.1rem;
}

.dark-mode .theme-button {
  border-color: #555;
  color: #f0f0f0;
}

.theme-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.dark-mode .theme-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.editor-mode-switcher {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.dark-mode .editor-mode-switcher {
  border-color: #555;
}

.mode-button {
  padding: 8px 12px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #333;
}

.dark-mode .mode-button {
  color: #f0f0f0;
}

.mode-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dark-mode .mode-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.mode-button.active {
  background-color: #3498db;
  color: white;
}

.dark-mode .mode-button.active {
  background-color: #2980b9;
}

/* WYSIWYG Editor */
.wysiwyg-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.dark-mode .wysiwyg-editor {
  border-color: #444;
}

/* Markdown Source Editor */
.markdown-source-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.dark-mode .markdown-source-editor {
  border-color: #444;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 5px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.dark-mode .editor-toolbar {
  background-color: #333;
  border-color: #444;
}

.editor-toolbar button {
  padding: 5px 10px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.9rem;
  color: #333;
}

.dark-mode .editor-toolbar button {
  color: #f0f0f0;
}

.editor-toolbar button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.dark-mode .editor-toolbar button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.separator {
  margin: 0 5px;
  color: #ddd;
}

.dark-mode .separator {
  color: #555;
}

.split-view {
  display: flex;
  height: 500px;
  border-top: 1px solid #ddd;
  flex: 1;
}

.dark-mode .split-view {
  border-color: #444;
}

.markdown-editor {
  flex: 1;
  min-height: 100%;
  margin: 0;
  padding: 15px;
  border: none;
  border-right: 1px solid #ddd;
  resize: none;
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.5;
}

.dark-mode .markdown-editor {
  border-color: #444;
}

.markdown-preview {
  flex: 1;
  padding: 25px 35px;
  overflow-y: auto;
  background-color: #fff;
  max-width: 100%;
  width: 100%;
}

.dark-mode .markdown-preview {
  background-color: #2d2d2d;
  color: #f0f0f0;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3,
.markdown-preview h4,
.markdown-preview h5,
.markdown-preview h6 {
  margin-top: 1.8em;
  margin-bottom: 0.8em;
  line-height: 1.4;
}

.markdown-preview h1 {
  font-size: 2.2em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.4em;
}

.dark-mode .markdown-preview h1 {
  border-color: #444;
}

.markdown-preview h2 {
  font-size: 1.8em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.dark-mode .markdown-preview h2 {
  border-color: #444;
}

.markdown-preview h3 {
  font-size: 1.4em;
}

.markdown-preview h4 {
  font-size: 1.2em;
}

.markdown-preview p {
  line-height: 1.8;
  margin: 1.2em 0;
}

.markdown-preview blockquote {
  border-left: 4px solid #ddd;
  padding: 0.8em 1.2em;
  color: #777;
  margin: 1.2em 0;
  background-color: #f9f9f9;
}

.dark-mode .markdown-preview blockquote {
  border-color: #555;
  color: #aaa;
  background-color: #2a2a2a;
}

.markdown-preview pre {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 20px;
  overflow: auto;
  margin: 1.5em 0;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.dark-mode .markdown-preview pre {
  background-color: #333;
}

.markdown-preview code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.3em 0.5em;
  border-radius: 3px;
  font-size: 90%;
}

.dark-mode .markdown-preview code {
  background-color: rgba(255, 255, 255, 0.1);
}

.markdown-preview table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
  table-layout: fixed;
}

.markdown-preview th, 
.markdown-preview td {
  border: 1px solid #ddd;
  padding: 14px;
  text-align: left;
  word-wrap: break-word;
}

.dark-mode .markdown-preview th,
.dark-mode .markdown-preview td {
  border-color: #444;
}

.markdown-preview th {
  background-color: #f5f5f5;
  text-align: center;
  font-weight: bold;
}

.dark-mode .markdown-preview th {
  background-color: #333;
}

.markdown-preview tr:nth-child(even) {
  background-color: #f9f9f9;
}

.dark-mode .markdown-preview tr:nth-child(even) {
  background-color: #2a2a2a;
}

.markdown-preview img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1.5em auto;
}

.markdown-preview ul,
.markdown-preview ol {
  padding-left: 2em;
  margin: 1.2em 0;
}

.markdown-preview li {
  margin-bottom: 0.5em;
}

/* Tooltip */
.markdown-tooltip {
  position: fixed;
  padding: 8px 12px;
  background-color: #333;
  color: white;
  border-radius: 4px;
  font-size: 0.9rem;
  z-index: 1000;
  max-width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.dark-mode .markdown-tooltip {
  background-color: #444;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
</style> 