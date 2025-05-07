<template>
  <div class="modal-backdrop" v-if="show">
    <div class="modal-content">
      <h2>Tạo file mới</h2>
      <div class="form-group">
        <label for="fileName">Tên file:</label>
        <input type="text" id="fileName" v-model="fileName" placeholder="Nhập tên file (không cần .md)">
      </div>
      <div class="form-group">
        <label for="fileContent">Nội dung:</label>
        <textarea id="fileContent" v-model="content" placeholder="Nhập nội dung Markdown"></textarea>
      </div>
      <div class="modal-actions">
        <button @click="createFile" class="action-button create-button">Tạo</button>
        <button @click="closeModal" class="action-button cancel-button">Hủy</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateFileModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fileName: '',
      content: ''
    }
  },
  methods: {
    createFile() {
      if (!this.fileName || !this.content) {
        alert('Vui lòng nhập tên file và nội dung');
        return;
      }
      
      this.$emit('create', {
        name: this.fileName,
        content: this.content
      });
      
      this.resetForm();
    },
    closeModal() {
      this.resetForm();
      this.$emit('close');
    },
    resetForm() {
      this.fileName = '';
      this.content = '';
    }
  }
}
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
  width: 500px;
  max-width: 90%;
}

.modal-content h2 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.form-group textarea {
  min-height: 200px;
  resize: vertical;
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
  transition: background-color 0.2s;
}

.create-button {
  background-color: var(--success-color);
  color: white;
}

.create-button:hover {
  background-color: #219653;
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
}

.cancel-button:hover {
  background-color: #7f8c8d;
}
</style> 